#!/bin/bash

# CotAi Edge - Simple Docker Test Script
# Test basic Docker functionality without complex dependencies

set -e

echo "🐳 Testing CotAi Edge Docker Components..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}Testing: $test_name${NC}"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        ((TESTS_FAILED++))
    fi
    echo
}

# Test 1: Docker is available
run_test "Docker Availability" "docker --version"

# Test 2: Docker Compose is available
run_test "Docker Compose Availability" "docker compose version"

# Test 3: Docker Compose Configuration
run_test "Docker Compose Configuration" "docker compose config --quiet"

# Test 4: Redis Container
echo -e "${BLUE}Testing Redis Container...${NC}"
if docker compose ps redis | grep -q "healthy"; then
    echo -e "${GREEN}✅ PASSED: Redis Container Health${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Redis not healthy, testing connectivity...${NC}"
    if docker compose exec -T redis redis-cli ping | grep -q PONG; then
        echo -e "${GREEN}✅ PASSED: Redis Connectivity${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAILED: Redis Connectivity${NC}"
        ((TESTS_FAILED++))
    fi
fi
echo

# Test 5: Network Configuration
run_test "Docker Network" "docker network ls | grep -q cotai-network"

# Test 6: Volume Configuration
run_test "Docker Volumes" "docker volume ls | grep -q cotaiedge"

# Test 7: Image Availability
echo -e "${BLUE}Testing Docker Images...${NC}"
if docker images | grep -q "redis.*alpine"; then
    echo -e "${GREEN}✅ PASSED: Redis Image Available${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED: Redis Image Missing${NC}"
    ((TESTS_FAILED++))
fi

if docker images | grep -q "cotaiedge.*ai-service"; then
    echo -e "${GREEN}✅ PASSED: AI Service Image Available${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  AI Service Image not found (building in progress)${NC}"
fi
echo

# Test 8: Basic HTTP connectivity
if command -v curl > /dev/null 2>&1; then
    run_test "HTTP Tools Available" "curl --version"
    
    # Test Redis connection through Docker
    if docker compose ps redis | grep -q "healthy\|Up"; then
        run_test "Redis Port Access" "nc -z localhost 6380 || telnet localhost 6380 < /dev/null"
    fi
else
    echo -e "${YELLOW}⚠️  curl not available, skipping HTTP tests${NC}"
fi

# Test 9: File System Permissions
run_test "Docker Socket Permissions" "docker info > /dev/null 2>&1"

# Test 10: Resource Usage
echo -e "${BLUE}Testing Resource Usage...${NC}"
docker system df
echo

# Summary
echo "=========================================="
echo -e "${BLUE}Simple Docker Test Summary${NC}"
echo "=========================================="
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

# Container Status
echo -e "${BLUE}Container Status:${NC}"
docker compose ps 2>/dev/null | head -10

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "${GREEN}🎉 Basic Docker setup is working!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed, but basic functionality may still work${NC}"
    exit 1
fi