---
title: "Building a Production-Grade Secure File Upload System with AWS"
description: "A deep dive into implementing enterprise-level file uploads with S3 multipart upload, encryption, role-based access control, and comprehensive monitoring using Node.js and TypeScript"
date: "2025-09-28"
tags: ["AWS", "S3", "security", "file-upload", "multipart", "encryption", "IAM", "Cognito", "CloudWatch", "Node.js", "TypeScript"]
---

# Building a Production-Grade Secure File Upload System with AWS
Most file upload systems are built as an afterthought. You set up a simple endpoint, add some validation for file size, and consider the job done. But when the requirements involve sensitive data, multi-gigabyte files, and enterprise-grade security, that bare-bones approach falls apart.

I recently set out to build a system that could reliably handle everything from small text files to multi-gigabyte archives while enforcing strong security, monitoring, and role-based access control. This isn’t just another “upload to S3” tutorial. It’s about solving real problems that traditional upload systems often ignore.

Large file uploads tend to fail or time out. Weak or missing access controls can expose private data to the wrong users. And without encryption or logging, files in storage or transit are vulnerable targets, with no way to trace misuse if it happens.

To address these gaps, I turned to AWS S3’s multipart upload feature, which allows large files to be broken into smaller, more manageable pieces for upload....making the process more reliable, even over unstable networks. Combined with services like Cognito for authentication, IAM for fine-grained permissions, KMS for encryption, and CloudWatch for monitoring, I was able to design a secure, scalable file upload system that directly tackles these real-world challenges.

## The architecture: More than just file uploads

This system integrates seven AWS services to create something that actually works in production:

- **AWS Cognito** for user authentication with configurable password policies(You can use the traditional database too here)
- **Amazon S3** for scalable file storage with server-side encryption
- **AWS IAM** with three distinct roles and temporary credential management
- **AWS KMS** for customer-managed encryption keys
- **AWS STS** for secure temporary credential generation
- **CloudWatch** for comprehensive monitoring and alerting
- **AWS Lambda** (implied) for serverless processing capabilities

The Node.js/TypeScript backend handles the coordination between these services, providing a clean API interface while managing the complexity underneath.

## Authentication that actually works

Most systems either go too using a simple auth system or rolling their own Auth which is acceptable. My system uses AWS Cognito User Pools, which gives you enterprise features without the maintenance overhead.

The authentication flow looks like this:

```typescript
// POST /auth/login
{
  "email": "admin@example.com", 
  "password": "SecurePass123!"
}

// Response includes role information
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "email": "admin@example.com",
      "role": {
        "role": "admin",
        "roleArn": "arn:aws:iam::account:role/SecureUpload-AdminRole"
      }
    }
  }
}
```

The JWT token contains the user's role, which the backend uses to generate temporary AWS credentials via STS AssumeRole. This means users never get permanent AWS access keys — their credentials expire after one hour, limiting the blast radius if something goes wrong.

## Three-tier role system

Rather than all-or-nothing access, the system implements three distinct roles with specific permissions:

**Admin Role** — Full system access including user management and system monitoring. Can upload, download, delete any file, plus manage other users and view CloudWatch metrics.

**Uploader Role** — Can upload new files and manage their own uploads. This role can generate presigned URLs for uploads, complete multipart uploads, and list their own files, but can't delete files uploaded by others.

**Viewer Role** — Read-only access to files they're authorized to see. Can generate presigned download URLs and list files, but can't upload or modify anything.

