# Integration Testing Guide - CotAi Edge AI Service

## Overview
This document provides comprehensive testing procedures for the complete AI service integration including real-time updates, quality monitoring, and document processing.

## Test Environment Setup

### 1. Prerequisites
```bash
# Frontend dependencies
cd frontend && npm install

# Backend dependencies
cd backend && npm install

# AI Service dependencies
cd ai-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Environment Variables
```bash
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://api.neuro-ia.es
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000

# Backend (.env)
SUPABASE_URL=https://api.neuro-ia.es
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
AI_SERVICE_URL=http://ai-service:8000
JWT_SECRET=your-jwt-secret

# AI Service (.env)
SUPABASE_URL=https://api.neuro-ia.es
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Test Scenarios

### Test 1: Basic Document Upload
**Objective**: Verify document upload and initial processing

**Steps**:
1. Start all services: `docker compose up --build -d`
2. Navigate to `/upload` page
3. Fill metadata form (ano: 2024, uasg: 986531, numero_pregao: PE-001-2024)
4. Upload a PDF document (< 50MB)

**Expected Results**:
- ✅ Upload successful with task_id returned
- ✅ Processing status shows "pending" initially
- ✅ Real-time connection indicator shows "active"
- ✅ Toast notification: "📤 Upload Realizado"

### Test 2: Real-time Status Updates
**Objective**: Verify real-time updates during processing

**Steps**:
1. After successful upload from Test 1
2. Monitor the QualityDashboard component
3. Watch for real-time updates every 3-5 seconds

**Expected Results**:
- ✅ Status changes from "pending" → "processing"
- ✅ Progress percentage increases (0% → 100%)
- ✅ Stage names update ("Inicializando" → "Extração PDF" → ... → "Finalizando")
- ✅ Real-time notifications appear in NotificationCenter
- ✅ Processing timeline shows current stage

### Test 3: Quality Score Monitoring
**Objective**: Verify quality assessment and scoring

**Steps**:
1. Wait for processing completion from Test 2
2. Check QualityDashboard for quality scores
3. Verify component scores and overall grade

**Expected Results**:
- ✅ Overall score displayed (0-100)
- ✅ Quality grade shown (POOR/FAIR/GOOD/EXCELLENT)
- ✅ Component scores visible:
  - Layout Score
  - OCR Score  
  - Parse Score
  - Table Score
- ✅ Processing stages with durations and confidence levels

### Test 4: Processing Completion
**Objective**: Verify final results and data storage

**Steps**:
1. Wait for "completed" status from Test 3
2. Check final results in dashboard
3. Verify database storage

**Expected Results**:
- ✅ Status shows "completed"
- ✅ Toast notification: "✅ Processamento Concluído"
- ✅ Final quality grade and score displayed
- ✅ Structured data extracted and visible
- ✅ Risks and opportunities identified
- ✅ Data stored in Supabase quotations table

### Test 5: Error Handling
**Objective**: Test error scenarios and recovery

**Steps**:
1. Upload invalid file type (e.g., .txt, .jpg)
2. Upload file > 50MB
3. Test with malformed PDF
4. Test with AI service down

**Expected Results**:
- ✅ Validation errors shown before upload
- ✅ Appropriate error messages displayed
- ✅ Status shows "failed" for processing errors
- ✅ Error notifications in NotificationCenter
- ✅ Graceful degradation with service unavailable

### Test 6: Multiple Document Processing
**Objective**: Test concurrent document processing

**Steps**:
1. Upload 3 documents simultaneously
2. Monitor all processing statuses
3. Verify independent progress tracking

**Expected Results**:
- ✅ All documents process independently
- ✅ Separate real-time updates for each task
- ✅ Individual quality dashboards
- ✅ No interference between processing tasks

## API Endpoint Testing

### 1. AI Service Health Check
```bash
curl -X GET http://localhost:8000/health
```
**Expected**: `{"status": "healthy", "service": "CotAi AI Service", "uptime": 123}`

