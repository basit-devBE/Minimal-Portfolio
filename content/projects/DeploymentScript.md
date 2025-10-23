---
title: "Production Grade Automated Deployment Script"
description: "A practical, repeatable deployment workflow using Bash, SSH, Docker, Docker Compose, and Nginx."
date: "2025-10-23"
tags: ["DevOps", "Bash", "Docker", "Docker Compose", "Nginx", "SSH", "Automation"]
github: "https://github.com/basit-devBE/Deployment-Script"

---

# Production Grade Automated Deployment Script

I recently took on a project to write a Bash script that deploys applications to remote servers, installs Docker and Docker Compose, configures Nginx as a reverse proxy, builds and runs containers, and verifies the app is actually reachable over HTTP. The goal was to go from a fresh VM to a working, proxied app without manual tweaking.

Along the way I hit a few bumps, mostly on the Nginx side while wiring the reverse proxy. This write up walks through what I built, what went wrong, and the exact pieces that made it reliable.


## What the script does

At a high level, the script:

- Collects inputs interactively and validates them
- Clones a Git repository with a personal access token while masking the token in logs
- Detects Docker configuration in the repo and refuses to proceed if none is found
- Verifies SSH connectivity and hardens permissions on the key
- Prepares the remote host by installing Docker, Docker Compose, and Nginx if missing
- Packages the repo, transfers it efficiently, and extracts it on the server
- Builds and runs containers with docker compose if present, or a plain Dockerfile if not
- Performs health checks, tails logs, and confirms that containers are running
- Configures Nginx as a reverse proxy for clean access on port 80
- Prints final endpoints and writes a timestamped log file for traceability

 

## Safety first

There are several guardrails to keep deploys safe and repeatable:

- Exit codes are explicit for common failure classes
	- 0 success
	- 1 invalid input
	- 2 SSH failure
	- 3 Docker or remote deployment failure
- All actions are logged to a file named with the current timestamp
- The personal access token never appears in logs
- Inputs are validated before work begins
	- URL format, non empty token, branch presence
	- SSH key path must exist
	- Port must be a number within 1 to 65535
- Cleanup runs on exit to remove temporary archives and folders
- Remote commands use set -e to fail fast and avoid partial state
- Docker commands fall back to sudo automatically when needed

## How it works step by step

### 1. Inputs

You provide:

- Git repository URL
- Personal Access Token for cloning over HTTPS
- Branch name with a sensible default
- SSH username, server IP, and private key path
- Application container port with a sensible default

### 2. Repository clone with token masking

The script checks access first using git ls-remote, then clones using the branch you specify. The token is stripped from any command output before it is logged.

```bash
# Clone while masking the token from logs
if git clone -b "$BRANCH" "$AUTH_URL" repo_temp 2>&1 | grep -v "$ACCESS_TOKEN" | tee -a "$LOG_FILE"; then
	echo "Repository cloned successfully"
fi
```

### 3. Docker configuration detection

The deploy stops early if the repository does not include any of these files:

- docker-compose.yml or docker-compose.yaml
- Dockerfile

### 4. SSH check and remote preparation

The script verifies SSH connectivity and then prepares the remote machine:

- Installs Docker using the official convenience script if it is not installed
- Adds the user to the docker group and starts the service
- Installs docker compose from the package manager if missing
- Installs and enables Nginx if missing

SSH connectivity test:

```bash
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o BatchMode=yes \
	-i "$SSH_KEY_PATH" "$USERNAME@$SERVER_IP" "echo 'SSH connection successful'"
```

### 5. Transfer and extraction

The repository is archived locally with common build and cache folders excluded, then copied to the server and extracted in the home directory.

### 6. Build and run

Two paths are supported:

- docker compose present: compose down, then up with build in detached mode
- Dockerfile present only: docker build to an image, then docker run with restart policy

The script waits briefly for startup, prints container status and recent logs, and checks that something is actually running.

Snippet from the deploy step:

