# CotAi Edge AI Service - Multi-stage Docker build
# Optimized for Docling with OCR support

# === Build Stage ===
FROM python:3.11-slim as builder

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies for building
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    pkg-config \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgfortran5 \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip setuptools wheel
RUN pip install -r requirements.txt

# === Production Stage ===
FROM python:3.11-slim as production

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PATH="/opt/venv/bin:$PATH"
ENV DOCLING_ARTIFACTS_PATH="/app/models"
ENV OMP_NUM_THREADS=4

# Install system dependencies for Docling and OCR
RUN apt-get update && apt-get install -y \
    # Core system libraries
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgfortran5 \
    \
    # Tesseract OCR
    tesseract-ocr \
    tesseract-ocr-por \
    tesseract-ocr-eng \
    libtesseract-dev \
    libleptonica-dev \
    pkg-config \
    \
    # Additional utilities
    curl \
    wget \
    ca-certificates \
    \
    # Cleanup
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set Tesseract data path
ENV TESSDATA_PREFIX=/usr/share/tesseract-ocr/4.00/tessdata/

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Create non-root user for security
RUN groupadd -r cotai && useradd -r -g cotai cotai

# Create application directories
RUN mkdir -p /app/models /app/storage /app/temp /app/logs \
    && chown -R cotai:cotai /app

# Set working directory
WORKDIR /app

# Copy application code
COPY --chown=cotai:cotai . .

# Create startup script
RUN cat > /app/start.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting CotAi Edge AI Service..."

# Create necessary directories
mkdir -p /app/models /app/storage /app/temp /app/logs

# Download Docling models if not present
if [ ! -d "/app/models/docling" ]; then
    echo "📥 Downloading Docling models..."
    python -c "
import os
os.environ['DOCLING_ARTIFACTS_PATH'] = '/app/models'
try:
    from docling.utils.model_downloader import download_models
    download_models()
    print('✅ Models downloaded successfully')
except Exception as e:
    print(f'⚠️  Model download failed: {e}')
    print('Models will be downloaded on first use')
"
fi

# Health check
echo "🏥 Running health check..."
python -c "
import sys
try:
    from docling.document_converter import DocumentConverter
    print('✅ Docling import successful')
except Exception as e:
    print(f'❌ Docling import failed: {e}')
    sys.exit(1)
"

# Start the service
echo "🎯 Starting FastAPI server..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1
EOF

RUN chmod +x /app/start.sh && chown cotai:cotai /app/start.sh

# Switch to non-root user
USER cotai

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command
CMD ["/app/start.sh"]