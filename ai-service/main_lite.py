"""
CotAi Edge AI Service - Lite Version for Testing
Basic FastAPI service without heavy dependencies
"""

import os
import time
import uuid
from typing import Dict, Any
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Create FastAPI app
app = FastAPI(
    title="CotAi Edge AI Service (Lite)",
    description="Lightweight AI service for testing Docker deployment",
    version="1.0.0-lite"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory task storage for testing
active_tasks: Dict[str, Dict[str, Any]] = {}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "service": "cotai-edge-ai-lite",
        "version": "1.0.0-lite",
        "timestamp": time.time()
    }

@app.post("/api/v1/process/document")
async def process_document_lite(
    file: UploadFile = File(...),
    ano: int = Form(None),
    uasg: str = Form(None),
    numero_pregao: str = Form(None),
    callback_url: str = Form(None)
):
    """
    Process document (lite version for testing)
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Create mock task
        task_id = str(uuid.uuid4())
        
        # Store task info
        active_tasks[task_id] = {
            "task_id": task_id,
            "status": "processing",
            "filename": file.filename,
            "created_at": time.time(),
            "progress": 0,
            "current_stage": 1,
            "total_stages": 9
        }
        
        # Read file content (just for testing)
        content = await file.read()
        file_size = len(content)
        
        # Update task with mock processing
        active_tasks[task_id].update({
            "status": "completed",
            "progress": 100,
            "current_stage": 9,
            "file_size": file_size,
            "completed_at": time.time(),
            "mock_result": {
                "pages_processed": 1,
                "text_extracted": f"Mock extracted text from {file.filename}",
                "quality_score": 85.0,
                "processing_time": 2.5
            }
        })
        
        return {
            "task_id": task_id,
            "status": "processing",
            "message": f"Document {file.filename} processing started (lite mode)"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/process/{task_id}/status")
async def get_processing_status(task_id: str):
    """Get processing status for a task"""
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    
    return active_tasks[task_id]

@app.get("/api/v1/process/{task_id}/quality")
async def get_quality_scores(task_id: str):
    """Get quality scores for a processed document"""
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    
    task = active_tasks[task_id]
    if task["status"] != "completed":
        raise HTTPException(status_code=400, detail=f"Task {task_id} is not completed")
    
    return {
        "task_id": task_id,
        "overall_score": 85.0,
        "quality_grade": "GOOD",
        "component_scores": {
            "layout_score": 88.0,
            "ocr_score": 82.0,
            "parse_score": 85.0,
            "table_score": 87.0
        },
        "processing_stages": [
            {"stage_id": i, "stage_name": f"Stage {i}", "duration_seconds": 0.5, "status": "completed", "confidence": 0.8 + i*0.02}
            for i in range(1, 10)
        ]
    }

@app.get("/api/v1/process/{task_id}/result")
async def get_processing_result(task_id: str):
    """Get complete processing result"""
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    
    task = active_tasks[task_id]
    if task["status"] != "completed":
        raise HTTPException(status_code=400, detail=f"Task {task_id} is not completed")
    
    return {
        "task_id": task_id,
        "filename": task["filename"],
        "status": "completed",
        "result": task.get("mock_result", {}),
        "created_at": task["created_at"],
        "completed_at": task.get("completed_at")
    }

@app.get("/api/v1/tasks")
async def list_tasks():
    """List all tasks"""
    return {
        "total_tasks": len(active_tasks),
        "tasks": list(active_tasks.values())
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "CotAi Edge AI Service (Lite)",
        "version": "1.0.0-lite",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "process": "/api/v1/process/document",
            "status": "/api/v1/process/{task_id}/status",
            "quality": "/api/v1/process/{task_id}/quality",
            "result": "/api/v1/process/{task_id}/result"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)