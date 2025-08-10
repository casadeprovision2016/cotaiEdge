# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CotAi Edge is an intelligent quotation management system with AI integration, automating the entire corporate procurement cycle with PNCP (Portal Nacional de Contratações Públicas) integration.

### Target Users
- **Primary:** Procurement departments of medium and large companies
- **Secondary:** Small companies with high quotation volume  
- **Tertiary:** Autonomous procurement professionals and consultants

## Architecture

### Hybrid Architecture with Supabase Self-Hosted
- **Supabase PostgreSQL:** Main database (quotations, suppliers, users, configs) - `api.neuro-ia.es`
- **Supabase Realtime:** Real-time updates/Kanban, instant notifications
- **Supabase GoTrue:** Authentication and user management
- **Supabase Storage:** Files, documents, attachments
- **Kong Gateway:** API Gateway and proxy (integrated with Supabase)
- **Redis Cloud (Upstash):** Query cache, sessions
- **Cloudflare Workers + KV:** Edge cache, API proxy
- **Google BigQuery:** Analytics/BI

### Frontend Stack
- **Framework:** Next.js with TypeScript
- **Styling:** Tailwind CSS
- **PWA:** Service Workers for offline support
- **Architecture:** Clean Architecture pattern

## Common Development Commands

### Frontend Development
```bash
# Navigate to frontend directory
cd frontend

# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### AI Service Development
```bash
# Navigate to AI service directory
cd ai-service

# Create and activate AI service virtual environment
python -m venv ai-service
source ai-service/bin/activate  # On Windows: ai-service\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Install Docling with specific options
pip install docling
# For CPU-only systems:
# pip install docling --extra-index-url https://download.pytorch.org/whl/cpu

# Install spaCy layout integration
pip install spacy-layout

# Start AI processing service
python main.py

# Run tests
python -m pytest tests/
```

### Docker Development
```bash
# Build and start all services (connects to remote Supabase)
docker compose up --build -d

# View logs for specific service
docker compose logs -f backend

# Restart specific service
docker compose restart frontend

# Stop all services
docker compose down
```

### Environment Configuration
The system connects to a remote Supabase instance at `api.neuro-ia.es`:

```bash
# Required environment variables
SUPABASE_URL=https://api.neuro-ia.es
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
JWT_SECRET=your-jwt-secret-here
```

## Core Entities and Database Structure

### Main Tables
- `organizations` - Company/organization data
- `users` - Internal users with roles and permissions
- `api_clients` - External API clients
- `suppliers` - Supplier management with performance tracking
- `quotations` - Main quotation/bidding entity
- `quotation_items` - Items within quotations
- `quotation_invitations` - Supplier invitations
- `supplier_proposals` - Supplier responses
- `proposal_items` - Items in supplier proposals
- `pncp_opportunities` - PNCP integration data
- `notifications` - Multi-channel notification system
- `audit_logs` - Immutable audit trail

### Key Features Implementation
- **Kanban Board:** Dynamic quotation status management (Open, In Progress, Responded, Finalized, Cancelled)
- **Advanced Document Processing:** Multi-stage AI extraction using Docling + LLM pipeline:
  - 9-stage processing pipeline with IBM Docling for PDF/DOCX extraction
  - OCR with multiple engines (EasyOCR, Tesseract, RapidOCR)
  - Table extraction and classification with AI analysis
  - Risk and opportunity identification using Llama 3.2
  - spaCy-layout integration for contextual document understanding
- **Real-time Updates:** Supabase Realtime for live status changes
- **Multi-channel Notifications:** Email, WhatsApp integration
- **Performance Tracking:** Supplier metrics and KPIs
- **PNCP Integration:** Public procurement portal connectivity

## Authentication Flow
- **Internal Users:** Supabase GoTrue with email/password
- **External Clients:** API Key authentication
- **Trial System:** 7-day free trial with automatic plan upgrade prompts
- **Status Management:** active, suspended, cancelled, trial_expired

## Key Business Logic

### Quotation Workflow
1. **Creation:** Manual or PNCP import
2. **Document Processing:** Advanced 9-stage AI extraction pipeline:
   - Stage 1-3: Docling extraction (text, tables, layout)
   - Stage 4-6: LLM analysis (risk, opportunities, classification)
   - Stage 7-9: Data structuring and quality assessment
3. **Supplier Matching:** Automatic supplier recommendation
4. **Digital Signature:** ICP-Brasil/DocuSign integration
5. **Multi-channel Distribution:** Email/WhatsApp sending
6. **Response Collection:** Supplier proposal management
7. **Analysis & Reporting:** Performance metrics and exports

### User Management
- RBAC with flexible permissions (JSONB structure)
- Organization-based access control
- User preferences (theme, language, notifications)
- Audit logging for all actions

## Development Guidelines

### Code Style
- TypeScript for type safety
- Clean Architecture patterns
- Component-based UI structure
- Responsive design (mobile-first)
- Accessibility compliance (WCAG)

### API Integration
All Supabase services are accessed via the remote instance:
- **REST API:** `https://api.neuro-ia.es/rest/v1/`
- **Auth:** `https://api.neuro-ia.es/auth/v1/`
- **Realtime:** `https://api.neuro-ia.es/realtime/v1/`
- **Storage:** `https://api.neuro-ia.es/storage/v1/`
- **Edge Functions:** `https://api.neuro-ia.es/functions/v1/`

