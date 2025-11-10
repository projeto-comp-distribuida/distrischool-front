#!/bin/bash

# DistriSchool API Gateway Test Script
# This script helps test the API Gateway configuration

echo "🚀 DistriSchool API Gateway Test Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local url=$1
    local service_name=$2
    
    echo -e "\n${YELLOW}Testing $service_name endpoint: $url${NC}"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10)
    
    if [ "$response" = "200" ] || [ "$response" = "404" ]; then
        echo -e "${GREEN}✅ Gateway is responding (HTTP $response)${NC}"
    else
        echo -e "${RED}❌ Gateway not responding (HTTP $response)${NC}"
    fi
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if containers are running
echo -e "\n${YELLOW}Checking if API Gateway container is running...${NC}"
if docker ps | grep -q "distrischool-api-gateway-dev"; then
    echo -e "${GREEN}✅ API Gateway container is running${NC}"
else
    echo -e "${RED}❌ API Gateway container is not running${NC}"
    echo -e "${YELLOW}Building and starting API Gateway...${NC}"
    docker-compose up -d --build api-gateway-dev
    sleep 15
fi

# Wait for gateway to be ready
echo -e "\n${YELLOW}Waiting for API Gateway to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://192.168.1.7:8080/actuator/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API Gateway is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Test gateway endpoints
echo -e "\n${YELLOW}Testing API Gateway endpoints...${NC}"

# Test actuator health endpoint
test_endpoint "http://192.168.1.7:8080/actuator/health" "Gateway Health"

# Test route endpoints (these will return 404 if services aren't running, but gateway should respond)
test_endpoint "http://192.168.1.7:8080/api/auth/health" "Auth Service Route"
test_endpoint "http://192.168.1.7:8080/api/students/health" "Student Service Route"
test_endpoint "http://192.168.1.7:8080/api/teachers/health" "Teacher Service Route"

# Test CORS
echo -e "\n${YELLOW}Testing CORS configuration...${NC}"
cors_response=$(curl -s -H "Origin: http://192.168.1.7:3000" \
                     -H "Access-Control-Request-Method: GET" \
                     -H "Access-Control-Request-Headers: X-Requested-With" \
                     -X OPTIONS \
                     http://192.168.1.7:8080/api/auth/health \
                     -w "%{http_code}" \
                     -o /dev/null)

if [ "$cors_response" = "200" ]; then
    echo -e "${GREEN}✅ CORS is properly configured${NC}"
else
    echo -e "${RED}❌ CORS configuration issue (HTTP $cors_response)${NC}"
fi

echo -e "\n${YELLOW}Gateway Configuration Summary:${NC}"
echo "• Gateway URL: http://192.168.1.7:8080"
echo "• Auth Service: http://192.168.1.7:8080/api/auth/**"
echo "• Student Service: http://192.168.1.7:8080/api/students/**"
echo "• Teacher Service: http://192.168.1.7:8080/api/teachers/**"
echo "• Health Check: http://192.168.1.7:8080/actuator/health"

echo -e "\n${GREEN}🎉 API Gateway test completed!${NC}"