All these roles have IAM roles and policies carefully crafted to fit these. For example, the Uploader role policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl", 
        "s3:PutObjectTagging",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::project3tmp/*",
        "arn:aws:s3:::project3tmp"
      ]
    },
    {
      "Effect": "Allow", 
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "arn:aws:kms:eu-north-1:account:key/your-kms-key-id"
    }
  ]
}
```

## Dynamic presigned URL generation with role-based permissions

Here's where the system gets interesting — instead of generating generic presigned URLs, the system creates them based on the authenticated user's specific role and permissions. This happens through a careful orchestration of AWS STS and IAM policies.

The system provides two distinct endpoints for different upload scenarios:

1. **Single file upload** (`/files/upload-url`) - For files under 100MB
2. **Multipart upload** (`/files/multipart/initiate`) - For files larger than 5MB

The client determines which endpoint to use based on file size, but both follow the same security pattern.

### Single file uploads with role-based credentials

When a user requests an upload URL, the backend:

1. **Validates the request** - File size must be under 100MB, content type must be allowed
2. **Extracts the user's role** from their JWT token  
3. **Assumes the appropriate IAM role** using AWS STS based on their permission level
4. **Generates presigned URLs** using the temporary credentials from that assumed role

```typescript
// From the actual FileService implementation
async generateUploadUrl(user: any, uploadRequest: fileUploadRequest): Promise<fileUploadResponse> {
    // First, assume the user's IAM role
    const tempCredentials = await this.assumeUserRole(user);
    
    // Create S3 client with temporary credentials
    const tempS3Client = new S3Client({
        region: config.s3.region,
        credentials: {
            accessKeyId: tempCredentials.accessKeyId,
            secretAccessKey: tempCredentials.secretAccessKey,
            sessionToken: tempCredentials.sessionToken
        }
    });

    const fileId = crypto.randomUUID();
    const cleanFileName = uploadRequest.fileName.replace(/[^a-zA-Z0-9.\-_]/g,'_');
    const timestamp = new Date().toISOString().replace(/[:.]/g,'-');
    const s3Key = `uploads/${timestamp}/${fileId}_${cleanFileName}`;
    
    // Generate presigned URL with role-specific permissions
    const putObjectCommand = new PutObjectCommand({
        Bucket: config.s3.bucketName,
        Key: s3Key,
        ContentType: uploadRequest.contentType,
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: KMS_KEY_ID,
        Metadata: {
            'uploaded-by': user.email,
            'user-id': user.userId,
            'file-id': fileId,
            'user-role': user.role.role,
            'original-name': uploadRequest.fileName,
            'file-size': uploadRequest.fileSize.toString(),
            ...uploadRequest.metadata
        }
    });

    const uploadUrl = await getSignedUrl(tempS3Client, putObjectCommand, { expiresIn: 900 });
    
    return { uploadUrl, fileId, expiresIn: 900, s3Key };
}
```

### The STS assume role process

The `assumeUserRole` method is where the real security magic happens:

```typescript
private async assumeUserRole(user: any): Promise<any> {
    const roleArn = user.role.iamRoleArn; // e.g., 'arn:aws:iam::account:role/SecureUpload-UploaderRole'
    const sessionName = `SecureUpload-${user.email.replace('@', '-')}-${Date.now()}`;
    
    const assumeRoleCommand = new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: sessionName,
        DurationSeconds: 3600 // 1 hour
    });

    const assumeRoleResponse = await this.stsClient.send(assumeRoleCommand);
    
    return {
        accessKeyId: assumeRoleResponse.Credentials.AccessKeyId!,
        secretAccessKey: assumeRoleResponse.Credentials.SecretAccessKey!,
        sessionToken: assumeRoleResponse.Credentials.SessionToken!,
        expiration: assumeRoleResponse.Credentials.Expiration!
    };
}
```

This means:
- **Uploader role users** get temporary credentials that inherit only their specific S3 permissions
- **Viewer role users** can't even call this endpoint (the controller blocks them)  
- **Admin role users** get temporary credentials with broader permissions

### Multipart uploads: Same security, bigger files

For large files, the multipart flow is more complex but follows the same security principles:

```typescript
async initiateMultipartUpload(user: any, uploadRequest: MultipartUploadRequest): Promise<MultipartUploadResponse> {
    // Same role assumption process...
    const tempCredentials = await this.assumeUserRole(user);
    const tempS3Client = new S3Client({
        region: config.s3.region,
        credentials: tempCredentials
    });

    // Create the multipart upload
    const createCommand = new CreateMultipartUploadCommand({
        Bucket: config.s3.bucketName,
        Key: s3Key,
        ContentType: uploadRequest.contentType,
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: KMS_KEY_ID,
        // Same metadata and tagging as single uploads
    });

    const multipartResponse = await tempS3Client.send(createCommand);
    const uploadId = multipartResponse.UploadId!;

    // Generate presigned URLs for each part
    const partSize = uploadRequest.partSize || 100 * 1024 * 1024; // 100MB default
    const totalParts = Math.ceil(uploadRequest.fileSize / partSize);
    
    const partUrls = [];
    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
        const uploadPartCommand = new UploadPartCommand({
            Bucket: config.s3.bucketName,
            Key: s3Key,
            PartNumber: partNumber,
            UploadId: uploadId
        });

        const partUrl = await getSignedUrl(tempS3Client, uploadPartCommand, {
            expiresIn: 3600 // 1 hour for large uploads
        });

        partUrls.push({ partNumber, uploadUrl: partUrl });
    }

    return {
        uploadId,
        fileId,
        partUrls,
        totalParts,
        expiresIn: 3600,
        s3Key
    };
}
```

The key insight is that even the multipart upload URLs are generated using the user's temporary credentials. If their role lacks multipart upload permissions, the whole process fails at the STS assume role step.


### Upload flow examples

# For single uploads, the flow is straightforward:


```typescript
// Request upload URL
POST /files/upload-url
{
  "fileName": "document.pdf",
  "fileSize": 1048576,
  "contentType": "application/pdf",
  "metadata": {
    "description": "Important document",
    "category": "business"
  }
}

// Get presigned URL response
{
  "success": true,
  "data": {
    "uploadUrl": "https://project3tmp.s3.eu-north-1.amazonaws.com/...",
    "fileId": "uuid-here",
    "expiresIn": 900,
    "s3Key": "uploads/2025-09-26/uuid_document.pdf"
  }
}
```

# For large files, the system initiates multipart upload automatically:

```typescript
// Large file multipart initialization
POST /files/multipart/initiate
{
  "fileName": "large-file.zip",
  "fileSize": 524288000, // ~500MB
  "contentType": "application/zip",
  "partSize": 104857600, // 100MB parts
  "metadata": {
    "description": "Large archive file"
  }
}

// Returns presigned URLs for each part
{
  "success": true,
  "data": {
    "uploadId": "multipart_upload_id",
    "fileId": "uuid-here", 
    "partUrls": [
      {
        "partNumber": 1,
        "uploadUrl": "https://s3-presigned-url-part-1"
      },
      // ... more parts
    ],
    "totalParts": 5,
    "expiresIn": 3600
  }
}
```

## NB:
To perform the actual upload, the client or user uses the presigned URLs provided in the response. For single uploads, they perform a simple PUT request to the `uploadUrl`. For multipart uploads, they upload each part using the corresponding `uploadUrl` for that part number.
The parameters passed into these uploads must match those specified during the presigned URL generation, including content type and any required headers.




## Encryption everywhere

The system implements defense in depth with multiple layers of encryption. All API communication uses HTTPS with TLS 1.2+, ensuring data in transit is protected.

For data at rest, every file is encrypted using AWS KMS with customer-managed keys. The S3 bucket is configured with mandatory encryption:

```yaml
BucketEncryption:
  ServerSideEncryptionConfiguration:
    - ServerSideEncryptionByDefault:
        SSEAlgorithm: aws:kms
        KMSMasterKeyID: !Ref UploadKMSKey
```

This means even if someone gains direct S3 access, they can't read the files without also having KMS permissions. The encryption is transparent to the application — S3 handles encryption on write and decryption on read automatically.

## Comprehensive monitoring and observability

Production systems need visibility into what's happening. This system tracks detailed metrics across multiple dimensions:

**Performance Metrics:**
- `ApiRequestDuration` - Response time for each endpoint
- `UploadSpeed` - Actual file transfer rates
- `UploadDuration` - End-to-end upload completion time
- `MultipartPartCount` - Distribution of multipart upload complexity

**Business Metrics:**
- `UploadCount` - Success/failure rates by user role
- `FileSize` - Distribution of uploaded file sizes
- `ApiRequestCount` - Usage patterns by endpoint

**Security Metrics:**
- Authentication failure rates
- Unauthorized access attempts
- Unusual download patterns

All logs use structured JSON format for easy parsing:

```json
{
  "timestamp": "2025-09-26T10:30:00.000Z",
  "level": "INFO", 
  "message": "Upload completed successfully",
  "metadata": {
    "fileId": "abc-123",
    "fileName": "document.pdf",
    "fileSize": 1048576,
    "uploadSpeed": "2.5 MB/s",
    "userEmail": "user@example.com",
    "userRole": "uploader",
    "duration": 412,
    "s3Key": "uploads/2025-09-26/abc-123_document.pdf"
  }
}
```

CloudWatch automatically aggregates these metrics and can trigger alerts when things go wrong — like API response times exceeding 5 seconds or upload failure rates spiking above normal levels.

## Real-world performance characteristics

After testing with files ranging from kilobytes to gigabytes, here's what the system actually delivers:

- **Small files (< 10MB)**: Single upload, 5-15 MB/s typical speed
- **Medium files (10-100MB)**: Single upload, 10-25 MB/s
- **Large files (> 100MB)**: Multipart upload, 15-50 MB/s
- **Maximum supported**: 5GB per file

API response time targets are aggressive:
- Authentication: < 500ms
- Upload URL generation: < 1000ms  
- Multipart initialization: < 2000ms
- File listing: < 3000ms

The system handles concurrent uploads gracefully, limited mainly by AWS service quotas rather than application bottlenecks.


## What this solves in practice

This isn't just a technical exercise — it addresses real business problems:

**Scalability**: Handles everything from tiny documents to multi-gigabyte files without choking
**Security**: Multi-layer encryption, temporary credentials, and audit trails satisfy enterprise security requirements
**Reliability**: Multipart uploads mean large file uploads actually complete successfully
**Compliance**: Comprehensive logging provides the audit trails required for regulated industries
**User Experience**: Smart upload handling and progress tracking means users aren't left wondering what happened

The architecture patterns are reusable across different use cases — document management systems, media upload services, backup solutions, or any application that needs to handle file uploads at scale while maintaining security.

## The implementation details

The codebase is structured as a proper enterprise application:

```
app/
├── config/           # AWS service configurations
├── controllers/      # Request handlers for auth and file operations  
├── middlewares/      # JWT validation, CloudWatch metrics
├── routes/          # API route definitions
├── services/        # Business logic for AWS integration
├── utils/           # Logging and shared utilities
└── server.ts        # Express application entry point
```

Key dependencies include AWS SDK v3 for modern async/await support, Express.js for the web framework, and comprehensive TypeScript typing for maintainability.

This system proves that you can build something robust without sacrificing developer experience or operational simplicity. The AWS services handle the heavy lifting, the code focuses on business logic, and the result is a file upload system that actually works in production.


## GitHub Repository

You can find the complete source code for this secure file upload system on GitHub:

[**Secure File Upload System**](https://github.com/basit-devBE/Secure-FIle-Upload)