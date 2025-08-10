#!/bin/bash
# Startup script for CotAi Edge AI Service development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 CotAi Edge AI Service Startup Script${NC}"
echo "=================================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found!${NC}"
    echo "Copying .env.example to .env..."
    cp .env.example .env
    echo -e "${RED}❌ Please edit .env file with your configuration before continuing${NC}"
    echo "Required configuration:"
    echo "  - SUPABASE_URL"
    echo "  - SUPABASE_ANON_KEY" 
    echo "  - SUPABASE_SERVICE_ROLE_KEY"
    echo "  - JWT_SECRET"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

echo -e "${GREEN}✅ Environment variables loaded${NC}"

# Check required environment variables
REQUIRED_VARS=("SUPABASE_URL" "SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY" "JWT_SECRET")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Required environment variable $var is not set${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Required environment variables validated${NC}"

# Create necessary directories
echo -e "${BLUE}📁 Creating directories...${NC}"
mkdir -p storage temp results logs ai-service/models ai-service/temp ai-service/results ai-service/logs

echo -e "${GREEN}✅ Directories created${NC}"

# Check if we should run with Docker or locally
if [ "$1" = "docker" ]; then
    echo -e "${BLUE}🐳 Starting with Docker Compose...${NC}"
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi
    
    # Build and start services
    echo -e "${BLUE}📦 Building AI service...${NC}"
    docker-compose build ai-service
    
    echo -e "${BLUE}🔄 Starting services...${NC}"
    docker-compose up ai-service redis
    
elif [ "$1" = "local" ]; then
    echo -e "${BLUE}🔧 Starting locally...${NC}"
    
    # Check if Python virtual environment exists
    if [ ! -d "ai-service/ai-service" ]; then
        echo -e "${BLUE}🐍 Creating Python virtual environment...${NC}"
        cd ai-service
        python -m venv ai-service
        cd ..
        echo -e "${GREEN}✅ Virtual environment created${NC}"
    fi
    
    # Activate virtual environment and install dependencies
    echo -e "${BLUE}📦 Installing Python dependencies...${NC}"
    cd ai-service
    source ai-service/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Download models if needed
    echo -e "${BLUE}📥 Checking for AI models...${NC}"
    export DOCLING_ARTIFACTS_PATH="./models"
    python -c "
import os
try:
    from docling.utils.model_downloader import download_models
    if not os.path.exists('./models/docling'):
        print('Downloading models...')
        download_models()
        print('✅ Models downloaded')
    else:
        print('✅ Models already available')
except Exception as e:
    print(f'⚠️ Model download failed: {e}')
    print('Models will be downloaded on first use')
"
    
    # Start Redis if not running
    if ! redis-cli ping > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Redis not running. Starting Redis with Docker...${NC}"
        cd ..
        docker-compose up -d redis
        cd ai-service
        sleep 3
    fi
    
    # Start the AI service
    echo -e "${BLUE}🎯 Starting AI service...${NC}"
    python main.py
    
else
    echo -e "${BLUE}Usage:${NC}"
    echo "  $0 docker  - Run with Docker Compose (recommended)"
    echo "  $0 local   - Run locally with Python virtual environment"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo "  ./scripts/start-ai-service.sh docker"
    echo "  ./scripts/start-ai-service.sh local"
    echo ""
    echo -e "${BLUE}Services:${NC}"
    echo "  - AI Service: http://localhost:8000"
    echo "  - Health Check: http://localhost:8000/health" 
    echo "  - API Docs: http://localhost:8000/docs"
    echo "  - Redis: localhost:6379"
fi