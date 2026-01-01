#!/bin/bash
# CI/CD Deployment script for Frontend Dev (Optimized for uptime)

# 1. Build image first while old container is still running
echo "Building Frontend Dev..."
docker compose \
  -p goouty-frontend-dev \
  -f docker-compose.dev.yml \
  --env-file .env.dev \
  build

# 2. Update containers (Docker will swap them with minimal downtime)
echo "Updating Frontend Dev container..."
docker compose \
  -p goouty-frontend-dev \
  -f docker-compose.dev.yml \
  --env-file .env.dev \
  up -d