### Security Requirements
- AES-256 encryption for sensitive data
- Rate limiting on authentication
- Audit logging for all critical actions
- LGPD compliance
- No secrets in code or commits

## Testing and Quality

### Frontend Tests
```bash
# Run tests (when implemented)
npm test

# E2E tests (when implemented)  
npm run test:e2e
```

### Performance Requirements
- Response time < 200ms for queries
- 99.9% availability SLA
- Support for 10,000 concurrent users
- Document processing < 3 seconds

## Deployment

### Local Development
- Frontend runs locally via Docker or npm
- Connects to remote Supabase at `api.neuro-ia.es`
- All data persists in remote PostgreSQL

### Production
- Cloudflare Pages for frontend hosting
- Cloudflare Workers for edge computing
- AWS Lambda for backend services
- Supabase self-hosted for data layer

## Document Processing Pipeline

### AI-Powered Document Extraction (9 Stages)

The CotAi Edge system implements a sophisticated 9-stage document processing pipeline using IBM Docling and LLM integration:

#### Stage 1-3: Document Parsing & Extraction
1. **PDF Processing:** Docling converts PDF/DOCX to structured format
2. **OCR & Text Extraction:** Multi-engine OCR (EasyOCR, Tesseract, RapidOCR)
3. **Table Extraction:** Advanced table detection and data extraction

#### Stage 4-6: AI Analysis
4. **Content Classification:** LLM categorizes document sections and tables
5. **Risk Analysis:** Identifies procurement risks (technical, legal, commercial)
6. **Opportunity Identification:** Detects business opportunities and high-value contracts

#### Stage 7-9: Data Structuring
7. **Data Validation:** Quality scores and completeness assessment
8. **Structured Output:** Converts to standardized JSON format
9. **Result Compilation:** Final processing with metadata and timestamps

### Integration Architecture

```python
# Document processing workflow
from docling.document_converter import DocumentConverter
from docling.datamodel.pipeline_options import PdfPipelineOptions
import spacy
from spacy_layout import spaCyLayout

# Configure Docling pipeline
pipeline_options = PdfPipelineOptions()
pipeline_options.do_ocr = True
pipeline_options.do_table_structure = True
pipeline_options.generate_picture_images = True

# Initialize converter
converter = DocumentConverter()
doc = converter.convert("edital.pdf").document

# Process with spaCy-layout for contextual analysis
nlp = spacy.blank("pt")
layout_parser = spaCyLayout(nlp)
spacy_doc = layout_parser(doc)

# Extract tables as DataFrames
for table in spacy_doc._.tables:
    df = table._.data
    # Process table with LLM for classification
```

### Supported Document Formats
- **PDF:** Primary format with full OCR and layout analysis
- **DOCX:** Microsoft Word documents with table extraction
- **Images:** PNG, JPEG, TIFF with OCR processing
- **Output:** Structured JSON with risk analysis and opportunities

### Quality Assessment
- **Confidence Scores:** 0-100 quality assessment for each extraction
- **Processing Times:** Detailed timing for each pipeline stage  
- **Error Handling:** Comprehensive error and warning reporting
- **Audit Trail:** Complete processing metadata and intermediate results

## Client Dashboard Features

### Document Quality Monitoring
The client interface provides comprehensive quality assessment and audit capabilities:

#### 📊 **Quality Scores Dashboard**
- **Overall Document Score:** 0-100 confidence rating for complete extraction
- **Component Scores:**
  - Layout Score: Document structure recognition quality
  - OCR Score: Text extraction accuracy
  - Parse Score: Digital content processing quality
  - Table Score: Table extraction and structure accuracy
- **Quality Grades:** POOR, FAIR, GOOD, EXCELLENT classifications
- **Real-time Monitoring:** Live updates during document processing

#### 🔍 **Audit Trail Interface**
- **Processing Timeline:** Complete 9-stage processing history
- **Stage-by-Stage Results:**
  - Stage 1-3: Document parsing metrics and extraction logs
  - Stage 4-6: AI analysis confidence and decision rationale
  - Stage 7-9: Data validation and structuring audit
- **Error Tracking:** Detailed error logs with resolution suggestions
- **Performance Metrics:** Processing time per stage and bottleneck identification

#### 📈 **Quality Analytics**
```typescript
// Client dashboard data structure
interface DocumentQuality {
  overall_score: number;           // 0-100
  quality_grade: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
  component_scores: {
    layout_score: number;
    ocr_score: number;
    parse_score: number;
    table_score: number;
  };
  processing_stages: {
    stage_id: number;
    stage_name: string;
    duration_seconds: number;
    confidence: number;
    errors: string[];
    warnings: string[];
  }[];
  audit_metadata: {
    timestamp: string;
    file_path: string;
    intermediate_results: object;
    user_id: string;
  };
}
```

#### 🎯 **Client Menu Integration**
New menu items for quality monitoring:
- **"Qualidade dos Documentos"** - Real-time quality dashboard
- **"Auditoria Completa"** - Detailed processing audit trail
- **"Relatórios de Performance"** - Historical quality analytics
- **"Configuração de Alertas"** - Quality threshold notifications
- **"Análise de Tendências"** - Quality improvement over time

#### 🔧 **Quality Control Features**
- **Threshold Configuration:** Set minimum quality scores for auto-processing
- **Manual Review Queue:** Documents below quality threshold for human review
- **Batch Quality Reports:** Aggregate quality metrics for document batches
- **Export Capabilities:** Quality reports in PDF/Excel format

## Client Interface Components

### Quality Score Visualization
```jsx
// React component for quality dashboard
const QualityDashboard = ({ documentId }) => {
  const { qualityData, isLoading } = useQualityScore(documentId);
  
  return (
    <div className="quality-dashboard">
      <QualityMeter score={qualityData.overall_score} />
      <ComponentScores scores={qualityData.component_scores} />
      <ProcessingTimeline stages={qualityData.processing_stages} />
      <AuditTrail metadata={qualityData.audit_metadata} />
    </div>
  );
};
```

### Real-time Quality Updates
```typescript
// Supabase Realtime for quality updates
const subscribeToQualityUpdates = (documentId: string) => {
  return supabase
    .channel(`quality-${documentId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'document_processing_logs',
      filter: `document_id=eq.${documentId}`
    }, (payload) => {
      updateQualityDashboard(payload.new);
    })
    .subscribe();
};
```

## Important Notes

- **Database:** Always use the remote Supabase instance, never local
- **Authentication:** Integrate with Supabase GoTrue for all auth flows
- **Real-time:** Use Supabase Realtime for live updates and quality monitoring
- **Caching:** Implement edge caching with Cloudflare Workers KV
- **Monitoring:** All actions should be logged to `audit_logs` table
- **PWA:** Implement service workers for offline capability
- **Document Processing:** Use AI service with Docling for document extraction
- **Python Environment:** Always use virtual environments (`python -m venv ai-service`)
- **Quality Assurance:** Implement client-facing quality scores and audit trails
- **Performance Tracking:** Monitor processing times and bottlenecks for optimization