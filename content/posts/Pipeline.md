---
title: "My CI/CD Pipeline: Docker, GitHub Actions, and ECR"
description: "Set up a Laravel + Next.js app to build, push, and deploy with Docker, ECR, and a self-hosted runner."
date: "2025-09-03"
tags: ["CI/CD", "DevOps", "Docker", "GitHub Actions", "AWS", "ECR"]
---

# CI/CD for my Laravel + Next.js app

I set up a pipeline that builds Docker images for a Laravel backend and a Next.js frontend, pushes them to AWS ECR, and deploys with Docker Compose on a self-hosted server. The goal was a simple and repeatable setup.

Below is the setup, plus a few issues I ran into and what I learned.

## Architecture at a glance

- Code on GitHub (master branch)
- Two GitHub Actions workflows:
	- CI: build and push images to ECR
	- CD: pull images on my server and restart Docker Compose
- AWS ECR for image registry
- Self-hosted runner (Linux server) for deployment (same machine that runs Docker Compose)
- Docker Compose services:
	- Postgres, Redis
	- Backend (Laravel, `php artisan serve`)
	- Frontend (Next.js, `npm start`)

## CI: Build and push images

The CI workflow (`.github/workflows/ci.yml`) runs on pushes/PRs to `master`. It:

1) Logs into ECR
2) Builds and tags both backend and frontend images with:
	 - the commit SHA
	 - `latest`
3) Pushes both tags to ECR

Key bits from my workflow:

```yaml
name: CI/CD Pipeline
on:
	push:
		branches: [ master ]
	pull_request:
		branches: [ master ]

jobs:
	build:
		runs-on: ubuntu-latest
		steps:
			- uses: actions/checkout@v2
			- uses: aws-actions/configure-aws-credentials@v2
				with:
					aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
					aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
					aws-region: eu-north-1
			- uses: aws-actions/amazon-ecr-login@v1
				id: login-ecr

			- name: Build and Push Backend Docker Images
				run: |
					docker build -t 303759786442.dkr.ecr.eu-north-1.amazonaws.com/azubi-cls-backend:${{ github.sha }} ./back-end
					docker build -t 303759786442.dkr.ecr.eu-north-1.amazonaws.com/azubi-cls-backend:latest ./back-end
					docker push 303759786442.dkr.ecr.eu-north-1.amazonaws.com/azubi-cls-backend:${{ github.sha }}
					docker push 303759786442.dkr.ecr.eu-north-1.amazonaws.com/azubi-cls-backend:latest

			- name: Build and Push Frontend Docker Images
				run: |
					docker build -t 303759786442.dkr.ecr.eu-north-1.amazonaws.com/azubi-cls-frontend:${{ github.sha }} ./front-end
					docker build -t 303759786442.dkr.ecr.eu-north-1.amazonaws.com/azubi-cls-frontend:latest ./front-end
					docker push 303759786442.dkr.ecr.eu-north-1.amazonaws.com/azubi-cls-frontend:${{ github.sha }}
					docker push 303759786442.dkr.ecr.eu-north-1.amazonaws.com/azubi-cls-frontend:latest
```

Notes on tagging:

- I push both the commit SHA and `latest`. The SHA gives an immutable reference per build; `latest` is convenient for default deploys.
- No build cache optimizations yet; kept simple.

## CD: Pull and restart Compose

The deployment workflow (`.github/workflows/cd.yml`) triggers on CI completion. It runs on my self-hosted runner (same machine that runs Docker Compose):

1) Logs in to ECR
2) Pulls both `latest` images
3) Restarts services via Docker Compose
4) Prunes old images

```yaml
name: Deployment Pipeline
on:
	workflow_run:
		workflows: ["CI/CD Pipeline"]
		types: [ completed ]

jobs:
	deploy:
		runs-on: self-hosted
		steps:
			- uses: aws-actions/configure-aws-credentials@v2
				with:
					aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
					aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
					aws-region: eu-north-1
			- uses: aws-actions/amazon-ecr-login@v1
			- run: |
					docker pull 303759786442.dkr.ecr.eu-north-1.amazonaws.com/azubi-cls-backend:latest
					docker pull 303759786442.dkr.ecr.eu-north-1.amazonaws.com/azubi-cls-frontend:latest
			- name: Restart Docker Compose services
				working-directory: /home/basit/Desktop/github_projects/CI-CD Pipeline
				run: |
					docker compose down
					docker compose up -d
			- run: docker image prune -af
```

		### Runner and working directory

		- The job uses a self-hosted runner: `runs-on: self-hosted`. I installed the GitHub Actions runner on the same server that runs Docker and Docker Compose.
		- The `working-directory` is set to the Compose folder: `/home/basit/Desktop/github_projects/CI-CD Pipeline`. This ensures `docker compose` runs where the `docker-compose.yaml` file lives.
		- On the runner, Docker must be available to the runner user (e.g., user in the `docker` group) so the deploy step can pull images and restart services.

## Runtime: Docker Compose

Compose file (`docker-compose.yaml`) defines the app network and services. The key is that everything runs on the same internal bridge network so services can talk to each other by service name.

Highlights:

- Shared bridge network: `app-network`
- Backend reachable as `http://backend:8000` from other containers
- Postgres reachable as `postgres:5432`, Redis as `redis:6379`

```yaml
services:
	backend:
		image: 303759786442.dkr.ecr.eu-north-1.amazonaws.com/azubi-cls-backend:latest
		environment:
			DB_HOST: postgres
			REDIS_HOST: redis
		networks: [ app-network ]

	frontend:
		image: 303759786442.dkr.ecr.eu-north-1.amazonaws.com/azubi-cls-frontend:latest
		environment:
			- BACKEND_API_HOST=http://backend:8000
		depends_on: [ backend ]
		networks: [ app-network ]

networks:
	app-network:
		driver: bridge
```

Note: In containers, prefer service names (internal DNS) over host IPs.

## Challenges I hit (and what I learned)

### 1) Networking after deploy

I initially pointed the frontend to `http://172.17.0.1:8000`. It “worked” in some cases, but it’s unreliable and depends on Docker’s host networking details. The fix was to use the internal Docker DNS name: `http://backend:8000`. Once I switched to service-to-service via the bridge network, requests were reliable.

Lesson: Containers should communicate on the Docker internal network using service names, not host IPs.

### 2) Secrets management

I used GitHub Secrets for AWS credentials in both CI and CD. This kept sensitive values out of the repo and logs. It also made it easy to rotate keys without changing code.

Lesson: Put anything sensitive (AWS keys, registry creds, DB passwords) in GitHub Secrets or the runner’s secret store—don’t commit them.

Possible improvement: Switch to GitHub OIDC for AWS (no long-lived keys) and use GitHub Environments for environment-specific protection.

### 3) Tagging and rollbacks

Pushing both `latest` and `${{ github.sha }}` gives me a fast default and a precise rollback target. If `latest` misbehaves, I can pin Compose to a known-good SHA tag and redeploy.

## What I’d improve next

- Use OIDC instead of static AWS keys in Actions
- Add healthchecks to Compose and wait-for-it for DB readiness
- Externalize `POSTGRES_PASSWORD` into secrets/`.env`
- Parameterize `BACKEND_API_HOST` per environment (dev/stage/prod)
- Add a quick smoke test step post-deploy

## This was a project to learn CI/CD basics with Docker, GitHub Actions, and AWS ECR. It’s a simple setup but covers the core concepts of building, pushing, and deploying containerized apps. From here, I hope to iterate and improve as I learn more about DevOps best practices.