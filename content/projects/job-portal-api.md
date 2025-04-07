---
title: "Job Portal API"
description: "A full-featured backend API for job listings, applications, and recruitment processes built with Node.js and Express."
date: "2023-12-05"
tags: ["personal", "backend", "javascript", "api", "recruitment"]
featured: true
github: "https://github.com/basit-devBE/Job-Portal-API"
---

# Job Portal API

A comprehensive backend solution powering modern job boards and recruitment platforms, built with JavaScript, Express, and MongoDB.

## Core Features

### For Job Seekers
- **User Profiles**: Create and manage professional profiles
- **Job Discovery**: Search, filter, and apply for positions
- **Application Tracking**: Monitor application status
- **Resume Management**: Upload and manage multiple resume versions
- **Automated Notifications**: Receive alerts for application updates and matching positions

### For Employers
- **Company Profiles**: Create branded company pages
- **Job Posting Management**: Create, edit, and manage listings
- **Applicant Review**: Review and manage candidate applications
- **Candidate Matching**: AI-powered candidate recommendation
- **Recruitment Analytics**: Track application metrics and conversion rates

## Technical Architecture

The API is built on a modern stack optimized for performance and scalability:

- **Node.js & Express**: Fast, non-blocking backend
- **MongoDB**: Flexible document storage for user and job data
- **Handlebars**: Templating for email notifications
- **JWT Authentication**: Secure user sessions and role-based access
- **Cron Jobs**: Scheduled tasks for regular maintenance and notifications

## Implementation Highlights

### Intelligent Job Matching

```javascript
// Example of the job matching algorithm
const findMatchingCandidates = async (jobId) => {
  const job = await Job.findById(jobId).lean();
  
  // Extract key skills and requirements
  const jobSkills = job.requiredSkills.map(skill => skill.toLowerCase());
  const jobExperience = job.experienceRequired;
  
  // Find candidates with matching skills
  const matchingCandidates = await User.find({
    role: 'jobseeker',
    'skills': { $in: jobSkills },
    'experience': { $gte: jobExperience }
  }).sort({ 
    // Sort by skill match percentage
    $expr: {
      $divide: [
        { $size: { $setIntersection: ['$skills', jobSkills] } },
        { $size: jobSkills }
      ]
    }
  }).limit(20);
  
  return matchingCandidates;
};