```bash
if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
	$COMPOSE_CMD up -d --build
else
	$DOCKER_CMD build -t my_app_image .
	$DOCKER_CMD run -d -p $APP_PORT:$APP_PORT --name my_app_container --restart unless-stopped my_app_image
fi
```

### 7. Health checks and port tests

The script:

- Verifies listening on the chosen port with netstat
- Hits http://localhost:PORT several times with curl to account for cold starts

Health check loop:

```bash
max_attempts=5
attempt=1
while [ $attempt -le $max_attempts ]; do
	echo "Attempt $attempt/$max_attempts: Testing http://localhost:$APP_PORT"
	if curl -f -m 10 http://localhost:$APP_PORT >/dev/null 2>&1; then
		echo "Application is responding on port $APP_PORT"
		break
	else
		[ $attempt -lt $max_attempts ] && sleep 5
	fi
	attempt=$((attempt + 1))
done
```

### 8. Nginx reverse proxy

The script removes the default site and writes a minimal server block that proxies to the app container port. It tests the Nginx configuration and reloads it if valid.

Result:

- Direct access on http://SERVER_IP:PORT
- Clean access on http://SERVER_IP through Nginx

## How to use it

### Prerequisites

- Ubuntu or Debian based remote server with public IP
- SSH key based access
- A repository that contains either a Dockerfile or a docker compose file
- A personal access token if the repository is private

### Quick start

On your local machine:

```bash
chmod +x deploy.sh
./deploy.sh
```

Follow the prompts. Provide the repository URL, token, branch, SSH details, and the application port. The script will do the rest and print two URLs at the end.

## Configuration you can change

These are easy to adapt if your setup is different:

- Container names and image tags when using a plain Dockerfile
- Nginx server_name and any extra headers or timeouts
- docker compose environment variables through your own compose file
- Health check timing for slow starters

## Edge cases it handles

- Branch missing on first clone, with a retry that checks out the branch explicitly
- Port already in use, with a warning and a stop attempt for previous containers
- Hosts where docker requires sudo, handled automatically
- First time Docker installs where group membership requires a new login, handled by using sudo during this session
- Slow application startup, handled by retries and log printing

## What I would add next

- HTTPS with automatic certificates through Certbot or an external load balancer
- Blue green or rolling strategy to avoid downtime during rebuilds
- Rollback to a previous image or compose version
- Basic secret management using environment files or a vault
- Notifications to Slack or email on success and failure

## Challenges

Getting the reverse proxy right took a few iterations. Here are the issues I ran into and how I fixed them:

- Default site still enabled on port 80, taking precedence over my app server block
	- Fix: remove the default site and enable only the app config
- Proxying to the wrong target or a port that was not listening on the host
	- Fix: ensure the container publishes the same port the app listens on using -p APP_PORT:APP_PORT, or update the proxy target accordingly
- Missing WebSocket headers causing real time features to break
	- Fix: add Upgrade and Connection headers to support WebSockets through the proxy
- Nginx reloads with a broken config
	- Fix: always run nginx -t before reload and abort if the test fails

This is the server block the script writes on the remote host:

```nginx
server {
	listen 80;
	server_name SERVER_PUBLIC_IP _;

	location / {
		proxy_pass http://localhost:APP_PORT;
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;

		# WebSocket support
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "upgrade";
        
		# Timeouts
		proxy_connect_timeout 60s;
		proxy_send_timeout 60s;
		proxy_read_timeout 60s;
	}
}
```

And the enable flow the script uses:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/app
sudo nginx -t && sudo systemctl reload nginx
```

A candid note: even after these fixes, I still could not get the reverse proxy to behave exactly the way I wanted on the first pass. I did not ship the perfect config, but I learned a lot about how Nginx prioritizes sites, how headers impact WebSockets, and why testing with nginx -t before reload saves time.

## Closing thoughts

This script  readable. It does one thing well. It turns a fresh server into a running, proxied container deployment in a few minutes while making every step visible. If you prefer predictable deploys you can reason about, this approach works.

