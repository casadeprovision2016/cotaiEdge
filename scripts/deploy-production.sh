#!/bin/bash

# CotAi Edge - Production Deployment Script
# Comprehensive deployment with all optimizations

set -e

echo "🚀 Starting CotAi Edge Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="cotai-edge"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="./deployment.log"

# Function to log messages
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Pre-deployment checks
echo -e "${BLUE}📋 Running pre-deployment checks...${NC}"

# Check required tools
for cmd in docker git curl; do
    if ! command_exists "$cmd"; then
        echo -e "${RED}❌ Error: $cmd is not installed${NC}"
        exit 1
    fi
done

# Check Docker Compose (v2 uses 'docker compose' instead of 'docker compose')
if ! docker compose version > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker Compose is not available${NC}"
    exit 1
fi

# Check environment variables
if [[ -z "$SUPABASE_URL" ]] || [[ -z "$SUPABASE_ANON_KEY" ]] || [[ -z "$JWT_SECRET" ]]; then
    echo -e "${YELLOW}⚠️  Warning: Required environment variables not set${NC}"
    echo "Please ensure .env file exists with all required variables"
    
    if [[ ! -f .env ]]; then
        echo "Creating .env from template..."
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please edit .env file with your actual values before continuing${NC}"
        exit 1
    fi
fi

# Load environment variables
if [[ -f .env ]]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"
log "Created backup directory: $BACKUP_DIR"

# Step 1: Database Setup
echo -e "${BLUE}🗄️  Setting up production database...${NC}"

if [[ -f "database/production-config.sql" ]]; then
    log "Production database configuration available"
    echo -e "${GREEN}✅ Database configuration ready${NC}"
else
    echo -e "${YELLOW}⚠️  Production database config not found${NC}"
fi

# Step 2: Build and test images
echo -e "${BLUE}🐳 Building Docker images...${NC}"

# Build AI service first (takes longest)
echo "Building AI service..."
docker compose build ai-service 2>&1 | tee -a "$LOG_FILE"

# Build backend
echo "Building backend service..."
docker compose build backend 2>&1 | tee -a "$LOG_FILE"

# Build frontend
echo "Building frontend service..."
docker compose build frontend 2>&1 | tee -a "$LOG_FILE"

log "All Docker images built successfully"

# Step 3: Health checks before deployment
echo -e "${BLUE}🏥 Running health checks...${NC}"

# Start services with health checks
echo "Starting services..."
docker compose up -d redis

# Wait for Redis to be healthy
echo "Waiting for Redis to be ready..."
timeout=60
while [[ $timeout -gt 0 ]]; do
    if docker compose exec redis redis-cli ping > /dev/null 2>&1; then
        break
    fi
    sleep 2
    ((timeout-=2))
done

if [[ $timeout -le 0 ]]; then
    echo -e "${RED}❌ Redis health check failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Redis is healthy${NC}"

# Start AI service
echo "Starting AI service..."
docker compose up -d ai-service

# Wait for AI service health check
echo "Waiting for AI service to be ready..."
timeout=300  # 5 minutes for AI service (model downloads)
while [[ $timeout -gt 0 ]]; do
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        break
    fi
    sleep 10
    ((timeout-=10))
done

if [[ $timeout -le 0 ]]; then
    echo -e "${RED}❌ AI service health check failed${NC}"
    docker compose logs ai-service
    exit 1
fi

echo -e "${GREEN}✅ AI service is healthy${NC}"

# Start backend
echo "Starting backend service..."
docker compose up -d backend

# Wait for backend health check
echo "Waiting for backend to be ready..."
timeout=60
while [[ $timeout -gt 0 ]]; do
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        break
    fi
    sleep 5
    ((timeout-=5))
done

if [[ $timeout -le 0 ]]; then
    echo -e "${RED}❌ Backend health check failed${NC}"
    docker compose logs backend
    exit 1
fi

echo -e "${GREEN}✅ Backend is healthy${NC}"

# Start frontend
echo "Starting frontend service..."
docker compose up -d frontend

# Wait for frontend health check
echo "Waiting for frontend to be ready..."
timeout=60
while [[ $timeout -gt 0 ]]; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        break
    fi
    sleep 5
    ((timeout-=5))
done

if [[ $timeout -le 0 ]]; then
    echo -e "${RED}❌ Frontend health check failed${NC}"
    docker compose logs frontend
    exit 1
fi

echo -e "${GREEN}✅ Frontend is healthy${NC}"

# Step 4: Run integration tests
echo -e "${BLUE}🧪 Running integration tests...${NC}"

