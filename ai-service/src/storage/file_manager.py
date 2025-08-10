"""
File management and storage component for AI service
Handles file operations, storage organization, and result persistence
"""

import asyncio
import json
import logging
import os
import shutil
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime
import aiofiles

from ..config.settings import Settings
from ..models.pipeline_models import ProcessingContext, PipelineResult
from ..utils.logger import setup_logger

logger = setup_logger(__name__)


class FileManager:
    """Manages file storage, organization, and persistence for document processing"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.storage_root = Path(settings.storage_root_path)
        self.temp_dir = Path(settings.temp_directory_path)
        self.results_dir = Path(settings.results_directory_path)
        
        # Storage structure: /storage/year/uasg/pregao/
        # Example: /storage/2024/986531/PE-001-2024/
        
    async def initialize(self):
        """Initialize file manager and create required directories"""
        logger.info("Initializing file manager")
        
        try:
            # Create base directories
            self.storage_root.mkdir(parents=True, exist_ok=True)
            self.temp_dir.mkdir(parents=True, exist_ok=True)
            self.results_dir.mkdir(parents=True, exist_ok=True)
            
            # Create subdirectories
            (self.storage_root / "uploads").mkdir(exist_ok=True)
            (self.storage_root / "processed").mkdir(exist_ok=True)
            (self.storage_root / "results").mkdir(exist_ok=True)
            
            logger.info(f"File manager initialized. Storage root: {self.storage_root}")
            
        except Exception as e:
            logger.error(f"Failed to initialize file manager: {str(e)}")
            raise
    
    async def save_original_file(self, file_content: bytes, filename: str, 
                               context: ProcessingContext) -> Path:
        """
        Save original uploaded file with organized directory structure
        
        Args:
            file_content: Raw file content
            filename: Original filename
            context: Processing context with metadata
            
        Returns:
            Path to saved file
        """
        try:
            # Create organized directory structure
            storage_path = await self._create_storage_path(context)
            
            # Clean filename and ensure it's unique
            clean_filename = self._clean_filename(filename)
            file_path = storage_path / "original" / clean_filename
            
            # Create directory if it doesn't exist
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Save file asynchronously
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(file_content)
            
            # Save metadata
            await self._save_file_metadata(file_path, context, file_content)
            
            logger.info(f"Original file saved: {file_path}")
            return file_path
            
        except Exception as e:
            logger.error(f"Failed to save original file: {str(e)}")
            raise
    
    async def save_result(self, result: PipelineResult, context: ProcessingContext) -> Path:
        """
        Save processing result with complete metadata
        
        Args:
            result: Complete pipeline result
            context: Processing context
            
        Returns:
            Path to saved result file
        """
        try:
            # Get storage path
            storage_path = await self._create_storage_path(context)
            results_path = storage_path / "results"
            results_path.mkdir(parents=True, exist_ok=True)
            
            # Create result filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            result_filename = f"result_{context.task_id}_{timestamp}.json"
            result_file_path = results_path / result_filename
            
            # Prepare complete result data
            result_data = {
                "task_id": result.task_id,
                "processing_metadata": {
                    "filename": context.filename,
                    "task_id": context.task_id,
                    "processing_completed_at": datetime.now().isoformat(),
                    "total_processing_time": sum(result.processing_times.values()),
                    "ano": context.ano,
                    "uasg": context.uasg,
                    "numero_pregao": context.numero_pregao
                },
                "structured_data": result.structured_data,
                "tables": [table.to_dict() if hasattr(table, 'to_dict') else table for table in result.tables],
                "product_tables": result.product_tables,
                "risks": [risk.to_dict() if hasattr(risk, 'to_dict') else risk for risk in result.risks],
                "opportunities": [opp.to_dict() if hasattr(opp, 'to_dict') else opp for opp in result.opportunities],
                "quality_score": result.quality_score,
                "processing_times": result.processing_times,
                "errors": result.errors,
                "warnings": result.warnings,
                "analysis": result.analysis,
                "timestamp": result.timestamp
            }
            
            # Save result file asynchronously
            async with aiofiles.open(result_file_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(result_data, indent=2, ensure_ascii=False))
            
            # Create a summary file for quick access
            await self._save_result_summary(storage_path, result_data)
            
            # Save audit trail
            await self._save_audit_trail(storage_path, context, result)
            
            logger.info(f"Processing result saved: {result_file_path}")
            return result_file_path
            
        except Exception as e:
            logger.error(f"Failed to save processing result: {str(e)}")
            raise
    
    async def save_intermediate_result(self, task_id: str, stage_name: str, 
                                     data: Dict[str, Any], context: ProcessingContext) -> Path:
        """Save intermediate processing results for debugging/audit"""
        try:
            storage_path = await self._create_storage_path(context)
            intermediate_path = storage_path / "intermediate"
            intermediate_path.mkdir(parents=True, exist_ok=True)
            
            # Create filename
            timestamp = datetime.now().strftime("%H%M%S")
            filename = f"{stage_name.lower().replace(' ', '_')}_{timestamp}.json"
            file_path = intermediate_path / filename
            
            # Save data
            async with aiofiles.open(file_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(data, indent=2, ensure_ascii=False))
            
            logger.debug(f"Intermediate result saved: {file_path}")
            return file_path
            
        except Exception as e:
            logger.warning(f"Failed to save intermediate result: {str(e)}")
            # Don't raise exception for intermediate saves
            return None
    
    async def get_file_path(self, context: ProcessingContext, file_type: str = "original") -> Path:
        """Get file path for a specific context and file type"""
        storage_path = await self._create_storage_path(context)
        return storage_path / file_type
    
    async def cleanup_temp_files(self, task_id: str):
        """Clean up temporary files for a completed task"""
        try:
            temp_task_dir = self.temp_dir / task_id
            if temp_task_dir.exists():
                shutil.rmtree(temp_task_dir)
                logger.debug(f"Cleaned up temp files for task: {task_id}")
        except Exception as e:
            logger.warning(f"Failed to cleanup temp files for task {task_id}: {str(e)}")
    
    async def _create_storage_path(self, context: ProcessingContext) -> Path:
        """Create organized storage path based on context"""
        
        # Extract year from context or use current year
        year = str(context.ano) if context.ano else str(datetime.now().year)
        
        # Create path: /storage/year/uasg/pregao/
        if context.uasg and context.numero_pregao:
            # Clean pregão number for filesystem
            clean_pregao = self._clean_filename(context.numero_pregao)
            storage_path = self.storage_root / year / context.uasg / clean_pregao
        elif context.uasg:
            storage_path = self.storage_root / year / context.uasg / "diversos"
        else:
            # Fallback to task-based organization
            storage_path = self.storage_root / year / "diversos" / context.task_id[:8]
        
        return storage_path
    
    def _clean_filename(self, filename: str) -> str:
        """Clean filename for filesystem compatibility"""
        # Remove or replace problematic characters
        import re
        
        # Replace problematic characters
        clean_name = re.sub(r'[<>:"/\\|?*]', '_', filename)
        clean_name = re.sub(r'\s+', '_', clean_name)  # Replace spaces with underscores
        clean_name = clean_name.strip('.')  # Remove leading/trailing dots
        
        # Limit length
        if len(clean_name) > 100:
            name_part, ext = os.path.splitext(clean_name)
            clean_name = name_part[:90] + ext
        
        return clean_name
    
    async def _save_file_metadata(self, file_path: Path, context: ProcessingContext, 
                                file_content: bytes):
        """Save file metadata alongside the original file"""
        try:
            metadata = {
                "filename": context.filename,
                "task_id": context.task_id,
                "file_size": len(file_content),
                "upload_timestamp": datetime.now().isoformat(),
                "ano": context.ano,
                "uasg": context.uasg,
                "numero_pregao": context.numero_pregao,
                "callback_url": context.callback_url,
                "file_path": str(file_path),
                "storage_organization": {
                    "year": str(context.ano) if context.ano else str(datetime.now().year),
                    "uasg": context.uasg,
                    "pregao": context.numero_pregao
                }
            }
            
            metadata_path = file_path.parent / f"{file_path.stem}_metadata.json"
            async with aiofiles.open(metadata_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(metadata, indent=2, ensure_ascii=False))
                
        except Exception as e:
            logger.warning(f"Failed to save file metadata: {str(e)}")
    
    async def _save_result_summary(self, storage_path: Path, result_data: Dict[str, Any]):
        """Save a summary of processing results for quick access"""
        try:
            summary = {
                "task_id": result_data["task_id"],
                "processed_at": result_data["processing_metadata"]["processing_completed_at"],
                "total_processing_time": result_data["processing_metadata"]["total_processing_time"],
                "quality_score": result_data["quality_score"].get("final_score", 0.0),
                "quality_grade": result_data["quality_score"].get("quality_grade", "UNKNOWN"),
                "total_risks": len(result_data["risks"]),
                "total_opportunities": len(result_data["opportunities"]),
                "total_tables": len(result_data["tables"]),
                "structured_data_summary": {
                    "numero_pregao": result_data["structured_data"].get("numero_pregao"),
                    "uasg": result_data["structured_data"].get("uasg"),
                    "orgao": result_data["structured_data"].get("orgao"),
                    "valor_estimado": result_data["structured_data"].get("valor_estimado")
                },
                "has_errors": len(result_data["errors"]) > 0,
                "has_warnings": len(result_data["warnings"]) > 0
            }
            
            summary_path = storage_path / "summary.json"
            async with aiofiles.open(summary_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(summary, indent=2, ensure_ascii=False))
                
        except Exception as e:
            logger.warning(f"Failed to save result summary: {str(e)}")
    
    async def _save_audit_trail(self, storage_path: Path, context: ProcessingContext, 
                              result: PipelineResult):
        """Save audit trail for compliance and debugging"""
        try:
            audit_data = {
                "task_id": context.task_id,
                "processing_timeline": {
                    "task_created": context.created_at,
                    "processing_completed": datetime.now().timestamp(),
                    "processing_stages": result.processing_times
                },
                "input_metadata": {
                    "filename": context.filename,
                    "ano": context.ano,
                    "uasg": context.uasg,
                    "numero_pregao": context.numero_pregao
                },
                "output_summary": {
                    "structured_fields_extracted": len([k for k, v in result.structured_data.items() if v]),
                    "tables_found": len(result.tables),
                    "risks_identified": len(result.risks),
                    "opportunities_identified": len(result.opportunities),
                    "processing_successful": len(result.errors) == 0
                },
                "quality_assessment": result.quality_score,
                "errors_and_warnings": {
                    "errors": result.errors,
                    "warnings": result.warnings
                }
            }
            
            audit_path = storage_path / "audit_trail.json"
            async with aiofiles.open(audit_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(audit_data, indent=2, ensure_ascii=False))
                
        except Exception as e:
            logger.warning(f"Failed to save audit trail: {str(e)}")
    
    async def load_result(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Load processing result by task ID"""
        try:
            # Search for result file
            for root in [self.storage_root, self.results_dir]:
                for result_file in root.rglob(f"result_{task_id}_*.json"):
                    async with aiofiles.open(result_file, 'r', encoding='utf-8') as f:
                        content = await f.read()
                        return json.loads(content)
            
            logger.warning(f"Result file not found for task: {task_id}")
            return None
            
        except Exception as e:
            logger.error(f"Failed to load result for task {task_id}: {str(e)}")
            return None
    
    async def list_processing_results(self, uasg: Optional[str] = None, 
                                    year: Optional[int] = None) -> List[Dict[str, Any]]:
        """List processing results with optional filtering"""
        try:
            results = []
            search_path = self.storage_root
            
            if year:
                search_path = search_path / str(year)
                if not search_path.exists():
                    return results
            
            if uasg:
                search_path = search_path / uasg
                if not search_path.exists():
                    return results
            
            # Find all summary files
            for summary_file in search_path.rglob("summary.json"):
                try:
                    async with aiofiles.open(summary_file, 'r', encoding='utf-8') as f:
                        content = await f.read()
                        summary = json.loads(content)
                        results.append(summary)
                except Exception as e:
                    logger.warning(f"Failed to read summary file {summary_file}: {str(e)}")
            
            # Sort by processing date (most recent first)
            results.sort(key=lambda x: x.get("processed_at", ""), reverse=True)
            return results
            
        except Exception as e:
            logger.error(f"Failed to list processing results: {str(e)}")
            return []