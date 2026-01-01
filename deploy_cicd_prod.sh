#!/bin/bash
# CI/CD Deployment script for Frontend Prod (Optimized for uptime)

# 1. Build image first while old container is still running
echo "Building Frontend Prod..."
docker compose \
  -p goouty-frontend-prod \
  -f docker-compose.prod.yml \
  --env-file .env.prod \
  build

# 2. Update containers (Docker will swap them with minimal downtime)
echo "Updating Frontend Prod container..."
docker compose \
  -p goouty-frontend-prod \
  -f docker-compose.prod.yml \
  --env-file .env.prod \
  up -d
