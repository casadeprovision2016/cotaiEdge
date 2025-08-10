"""
9-Stage Document Processing Pipeline
Implements the complete pipeline as described in cotaipy.md
"""

import asyncio
import json
import logging
import time
import uuid
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import asdict

# Core dependencies
from fastapi import UploadFile

from ..config.settings import Settings
from ..extractors.docling_extractor import DoclingExtractor
from ..analyzers.llm_analyzer import LLMAnalyzer
from ..analyzers.risk_analyzer import RiskAnalyzer
from ..analyzers.opportunity_analyzer import OpportunityAnalyzer
from ..analyzers.quality_analyzer import QualityAnalyzer
from ..models.pipeline_models import (
    ProcessingContext,
    PipelineResult,
    ProcessingStage,
    TaskStatus
)
from ..storage.file_manager import FileManager
from ..utils.logger import setup_logger

logger = setup_logger(__name__)


class DocumentProcessor:
    """
    Main document processor implementing 9-stage pipeline:
    
    Stages 1-3: Document Parsing & Extraction (Docling)
    Stages 4-6: AI Analysis (LLM)
    Stages 7-9: Data Structuring & Quality Assessment
    """
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.docling_extractor = DoclingExtractor(settings)
        self.llm_analyzer = LLMAnalyzer(settings)
        self.risk_analyzer = RiskAnalyzer(settings)
        self.opportunity_analyzer = OpportunityAnalyzer(settings)
        self.quality_analyzer = QualityAnalyzer(settings)
        self.file_manager = FileManager(settings)
        
        # Active tasks tracking
        self.active_tasks: Dict[str, TaskStatus] = {}
    
    async def initialize(self):
        """Initialize all pipeline components"""
        logger.info("Initializing document processor pipeline")
        
        await self.docling_extractor.initialize()
        await self.llm_analyzer.initialize()
        await self.risk_analyzer.initialize()
        await self.opportunity_analyzer.initialize()
        await self.quality_analyzer.initialize()
        await self.file_manager.initialize()
        
        logger.info("Document processor pipeline initialized")
    
    async def cleanup(self):
        """Cleanup resources"""
        logger.info("Cleaning up document processor")
        # Add cleanup logic for components
    
    async def process_document(self, file: UploadFile, context: Dict[str, Any]) -> str:
        """
        Start document processing pipeline
        
        Args:
            file: Uploaded document file
            context: Processing context (ano, uasg, numero_pregao, callback_url)
        
        Returns:
            task_id: Unique identifier for tracking processing
        """
        task_id = str(uuid.uuid4())
        
        # Create processing context
        processing_context = ProcessingContext(
            task_id=task_id,
            filename=file.filename,
            ano=context.get("ano"),
            uasg=context.get("uasg"),
            numero_pregao=context.get("numero_pregao"),
            callback_url=context.get("callback_url")
        )
        
        # Initialize task status
        self.active_tasks[task_id] = TaskStatus(
            task_id=task_id,
            status="processing",
            current_stage=1,
            total_stages=9,
            created_at=time.time()
        )
        
        # Start processing in background
        asyncio.create_task(self._process_pipeline(file, processing_context))
        
        return task_id
    
    async def _process_pipeline(self, file: UploadFile, context: ProcessingContext):
        """Execute the complete 9-stage processing pipeline"""
        task_id = context.task_id
        stages = []
        
        try:
            # Read file content
            file_content = await file.read()
            
            # Save original file
            file_path = await self.file_manager.save_original_file(
                file_content, context.filename, context
            )
            
            logger.info(f"Starting 9-stage pipeline for task {task_id}")
            
            # === STAGES 1-3: DOCUMENT PARSING & EXTRACTION ===
            extraction_result = await self._execute_stages_1_3(
                file_content, context.filename, task_id
            )
            stages.extend(extraction_result.processing_stages)
            
            # === STAGES 4-6: AI ANALYSIS ===
            analysis_result = await self._execute_stages_4_6(
                extraction_result, context, task_id
            )
            stages.extend(analysis_result["stages"])
            
            # === STAGES 7-9: DATA STRUCTURING ===
            final_result = await self._execute_stages_7_9(
                extraction_result, analysis_result, context, task_id
            )
            stages.extend(final_result["stages"])
            
            # Compile final result
            pipeline_result = PipelineResult(
                task_id=task_id,
                file_path=str(file_path),
                structured_data=final_result["structured_data"],
                tables=extraction_result.tables,
                product_tables=final_result["product_tables"],
                risks=analysis_result["risks"],
                opportunities=analysis_result["opportunities"],
                quality_score=final_result["quality_score"],
                processing_times={f"stage_{s.stage_id}": s.duration_seconds for s in stages},
                errors=final_result.get("errors", []),
                warnings=final_result.get("warnings", []),
                analysis=final_result.get("analysis", {}),
                timestamp=time.time()
            )
            
            # Save result
            result_path = await self.file_manager.save_result(pipeline_result, context)
            
            # Update task status
            self.active_tasks[task_id].status = "completed"
            self.active_tasks[task_id].result_path = str(result_path)
            self.active_tasks[task_id].completed_at = time.time()
            
            # Send callback if provided
            if context.callback_url:
                await self._send_callback(context.callback_url, {
                    "task_id": task_id,
                    "status": "completed",
                    "result_path": str(result_path)
                })
            
            logger.info(f"Pipeline completed successfully for task {task_id}")
            
        except Exception as e:
            error_msg = f"Pipeline failed for task {task_id}: {str(e)}"
            logger.error(error_msg)
            
            # Update task status
            self.active_tasks[task_id].status = "failed"
            self.active_tasks[task_id].error = error_msg
            self.active_tasks[task_id].completed_at = time.time()
            
            # Send callback if provided
            if context.callback_url:
                await self._send_callback(context.callback_url, {
                    "task_id": task_id,
                    "status": "failed",
                    "error": error_msg
                })
    
    async def _execute_stages_1_3(self, file_content: bytes, filename: str, task_id: str):
        """Execute Stages 1-3: Document Parsing & Extraction using Docling"""
        logger.info(f"Executing stages 1-3 for task {task_id}")
        
        # Update task status
        self.active_tasks[task_id].current_stage = 1
        self.active_tasks[task_id].stage_name = "Document Parsing & Extraction"
        
        # Execute Docling extraction
        result = await self.docling_extractor.extract_document(file_content, filename)
        
        # Update task status
        self.active_tasks[task_id].current_stage = 3
        
        return result
    
    async def _execute_stages_4_6(self, extraction_result, context: ProcessingContext, task_id: str):
        """Execute Stages 4-6: AI Analysis using LLM"""
        logger.info(f"Executing stages 4-6 for task {task_id}")
        
        # Stage 4: Content Classification
        self.active_tasks[task_id].current_stage = 4
        self.active_tasks[task_id].stage_name = "Content Classification"
        
        stage4_start = time.time()
        classification_result = await self.llm_analyzer.classify_content(
            extraction_result.markdown_content,
            extraction_result.tables
        )
        stage4_time = time.time() - stage4_start
        
        # Stage 5: Risk Analysis
        self.active_tasks[task_id].current_stage = 5
        self.active_tasks[task_id].stage_name = "Risk Analysis"
        
        stage5_start = time.time()
        risks = await self.risk_analyzer.analyze_risks(
            extraction_result.markdown_content,
            classification_result["structured_data"]
        )
        stage5_time = time.time() - stage5_start
        
        # Stage 6: Opportunity Identification
        self.active_tasks[task_id].current_stage = 6
        self.active_tasks[task_id].stage_name = "Opportunity Identification"
        
        stage6_start = time.time()
        opportunities = await self.opportunity_analyzer.identify_opportunities(
            extraction_result.markdown_content,
            classification_result["structured_data"],
            extraction_result.tables
        )
        stage6_time = time.time() - stage6_start
        
        # Prepare stages
        stages = [
            ProcessingStage(
                stage_id=4,
                stage_name="Content Classification",
                duration_seconds=stage4_time,
                status="completed",
                confidence=0.85
            ),
            ProcessingStage(
                stage_id=5,
                stage_name="Risk Analysis",
                duration_seconds=stage5_time,
                status="completed",
                confidence=0.80
            ),
            ProcessingStage(
                stage_id=6,
                stage_name="Opportunity Identification",
                duration_seconds=stage6_time,
                status="completed",
                confidence=0.75
            )
        ]
        
        return {
            "structured_data": classification_result["structured_data"],
            "risks": risks,
            "opportunities": opportunities,
            "stages": stages
        }
    
    async def _execute_stages_7_9(self, extraction_result, analysis_result, 
                                 context: ProcessingContext, task_id: str):
        """Execute Stages 7-9: Data Structuring & Quality Assessment"""
        logger.info(f"Executing stages 7-9 for task {task_id}")
        
        # Stage 7: Data Validation
        self.active_tasks[task_id].current_stage = 7
        self.active_tasks[task_id].stage_name = "Data Validation"
        
        stage7_start = time.time()
        validation_result = await self.quality_analyzer.validate_data(
            analysis_result["structured_data"],
            extraction_result.tables,
            analysis_result["risks"]
        )
        stage7_time = time.time() - stage7_start
        
        # Stage 8: Structured Output
        self.active_tasks[task_id].current_stage = 8
        self.active_tasks[task_id].stage_name = "Structured Output"
        
        stage8_start = time.time()
        
        # Process product tables
        product_tables = await self._classify_product_tables(extraction_result.tables)
        
        stage8_time = time.time() - stage8_start
        
        # Stage 9: Result Compilation
        self.active_tasks[task_id].current_stage = 9
        self.active_tasks[task_id].stage_name = "Result Compilation"
        
        stage9_start = time.time()
        
        # Calculate final quality score
        quality_score = await self.quality_analyzer.calculate_final_quality(
            extraction_result.quality_scores,
            validation_result,
            len(analysis_result["risks"]),
            len(analysis_result["opportunities"])
        )
        
        stage9_time = time.time() - stage9_start
        
        # Prepare stages
        stages = [
            ProcessingStage(
                stage_id=7,
                stage_name="Data Validation",
                duration_seconds=stage7_time,
                status="completed",
                confidence=0.90
            ),
            ProcessingStage(
                stage_id=8,
                stage_name="Structured Output",
                duration_seconds=stage8_time,
                status="completed",
                confidence=0.95
            ),
            ProcessingStage(
                stage_id=9,
                stage_name="Result Compilation",
                duration_seconds=stage9_time,
                status="completed",
                confidence=0.95
            )
        ]
        
        return {
            "structured_data": analysis_result["structured_data"],
            "product_tables": product_tables,
            "quality_score": quality_score,
            "errors": validation_result.get("errors", []),
            "warnings": validation_result.get("warnings", []),
            "analysis": {
                "validation": validation_result,
                "extraction_metadata": extraction_result.json_content
            },
            "stages": stages
        }
    
    async def _classify_product_tables(self, tables: List) -> List[Dict]:
        """Classify and structure product tables"""
        product_tables = []
        
        for table in tables:
            # Use LLM to classify if table contains products/items
            is_product_table = await self.llm_analyzer.is_product_table(table.raw_data)
            
            if is_product_table:
                structured_table = await self.llm_analyzer.structure_product_table(table.raw_data)
                product_tables.append(structured_table)
        
        return product_tables
    
    async def _send_callback(self, callback_url: str, data: Dict[str, Any]):
        """Send callback notification"""
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.post(callback_url, json=data, timeout=30)
                response.raise_for_status()
                logger.info(f"Callback sent successfully to {callback_url}")
        except Exception as e:
            logger.error(f"Failed to send callback to {callback_url}: {e}")
    
    async def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """Get current processing status for a task"""
        if task_id not in self.active_tasks:
            raise ValueError(f"Task {task_id} not found")
        
        task = self.active_tasks[task_id]
        return asdict(task)
    
    async def get_quality_scores(self, task_id: str) -> Dict[str, Any]:
        """Get quality scores for a completed task"""
        if task_id not in self.active_tasks:
            raise ValueError(f"Task {task_id} not found")
        
        task = self.active_tasks[task_id]
        if task.status != "completed":
            raise ValueError(f"Task {task_id} is not completed")
        
        # Load and return quality data from result file
        result_path = Path(task.result_path)
        if not result_path.exists():
            raise ValueError(f"Result file not found for task {task_id}")
        
        with open(result_path, 'r', encoding='utf-8') as f:
            result_data = json.load(f)
        
        return {
            "task_id": task_id,
            "quality_score": result_data["quality_score"],
            "processing_times": result_data["processing_times"],
            "errors": result_data.get("errors", []),
            "warnings": result_data.get("warnings", [])
        }
    
    async def get_processing_result(self, task_id: str) -> Dict[str, Any]:
        """Get complete processing result"""
        if task_id not in self.active_tasks:
            raise ValueError(f"Task {task_id} not found")
        
        task = self.active_tasks[task_id]
        if task.status != "completed":
            raise ValueError(f"Task {task_id} is not completed")
        
        # Load result from file
        result_path = Path(task.result_path)
        with open(result_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    async def download_models(self):
        """Download required models"""
        await self.docling_extractor.download_models()