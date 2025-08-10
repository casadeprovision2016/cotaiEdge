"""
Simple AI Service for Testing Integration
Tests the full stack without heavy dependencies
"""

import asyncio
import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

import structlog
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Models
class ProcessingStatus(BaseModel):
    task_id: str
    status: str
    current_stage: int
    total_stages: int
    stage_name: str
    progress_percentage: int
    created_at: str
    completed_at: Optional[str] = None
    error: Optional[str] = None

class QualityScores(BaseModel):
    overall_score: int
    quality_grade: str
    component_scores: Dict[str, int]
    processing_stages: List[Dict]
    total_processing_time: float

class ProcessingResult(BaseModel):
    task_id: str
    file_path: str
    structured_data: Dict
    risks: List[Dict]
    opportunities: List[Dict]
    quality_score: int
    quality_grade: str

# In-memory storage for testing
PROCESSING_TASKS: Dict[str, Dict] = {}
STORAGE_PATH = Path("./storage")
STORAGE_PATH.mkdir(exist_ok=True)

# FastAPI app
app = FastAPI(
    title="CotAi Edge AI Service (Test)",
    description="Simple AI service for testing integration",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "CotAi AI Service (Test)",
        "uptime": 123,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

async def simulate_processing(task_id: str, filename: str):
    """Simulate document processing with realistic stages"""
    stages = [
        ("Inicializando", 0),
        ("Carregando documento", 10),
        ("Extração de texto", 25),
        ("Análise de estrutura", 40),
        ("Classificação de conteúdo", 55),
        ("Análise de riscos", 70),
        ("Identificação de oportunidades", 85),
        ("Validação de qualidade", 95),
        ("Finalizando", 100)
    ]
    
    try:
        for i, (stage_name, progress) in enumerate(stages):
            # Update status
            PROCESSING_TASKS[task_id].update({
                "status": "processing",
                "current_stage": i + 1,
                "stage_name": stage_name,
                "progress_percentage": progress,
            })
            
            logger.info("Processing stage completed", 
                       task_id=task_id, stage=stage_name, progress=progress)
            
            # Simulate processing time
            await asyncio.sleep(2)
        
        # Simulate final results
        quality_score = 85
        quality_grade = "GOOD"
        
        PROCESSING_TASKS[task_id].update({
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "quality_score": quality_score,
            "quality_grade": quality_grade,
            "structured_data": {
                "numero_pregao": "PE-001-2024",
                "uasg": "986531",
                "orgao": "Ministério da Educação",
                "objeto": "Aquisição de equipamentos de informática",
                "valor_estimado": 250000.50,
                "data_abertura": "2024-02-15",
                "modalidade": "Pregão Eletrônico"
            },
            "risks": [
                {
                    "risk_id": "r1",
                    "description": "Prazo de entrega muito apertado",
                    "risk_type": "logistic",
                    "probability": 0.7,
                    "impact": 0.8,
                    "criticality_score": 85,
                    "mitigation_suggestions": ["Negociar prazo", "Fornecedores locais"]
                }
            ],
            "opportunities": [
                {
                    "opportunity_id": "o1",
                    "description": "Volume alto permite negociação de desconto",
                    "opportunity_type": "commercial",
                    "potential_value": 25000.0,
                    "likelihood": 0.8,
                    "strategic_importance": "high",
                    "recommended_actions": ["Negociar volume", "Lote único"]
                }
            ]
        })
        
        logger.info("Processing completed successfully", task_id=task_id)
        
    except Exception as e:
        logger.error("Processing failed", task_id=task_id, error=str(e))
        PROCESSING_TASKS[task_id].update({
            "status": "failed",
            "error": str(e),
            "completed_at": datetime.now(timezone.utc).isoformat()
        })

@app.post("/api/v1/process/document")
async def process_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    ano: Optional[int] = Form(None),
    uasg: Optional[str] = Form(None),
    numero_pregao: Optional[str] = Form(None),
    callback_url: Optional[str] = Form(None)
):
    """Upload and process document"""
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        if file.size and file.size > 50_000_000:  # 50MB
            raise HTTPException(status_code=400, detail="File too large")
        
        # Generate task ID
        task_id = str(uuid.uuid4())
        
        # Save file
        file_path = STORAGE_PATH / f"{task_id}_{file.filename}"
        content = await file.read()
        
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Initialize task
        PROCESSING_TASKS[task_id] = {
            "task_id": task_id,
            "filename": file.filename,
            "file_path": str(file_path),
            "status": "pending",
            "current_stage": 1,
            "total_stages": 9,
            "stage_name": "Inicializando",
            "progress_percentage": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "ano": ano,
            "uasg": uasg,
            "numero_pregao": numero_pregao,
            "callback_url": callback_url
        }
        
        # Start processing in background
        background_tasks.add_task(simulate_processing, task_id, file.filename)
        
        logger.info("Document uploaded for processing", 
                   task_id=task_id, filename=file.filename, size=len(content))
        
        return {
            "task_id": task_id,
            "status": "accepted",
            "message": "Document uploaded successfully, processing started"
        }
        
    except Exception as e:
        logger.error("Upload failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/process/{task_id}/status")
async def get_processing_status(task_id: str):
    """Get processing status"""
    if task_id not in PROCESSING_TASKS:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = PROCESSING_TASKS[task_id]
    return ProcessingStatus(**task)

@app.get("/api/v1/process/{task_id}/quality")
async def get_quality_scores(task_id: str):
    """Get quality scores"""
    if task_id not in PROCESSING_TASKS:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = PROCESSING_TASKS[task_id]
    
    if task["status"] != "completed":
        raise HTTPException(status_code=400, detail="Processing not completed")
    
    return QualityScores(
        overall_score=task.get("quality_score", 0),
        quality_grade=task.get("quality_grade", "UNKNOWN"),
        component_scores={
            "layout_score": 80,
            "ocr_score": 90,
            "parse_score": 85,
            "table_score": 88
        },
        processing_stages=[
            {
                "stage_id": i,
                "stage_name": f"Stage {i}",
                "duration_seconds": 2.0,
                "confidence": 0.9,
                "status": "completed",
                "errors": [],
                "warnings": []
            } for i in range(1, 10)
        ],
        total_processing_time=18.0
    )

@app.get("/api/v1/process/{task_id}/result")
async def get_processing_result(task_id: str):
    """Get complete processing result"""
    if task_id not in PROCESSING_TASKS:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = PROCESSING_TASKS[task_id]
    
    if task["status"] != "completed":
        raise HTTPException(status_code=400, detail="Processing not completed")
    
    return ProcessingResult(
        task_id=task_id,
        file_path=task["file_path"],
        structured_data=task.get("structured_data", {}),
        risks=task.get("risks", []),
        opportunities=task.get("opportunities", []),
        quality_score=task.get("quality_score", 0),
        quality_grade=task.get("quality_grade", "UNKNOWN")
    )

@app.post("/api/v1/models/download")
async def download_models():
    """Mock model download endpoint"""
    await asyncio.sleep(1)
    return {
        "status": "success",
        "message": "Models downloaded successfully (mocked)"
    }

@app.get("/api/v1/tasks")
async def list_tasks():
    """List all tasks for debugging"""
    return {
        "tasks": list(PROCESSING_TASKS.keys()),
        "count": len(PROCESSING_TASKS)
    }

if __name__ == "__main__":
    logger.info("Starting CotAi Edge AI Service (Test Mode)")
    uvicorn.run(
        "main_simple:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_config=None
    )