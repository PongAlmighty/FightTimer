#!/bin/bash

# Auto-update script for FightTimer Docker container
# Place this on each target machine and set up as a cron job

# Change to the directory containing docker-compose.yml
cd "$(dirname "$0")"

echo "$(date): Checking for updates to FightTimer container..."

# Pull the latest image
docker pull themightypong/fighttimer-web:latest

# Check if pull was successful
if [ $? -eq 0 ]; then
  echo "$(date): New image pulled successfully, restarting container..."
  
  # Restart the container with the new image
  docker compose down
  docker compose up -d
  
  echo "$(date): Container updated and restarted."
else
  echo "$(date): No updates available or error pulling image."
fi
