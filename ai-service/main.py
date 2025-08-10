"""
CotAi Edge AI Service - Document Processing with Docling
Main service entry point implementing 9-stage processing pipeline
"""

import asyncio
import logging
import os
from pathlib import Path
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from src.pipeline.document_processor import DocumentProcessor
from src.config.settings import Settings
from src.models.response_models import ProcessingResponse, QualityResponse
from src.utils.logger import setup_logger

# Setup logging
logger = setup_logger(__name__)

# Global processor instance
processor: DocumentProcessor = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan - startup and shutdown"""
    global processor
    logger.info("Starting CotAi Edge AI Service")
    
    # Initialize processor
    settings = Settings()
    processor = DocumentProcessor(settings)
    await processor.initialize()
    
    yield
    
    # Cleanup
    logger.info("Shutting down CotAi Edge AI Service")
    await processor.cleanup()


# Create FastAPI app
app = FastAPI(
    title="CotAi Edge AI Service",
    description="Advanced document processing with Docling and 9-stage pipeline",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "cotai-edge-ai"}


@app.post("/api/v1/process/document", response_model=ProcessingResponse)
async def process_document(
    file: UploadFile = File(...),
    ano: int = Form(None),
    uasg: str = Form(None),
    numero_pregao: str = Form(None),
    callback_url: str = Form(None)
):
    """
    Process document using 9-stage Docling pipeline
    
    Args:
        file: PDF document to process
        ano: Year for organization (optional)
        uasg: UASG code for organization (optional)
        numero_pregao: Tender number for organization (optional)
        callback_url: URL for completion callback (optional)
    
    Returns:
        ProcessingResponse with task_id and initial status
    """
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=400, 
                detail="Only PDF files are supported"
            )
        
        # Create processing context
        context = {
            "ano": ano,
            "uasg": uasg,
            "numero_pregao": numero_pregao,
            "callback_url": callback_url
        }
        
        # Start processing
        task_id = await processor.process_document(file, context)
        
        return ProcessingResponse(
            task_id=task_id,
            status="processing",
            message="Document processing started"
        )
        
    except Exception as e:
        logger.error(f"Error processing document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/process/{task_id}/status")
async def get_processing_status(task_id: str):
    """Get processing status for a task"""
    try:
        status = await processor.get_task_status(task_id)
        return status
    except Exception as e:
        logger.error(f"Error getting task status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/process/{task_id}/quality", response_model=QualityResponse)
async def get_quality_scores(task_id: str):
    """Get quality scores and confidence metrics for a processed document"""
    try:
        quality_data = await processor.get_quality_scores(task_id)
        return quality_data
    except Exception as e:
        logger.error(f"Error getting quality scores: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/process/{task_id}/result")
async def get_processing_result(task_id: str):
    """Get final processing result"""
    try:
        result = await processor.get_processing_result(task_id)
        return result
    except Exception as e:
        logger.error(f"Error getting processing result: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/models/download")
async def download_models():
    """Download and cache Docling models"""
    try:
        await processor.download_models()
        return {"status": "success", "message": "Models downloaded successfully"}
    except Exception as e:
        logger.error(f"Error downloading models: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    # Load environment variables
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    
    # Run the server
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )