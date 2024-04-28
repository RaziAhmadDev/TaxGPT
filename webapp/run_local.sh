#!/bin/bash

# Variables
IMAGE_NAME="taxgpt-webapp"
PORT=3000

# Echo commands
set -x

# Stop and remove existing container
echo "Checking for existing container..."
if [ $(docker ps -aq -f name=${IMAGE_NAME}) ]; then
    echo "Removing existing container..."
    docker stop ${IMAGE_NAME}
    docker rm ${IMAGE_NAME}
fi

# Run the Docker image
echo "Running Docker image..."
docker run -p ${PORT}:${PORT} --name ${IMAGE_NAME} ${IMAGE_NAME}

# Check if Docker run was successful
if [ $? -eq 0 ]; then
    echo "Docker container is running on port ${PORT}."
else
    echo "Failed to start Docker container, please check the errors."
    exit 1
fi
