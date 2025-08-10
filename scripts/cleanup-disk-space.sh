#!/bin/bash

# CotAi Edge - Disk Space Cleanup Script
# Safely removes unused Docker resources and temporary files

set -e

echo "🧹 CotAi Edge Disk Space Cleanup"
echo "================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Current space usage
echo -e "${BLUE}📊 Current disk usage:${NC}"
df -h / | grep -v Filesystem
echo

# Show current Docker usage
echo -e "${BLUE}🐳 Docker space usage:${NC}"
docker system df
echo

echo -e "${YELLOW}⚠️  WARNING: This will remove unused Docker resources${NC}"
echo "- Unused images (not currently running)"
echo "- Build cache"
echo "- Stopped containers"
echo "- Unused volumes and networks"
echo

read -p "Continue with cleanup? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

# 1. Remove unused Docker containers
echo -e "${BLUE}🗑️  Removing stopped containers...${NC}"
CONTAINERS_REMOVED=$(docker container prune -f --filter "until=24h" | grep "Total reclaimed space" | awk '{print $4 " " $5}' || echo "0B")
echo "Containers removed: $CONTAINERS_REMOVED"

# 2. Remove unused images (keep running services)
echo -e "${BLUE}🖼️  Removing unused images...${NC}"
# Keep currently used images
docker image prune -a -f --filter "until=24h" > /tmp/docker_prune.log 2>&1 || true
IMAGES_REMOVED=$(grep "Total reclaimed space" /tmp/docker_prune.log | awk '{print $4 " " $5}' || echo "0B")
echo "Images removed: $IMAGES_REMOVED"

# 3. Clean build cache
echo -e "${BLUE}⚡ Cleaning build cache...${NC}"
CACHE_REMOVED=$(docker builder prune -a -f | grep "Total:" | awk '{print $2}' || echo "0B")
echo "Build cache removed: $CACHE_REMOVED"

# 4. Remove unused volumes (be careful with data)
echo -e "${BLUE}💾 Removing unused volumes...${NC}"
VOLUMES_REMOVED=$(docker volume prune -f | grep "Total reclaimed space" | awk '{print $4 " " $5}' || echo "0B")
echo "Volumes removed: $VOLUMES_REMOVED"

# 5. Clean up node_modules if requested
echo -e "${YELLOW}📦 Node.js modules cleanup (Optional)${NC}"
echo "Current size: $(du -sh frontend/node_modules backend/node_modules 2>/dev/null | awk '{sum+=$1} END {print sum "M"}' || echo '0M')"
read -p "Rebuild node_modules? This will take time but saves ~900MB (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Removing node_modules..."
    rm -rf frontend/node_modules backend/node_modules
    echo "✅ Node modules removed. Run 'npm install' in each directory when needed."
fi

# 6. Clean Python cache
echo -e "${BLUE}🐍 Cleaning Python cache...${NC}"
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true
echo "✅ Python cache cleaned"

# 7. Clean temporary files
echo -e "${BLUE}🧹 Cleaning temporary files...${NC}"
rm -rf ai-service/temp/* ai-service/logs/* 2>/dev/null || true
echo "✅ Temporary files cleaned"

# Final space check
echo -e "${GREEN}✅ Cleanup completed!${NC}"
echo -e "${BLUE}📊 New disk usage:${NC}"
df -h / | grep -v Filesystem
echo

echo -e "${BLUE}🐳 New Docker usage:${NC}"
docker system df
echo

# Recommendations
echo -e "${YELLOW}💡 Additional recommendations:${NC}"
echo "1. Remove 'teste-*' Docker images if not needed (saves ~25GB):"
echo "   docker rmi teste-app-worker teste-app-beat teste-app-api teste-flower"
echo
echo "2. Use lightweight AI service for testing:"
echo "   docker compose up ai-service --build"
echo
echo "3. Regular cleanup with:"
echo "   docker system prune -a -f --volumes"
echo
echo "4. Monitor space with:"
echo "   ./scripts/cleanup-disk-space.sh"