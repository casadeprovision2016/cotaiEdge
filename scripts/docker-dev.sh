#!/bin/bash
# Development Docker setup script for CotAi Edge

set -e

echo "🚀 CotAi Edge - Docker Development Setup"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed and running
print_status "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker."
    exit 1
fi

print_success "Docker is installed and running"

# Check if docker-compose is available
print_status "Checking Docker Compose..."
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Use docker-compose or docker compose based on availability
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

print_success "Docker Compose is available"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p ai-service/{storage,models,temp,logs}
mkdir -p storage
print_success "Directories created"

# Check for .env file
print_status "Checking environment configuration..."
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success ".env file created from example"
        print_warning "Please edit .env file with your configuration before continuing"
        echo "Key variables to configure:"
        echo "  - SUPABASE_ANON_KEY"
        echo "  - SUPABASE_SERVICE_ROLE_KEY"  
        echo "  - JWT_SECRET"
        echo ""
        read -p "Press Enter after editing .env file to continue..."
    else
        print_error ".env.example file not found. Please create .env file manually."
        exit 1
    fi
fi

# Function to handle different docker-compose commands
handle_command() {
    case $1 in
        "up")
            print_status "Starting CotAi Edge services..."
            $DOCKER_COMPOSE up -d
            ;;
        "build")
            print_status "Building CotAi Edge services..."
            $DOCKER_COMPOSE build --no-cache
            ;;
        "rebuild")
            print_status "Rebuilding CotAi Edge services..."
            $DOCKER_COMPOSE down
            $DOCKER_COMPOSE build --no-cache
            $DOCKER_COMPOSE up -d
            ;;
        "down")
            print_status "Stopping CotAi Edge services..."
            $DOCKER_COMPOSE down
            ;;
        "logs")
            print_status "Showing service logs..."
            $DOCKER_COMPOSE logs -f ${2:-}
            ;;
        "status")
            print_status "Checking service status..."
            $DOCKER_COMPOSE ps
            ;;
        "clean")
            print_status "Cleaning up Docker resources..."
            $DOCKER_COMPOSE down -v
            docker system prune -f
            ;;
        *)
            echo "Usage: $0 {up|build|rebuild|down|logs|status|clean}"
            echo ""
            echo "Commands:"
            echo "  up       - Start all services in background"
            echo "  build    - Build all service images"  
            echo "  rebuild  - Stop, rebuild, and start services"
            echo "  down     - Stop all services"
            echo "  logs     - Show service logs (add service name for specific logs)"
            echo "  status   - Show service status"
            echo "  clean    - Stop services and clean up Docker resources"
            echo ""
            echo "Examples:"
            echo "  $0 up"
            echo "  $0 logs ai-service"
            echo "  $0 rebuild"
            exit 1
            ;;
    esac
}

# Handle command line argument
if [ $# -eq 0 ]; then
    print_status "No command provided. Starting services..."
    handle_command "up"
else
    handle_command $1 $2
fi

# Check service health after starting
if [ "$1" = "up" ] || [ $# -eq 0 ]; then
    print_status "Waiting for services to start..."
    sleep 5
    
    print_status "Checking service health..."
    
    # Check AI Service
    if curl -f http://localhost:8000/health &> /dev/null; then
        print_success "AI Service is healthy (http://localhost:8000)"
    else
        print_warning "AI Service may still be starting up..."
    fi
    
    # Check Frontend
    if curl -f http://localhost:3000 &> /dev/null; then
        print_success "Frontend is running (http://localhost:3000)"
    else
        print_warning "Frontend may still be starting up..."
    fi
    
    # Check Backend  
    if curl -f http://localhost:3001 &> /dev/null; then
        print_success "Backend is running (http://localhost:3001)"
    else
        print_warning "Backend may still be starting up..."
    fi
    
    echo ""
    print_success "CotAi Edge services are starting up!"
    echo ""
    echo "🌐 Service URLs:"
    echo "   Frontend:   http://localhost:3000"
    echo "   Backend:    http://localhost:3001" 
    echo "   AI Service: http://localhost:8000"
    echo "   API Docs:   http://localhost:8000/docs"
    echo ""
    echo "📊 Monitoring:"
    echo "   Service Status: $0 status"
    echo "   All Logs:       $0 logs"
    echo "   AI Service:     $0 logs ai-service"
    echo "   Frontend:       $0 logs frontend"
    echo "   Backend:        $0 logs backend"
    echo ""
fi