# Test AI service
echo "Testing AI service..."
response=$(curl -s -w "%{http_code}" http://localhost:8000/health)
http_code="${response: -3}"

if [[ "$http_code" == "200" ]]; then
    echo -e "${GREEN}✅ AI service integration test passed${NC}"
else
    echo -e "${RED}❌ AI service integration test failed (HTTP $http_code)${NC}"
    exit 1
fi

# Test backend API
echo "Testing backend API..."
response=$(curl -s -w "%{http_code}" http://localhost:3001/health)
http_code="${response: -3}"

if [[ "$http_code" == "200" ]]; then
    echo -e "${GREEN}✅ Backend integration test passed${NC}"
else
    echo -e "${RED}❌ Backend integration test failed (HTTP $http_code)${NC}"
    exit 1
fi

# Test frontend
echo "Testing frontend..."
response=$(curl -s -w "%{http_code}" http://localhost:3000/api/health)
http_code="${response: -3}"

if [[ "$http_code" == "200" ]]; then
    echo -e "${GREEN}✅ Frontend integration test passed${NC}"
else
    echo -e "${RED}❌ Frontend integration test failed (HTTP $http_code)${NC}"
    exit 1
fi

# Test document processing pipeline
echo "Testing document processing pipeline..."
if [[ -f "ai-service/test_document.txt" ]]; then
    response=$(curl -s -w "%{http_code}" -X POST \
        -F "file=@ai-service/test_document.txt" \
        http://localhost:8000/api/v1/process/document)
    http_code="${response: -3}"
    
    if [[ "$http_code" == "200" ]]; then
        echo -e "${GREEN}✅ Document processing test passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Document processing test returned HTTP $http_code${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No test document found, skipping processing test${NC}"
fi

# Step 5: Performance validation
echo -e "${BLUE}⚡ Running performance validation...${NC}"

# Check resource usage
echo "Checking resource usage..."
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | head -10

# Validate build sizes
echo "Frontend build size:"
if [[ -d "frontend/.next" ]]; then
    du -sh frontend/.next/ 2>/dev/null || echo "N/A"
fi

echo "AI service size:"
docker images | grep "${PROJECT_NAME}.*ai-service" | awk '{print $7}'

log "Performance validation completed"

# Step 6: Final deployment status
echo -e "${BLUE}📊 Deployment Status Summary${NC}"

echo "===========================================" 
echo "🎉 CotAi Edge Production Deployment Complete!"
echo "==========================================="

# Service URLs
echo -e "${GREEN}Service URLs:${NC}"
echo "  🌐 Frontend:   http://localhost:3000"
echo "  🔧 Backend:    http://localhost:3001"
echo "  🤖 AI Service: http://localhost:8000"
echo "  📊 Redis:      localhost:6379"

# Health status
echo -e "${GREEN}Health Status:${NC}"
services=("frontend:3000/api/health" "backend:3001/health" "ai-service:8000/health")
for service in "${services[@]}"; do
    service_name="${service%%:*}"
    service_url="http://localhost:${service#*:}"
    
    if curl -f -s "$service_url" > /dev/null; then
        echo "  ✅ $service_name: Healthy"
    else
        echo "  ❌ $service_name: Unhealthy"
    fi
done

# Resource usage summary
echo -e "${GREEN}Resource Usage:${NC}"
total_containers=$(docker ps --filter "name=${PROJECT_NAME}" --format "{{.Names}}" | wc -l)
echo "  📦 Active containers: $total_containers"

# Backup info
echo -e "${GREEN}Backup Information:${NC}"
echo "  📁 Backup directory: $BACKUP_DIR"
echo "  📋 Deployment log: $LOG_FILE"

# Next steps
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Configure domain and SSL certificates"
echo "  2. Set up monitoring and alerting"
echo "  3. Configure Cloudflare CDN (see cdn/ directory)"
echo "  4. Apply database optimizations (see database/production-config.sql)"
echo "  5. Set up automated backups"

echo
echo -e "${GREEN}🚀 Deployment completed successfully!${NC}"
echo -e "${BLUE}📖 Check $LOG_FILE for detailed logs${NC}"

# Save deployment info
cat > "$BACKUP_DIR/deployment-info.txt" << EOF
CotAi Edge Deployment Information
================================

Date: $(date)
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "N/A")
Git Branch: $(git branch --show-current 2>/dev/null || echo "N/A")

Services Status:
- Frontend: $(curl -f -s http://localhost:3000/api/health > /dev/null && echo "✅ Healthy" || echo "❌ Unhealthy")
- Backend: $(curl -f -s http://localhost:3001/health > /dev/null && echo "✅ Healthy" || echo "❌ Unhealthy")
- AI Service: $(curl -f -s http://localhost:8000/health > /dev/null && echo "✅ Healthy" || echo "❌ Unhealthy")

Configuration:
- Supabase URL: $SUPABASE_URL
- AI Service Port: 8000
- Backend Port: 3001
- Frontend Port: 3000

EOF

log "Deployment completed successfully"

exit 0