### 2. Document Upload
```bash
curl -X POST http://localhost:8000/api/v1/process/document \
  -F "file=@test-document.pdf" \
  -F "ano=2024" \
  -F "uasg=986531"
```
**Expected**: `{"task_id": "uuid", "status": "accepted", "message": "Processing started"}`

### 3. Status Check
```bash
curl -X GET http://localhost:8000/api/v1/process/{task_id}/status
```
**Expected**: Processing status with current stage info

### 4. Quality Scores
```bash
curl -X GET http://localhost:8000/api/v1/process/{task_id}/quality
```
**Expected**: Quality assessment with component scores

## Performance Testing

### Load Testing
```bash
# Install artillery
npm install -g artillery

# Run load test
artillery run load-test.yml
```

### Expected Performance Metrics
- Document upload: < 5 seconds
- Processing time: < 60 seconds for typical documents
- Real-time update latency: < 2 seconds
- API response time: < 200ms
- Memory usage: < 2GB per processing task

## Database Verification

### Check Processing Records
```sql
-- Verify document processing records
SELECT task_id, filename, status, progress_percentage, quality_grade 
FROM document_processing 
ORDER BY created_at DESC LIMIT 10;

-- Check quotation data extraction
SELECT numero_pregao, uasg, organization_name, quality_score
FROM quotations 
WHERE ai_processed = true 
ORDER BY created_at DESC LIMIT 5;

-- Verify risks and opportunities
SELECT q.numero_pregao, r.risk_type, r.criticality_score, o.opportunity_type
FROM quotations q
LEFT JOIN quotation_risks r ON q.task_id = r.quotation_task_id
LEFT JOIN quotation_opportunities o ON q.task_id = o.quotation_task_id
WHERE q.ai_processed = true;
```

## Troubleshooting Common Issues

### 1. Real-time Updates Not Working
- Check Supabase connection in browser dev tools
- Verify SUPABASE_SERVICE_ROLE_KEY has realtime permissions
- Check RealtimeProvider subscription in React DevTools

### 2. Processing Stuck
- Check AI service logs: `docker compose logs ai-service`
- Verify file accessibility in storage
- Check for memory limitations

### 3. Quality Scores Missing
- Verify AI service has model dependencies installed
- Check OCR engine installations
- Verify table extraction pipeline

### 4. Database Connection Issues  
- Verify Supabase credentials and permissions
- Check network connectivity to api.neuro-ia.es
- Test with Supabase CLI: `supabase status`

## Success Criteria

### ✅ Integration Complete When:
1. **Document Upload**: Files upload successfully with task_id returned
2. **Real-time Updates**: Status changes propagate within 5 seconds
3. **Quality Assessment**: All component scores calculate correctly
4. **Data Storage**: Extracted data persists in Supabase
5. **Error Handling**: Graceful error messages and recovery
6. **Performance**: Processing completes within 60 seconds
7. **UI Responsiveness**: No blocking operations in frontend
8. **Multi-tasking**: Multiple documents process concurrently

### 🔧 Integration Issues Requiring Fix:
- Processing hangs or times out
- Real-time updates delayed > 10 seconds  
- Quality scores return as null/undefined
- Database insertion failures
- Memory leaks during processing
- API endpoints returning 5xx errors

## Test Documentation

### Test Results Template
```
Test Date: ___________
Test Environment: [local/staging/production]
Tester: ___________

Test 1 - Basic Upload: [PASS/FAIL] ___________
Test 2 - Real-time Updates: [PASS/FAIL] ___________  
Test 3 - Quality Monitoring: [PASS/FAIL] ___________
Test 4 - Processing Completion: [PASS/FAIL] ___________
Test 5 - Error Handling: [PASS/FAIL] ___________
Test 6 - Multiple Documents: [PASS/FAIL] ___________

Performance Metrics:
- Upload Time: _____ seconds
- Processing Time: _____ seconds  
- Real-time Latency: _____ seconds
- Memory Usage: _____ MB

Issues Found:
1. ________________________________
2. ________________________________
3. ________________________________

Overall Status: [PASS/FAIL] ___________
```