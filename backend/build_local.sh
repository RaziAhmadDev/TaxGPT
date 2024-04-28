#!/bin/bash

# Variables
IMAGE_NAME="flask-app"

# Build the Docker image
echo "Building Docker image..."
docker build -t ${IMAGE_NAME} .

# Check if Docker build was successful
if [ $? -eq 0 ]; then
    echo "Docker image built successfully."
else
    echo "Docker build failed, exiting..."
    exit 1
fi
