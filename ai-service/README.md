# 🤖 CotAi Edge AI Service

Advanced document processing service with **IBM Docling** integration and **9-stage processing pipeline** for intelligent procurement document analysis.

## 🚀 Features

### 📄 Advanced Document Processing
- **Multi-format Support:** PDF, DOCX, images with OCR
- **9-Stage Pipeline:** Complete processing from extraction to analysis
- **IBM Docling Integration:** State-of-the-art document understanding
- **spaCy Layout Analysis:** Contextual document structure analysis

### 🎯 Procurement-Specific Analysis
- **Risk Assessment:** Technical, legal, commercial, and logistic risk identification
- **Opportunity Detection:** High-value contracts and strategic opportunities
- **Table Classification:** Automatic product/service table identification
- **Quality Scoring:** Confidence assessment with POOR/FAIR/GOOD/EXCELLENT grades

### 📊 Real-time Monitoring
- **Live Progress Tracking:** Stage-by-stage processing updates
- **Quality Dashboard:** Component scores and confidence metrics
- **Complete Audit Trail:** Processing timeline and error tracking
- **Performance Analytics:** Processing time and bottleneck identification

## 🏗️ Architecture

### Pipeline Stages

#### **Stages 1-3: Document Parsing & Extraction (Docling)**
1. **Document Parsing:** PDF/DOCX to structured format
2. **OCR & Text Extraction:** Multi-engine OCR processing
3. **Table & Structure Extraction:** Advanced table detection

#### **Stages 4-6: AI Analysis (LLM)**
4. **Content Classification:** Document section categorization
5. **Risk Analysis:** Multi-dimensional risk assessment
6. **Opportunity Identification:** Business opportunity detection

#### **Stages 7-9: Data Structuring & Quality**
7. **Data Validation:** Quality scores and completeness
8. **Structured Output:** Standardized JSON format
9. **Result Compilation:** Final processing with metadata

## 🛠️ Installation

### Prerequisites
- Python 3.8-3.12 (3.13+ supported from Docling 2.18.0)
- Virtual environment recommended

### Setup
```bash
# Clone repository
cd cotaiEdge/ai-service

# Create virtual environment
python -m venv ai-service
source ai-service/bin/activate  # Windows: ai-service\\Scripts\\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Download Docling models (optional, for offline usage)
python -c "from docling.utils.model_downloader import download_models; download_models()"

# Start service
python main.py
```

### Docker Setup
```bash
# Build container
docker build -t cotai-edge-ai .

# Run service
docker run -p 8000:8000 --env-file .env cotai-edge-ai
```

## 📡 API Usage

### Process Document
```bash
curl -X POST "http://localhost:8000/api/v1/process/document" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@edital.pdf" \\
  -F "ano=2025" \\
  -F "uasg=986531" \\
  -F "numero_pregao=PE-001-2025" \\
  -F "callback_url=https://api.cotai.com/webhook"
```

### Get Processing Status
```bash
curl -X GET "http://localhost:8000/api/v1/process/{task_id}/status"
```

### Get Quality Scores
```bash
curl -X GET "http://localhost:8000/api/v1/process/{task_id}/quality"
```

### Get Final Result
```bash
curl -X GET "http://localhost:8000/api/v1/process/{task_id}/result"
```

## 🔧 Configuration

### OCR Engines
```python
# EasyOCR (default)
OCR_ENGINE=easyocr
OCR_LANGUAGES=pt,en
OCR_USE_GPU=true

# Tesseract
OCR_ENGINE=tesseract
# Requires system installation: apt-get install tesseract-ocr

# RapidOCR
OCR_ENGINE=rapidocr
# Requires: pip install rapidocr-onnxruntime
```

### Quality Thresholds
```env
QUALITY_THRESHOLD_EXCELLENT=0.9
QUALITY_THRESHOLD_GOOD=0.7
QUALITY_THRESHOLD_FAIR=0.5
```

### Performance Tuning
```env
# CPU threads for processing
OMP_NUM_THREADS=4

# GPU acceleration (NVIDIA)
DOCLING_CUDA_USE_FLASH_ATTENTION2=true

# Memory limits
MAX_FILE_SIZE=52428800  # 50MB
MAX_PAGES=1000
```

## 📊 Response Format

### Processing Result
```json
{
  "task_id": "123e4567-e89b-12d3-a456-426614174000",
  "structured_data": {
    "numero_pregao": "PE-001-2025",
    "uasg": "986531",
    "orgao": "Ministério da Gestão",
    "valor_estimado": 500000.0,
    "modalidade": "Pregão Eletrônico"
  },
  "risks": [
    {
      "description": "Prazo de entrega muito restrito",
      "risk_type": "logístico",
      "criticality_score": 0.8,
      "risk_level": "high"
    }
  ],
  "opportunities": [
    {
      "description": "Contrato de alto valor",
      "opportunity_type": "alto_valor",
      "potential_value": 500000.0,
      "likelihood": 0.8
    }
  ],
  "quality_score": 0.87,
  "quality_grade": "GOOD"
}
```

### Quality Dashboard Data
```json
{
  "overall_score": 0.87,
  "quality_grade": "GOOD",
  "component_scores": {
    "layout_score": 0.92,
    "ocr_score": 0.85,
    "parse_score": 0.88,
    "table_score": 0.83
  },
  "processing_stages": [
    {
      "stage_id": 1,
      "stage_name": "Document Parsing",
      "duration_seconds": 5.2,
      "confidence": 0.92,
      "status": "completed"
    }
  ]
}
```

## 🔍 Troubleshooting

### Common Issues

#### Model Download SSL Errors
```bash
# Update certificates
pip install --upgrade certifi

# Set certificate paths
export SSL_CERT_FILE=$(python -m certifi)
export REQUESTS_CA_BUNDLE=$(python -m certifi)
```

#### Tesseract Installation
```bash
# Ubuntu/Debian
sudo apt-get install tesseract-ocr tesseract-ocr-por

# macOS
brew install tesseract leptonica pkg-config

# Set language data path
export TESSDATA_PREFIX=/usr/share/tesseract-ocr/4.00/tessdata/
```

#### GPU Memory Issues
```env
# Reduce batch sizes
OMP_NUM_THREADS=2

# Disable GPU for OCR
OCR_USE_GPU=false
```

## 📈 Performance

### Benchmarks
- **Small PDFs (1-10 pages):** ~15-30 seconds
- **Medium PDFs (10-50 pages):** ~45-90 seconds  
- **Large PDFs (50+ pages):** ~2-5 minutes

### Optimization Tips
1. **Use GPU acceleration** for OCR processing
2. **Pre-download models** for faster startup
3. **Adjust thread count** based on available CPU cores
4. **Enable flash attention** for CUDA devices
5. **Use SSD storage** for temporary files

## 🤝 Integration

### Frontend Integration
```typescript
// React component for quality monitoring
const QualityDashboard = ({ taskId }) => {
  const { qualityData } = useQualityScore(taskId);
  
  return (
    <QualityMeter score={qualityData.overall_score} />
  );
};
```

### Webhook Integration
```python
# Callback handler
@app.post("/webhook")
async def handle_callback(data: dict):
    task_id = data["task_id"]
    if data["status"] == "completed":
        result = await get_processing_result(task_id)
        # Process result
```

## 📝 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Documentation:** See CLAUDE.md for detailed project information
- **Issues:** Report at https://github.com/cotai-edge/ai-service/issues
- **API Reference:** http://localhost:8000/docs (FastAPI Swagger UI)