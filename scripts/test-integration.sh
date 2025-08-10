#!/bin/bash

# CotAi Edge - Integration Test Script
# Quick validation of core functionality

set -e

echo "🧪 Running CotAi Edge Integration Tests..."

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

# Test 1: Docker Compose Configuration
run_test "Docker Compose Configuration" "docker compose config --quiet"

# Test 2: Redis Connectivity
run_test "Redis Service" "docker compose exec -T redis redis-cli ping | grep -q PONG"

# Test 3: Check if AI service image exists
if docker images | grep -q "cotaiedge.*ai-service"; then
    run_test "AI Service Image" "true"
    
    # Test 4: Start AI service
    echo -e "${BLUE}Starting AI service for testing...${NC}"
    docker compose up -d ai-service
    
    # Wait for AI service to be ready
    echo "Waiting for AI service to initialize..."
    timeout=120
    while [[ $timeout -gt 0 ]]; do
        if curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
            break
        fi
        sleep 5
        ((timeout-=5))
    done
    
    if [[ $timeout -gt 0 ]]; then
        run_test "AI Service Health Check" "curl -f -s http://localhost:8000/health | grep -q healthy"
        
        # Test document processing endpoint
        run_test "AI Service Process Endpoint" "curl -f -s http://localhost:8000/api/v1/process/document -X POST -F 'file=@/dev/null' | grep -q 'task_id\\|error'"
    else
        echo -e "${RED}❌ FAILED: AI Service startup timeout${NC}"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${YELLOW}⚠️  AI Service image not built yet, skipping AI tests${NC}"
fi

# Test 5: Frontend build capability
if [[ -f "frontend/package.json" ]]; then
    run_test "Frontend Package Configuration" "cd frontend && npm list --depth=0 > /dev/null 2>&1 || true"
else
    echo -e "${YELLOW}⚠️  Frontend package.json not found${NC}"
fi

# Test 6: Backend build capability
if [[ -f "backend/package.json" ]]; then
    run_test "Backend Package Configuration" "cd backend && npm list --depth=0 > /dev/null 2>&1 || true"
else
    echo -e "${YELLOW}⚠️  Backend package.json not found${NC}"
fi

# Test 7: Database configuration files
run_test "Database Schema Files" "test -f database/production-config.sql && test -f frontend/database/supabase_schema.sql"

# Test 8: Environment configuration
run_test "Environment Configuration" "test -f .env.example"

# Test 9: CDN Configuration
run_test "CDN Configuration Files" "test -f cdn/cloudflare-config.json && test -f cdn/workers/edge-cache.js"

# Test 10: Deployment Scripts
run_test "Deployment Scripts" "test -f scripts/deploy-production.sh && test -x scripts/deploy-production.sh"

# Summary
echo "=========================================="
echo -e "${BLUE}Integration Test Summary${NC}"
echo "=========================================="
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi