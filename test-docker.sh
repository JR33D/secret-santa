#!/bin/bash

# Secret Santa Docker Test Script
# This script tests the Docker build and basic functionality

set -e

echo "🎅 Secret Santa Docker Test Script"
echo "===================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

IMAGE_NAME="secret-santa-app:test"
CONTAINER_NAME="secret-santa-test"

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
    docker volume rm secret-santa-test-data 2>/dev/null || true
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Step 1: Build the image
echo -e "\n${YELLOW}📦 Step 1: Building Docker image...${NC}"
if docker build -t $IMAGE_NAME .; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

# Step 2: Check image size
echo -e "\n${YELLOW}📊 Step 2: Checking image size...${NC}"
IMAGE_SIZE=$(docker images $IMAGE_NAME --format "{{.Size}}")
echo -e "Image size: ${GREEN}$IMAGE_SIZE${NC}"

# Step 3: Run the container
echo -e "\n${YELLOW}🚀 Step 3: Starting container...${NC}"
docker run -d \
    --name $CONTAINER_NAME \
    -p 3001:3000 \
    -v secret-santa-test-data:/app/data \
    $IMAGE_NAME

# Wait for container to be healthy
echo -e "${YELLOW}⏳ Waiting for container to be ready...${NC}"
sleep 10

# Step 4: Check if container is running
echo -e "\n${YELLOW}🔍 Step 4: Checking container status...${NC}"
if docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${GREEN}✅ Container is running!${NC}"
else
    echo -e "${RED}❌ Container failed to start!${NC}"
    docker logs $CONTAINER_NAME
    exit 1
fi

# Step 5: Test HTTP endpoint
echo -e "\n${YELLOW}🌐 Step 5: Testing HTTP endpoint...${NC}"
sleep 5  # Give it a bit more time
if curl -f -s http://localhost:3001 > /dev/null; then
    echo -e "${GREEN}✅ Application is responding!${NC}"
else
    echo -e "${RED}❌ Application is not responding!${NC}"
    echo "Container logs:"
    docker logs $CONTAINER_NAME
    exit 1
fi

# Step 6: Check health status
echo -e "\n${YELLOW}💚 Step 6: Checking health status...${NC}"
HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' $CONTAINER_NAME 2>/dev/null || echo "no healthcheck")
echo -e "Health status: ${GREEN}$HEALTH_STATUS${NC}"

# Step 7: View logs
echo -e "\n${YELLOW}📝 Step 7: Recent logs...${NC}"
docker logs --tail 20 $CONTAINER_NAME

# Step 8: Check volume
echo -e "\n${YELLOW}💾 Step 8: Checking data volume...${NC}"
if docker volume inspect secret-santa-test-data > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Data volume created successfully!${NC}"
else
    echo -e "${RED}❌ Data volume not found!${NC}"
    exit 1
fi

# Success!
echo -e "\n${GREEN}🎉 All tests passed!${NC}"
echo -e "\n${YELLOW}📋 Summary:${NC}"
echo -e "  Image: $IMAGE_NAME"
echo -e "  Size: $IMAGE_SIZE"
echo -e "  Container: $CONTAINER_NAME"
echo -e "  Port: http://localhost:3001"
echo -e "  Health: $HEALTH_STATUS"
echo -e "\n${YELLOW}To view the application, open: http://localhost:3001${NC}"
echo -e "${YELLOW}To stop the test container: docker stop $CONTAINER_NAME${NC}"
echo -e "${YELLOW}Container will be cleaned up automatically when script exits.${NC}"

# Keep container running for manual testing
echo -e "\n${YELLOW}Press Ctrl+C to cleanup and exit...${NC}"
read -r -d '' _ </dev/tty