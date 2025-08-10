"""
Pipeline data models for document processing workflow
"""

from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional
from datetime import datetime


@dataclass
class ProcessingContext:
    """Processing context for document pipeline"""
    task_id: str
    filename: str
    ano: Optional[int] = None
    uasg: Optional[str] = None
    numero_pregao: Optional[str] = None
    callback_url: Optional[str] = None
    created_at: float = field(default_factory=lambda: datetime.now().timestamp())
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "filename": self.filename,
            "ano": self.ano,
            "uasg": self.uasg,
            "numero_pregao": self.numero_pregao,
            "callback_url": self.callback_url,
            "created_at": self.created_at
        }


@dataclass
class TaskStatus:
    """Task processing status tracking"""
    task_id: str
    status: str  # processing, completed, failed
    current_stage: int
    total_stages: int
    stage_name: str = ""
    progress_percentage: float = 0.0
    created_at: float = field(default_factory=lambda: datetime.now().timestamp())
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    error: Optional[str] = None
    result_path: Optional[str] = None
    
    def update_progress(self):
        """Update progress percentage based on current stage"""
        if self.total_stages > 0:
            self.progress_percentage = (self.current_stage / self.total_stages) * 100
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "status": self.status,
            "current_stage": self.current_stage,
            "total_stages": self.total_stages,
            "stage_name": self.stage_name,
            "progress_percentage": self.progress_percentage,
            "created_at": self.created_at,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "error": self.error,
            "result_path": self.result_path
        }


@dataclass
class PipelineResult:
    """Complete result from document processing pipeline"""
    task_id: str
    file_path: str
    structured_data: Dict[str, Any]
    tables: List[Dict[str, Any]]
    product_tables: List[Dict[str, Any]]
    risks: List[Dict[str, Any]]
    opportunities: List[Dict[str, Any]]
    quality_score: Dict[str, Any]
    processing_times: Dict[str, float]
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    analysis: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=lambda: datetime.now().timestamp())
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "file_path": self.file_path,
            "structured_data": self.structured_data,
            "tables": self.tables,
            "product_tables": self.product_tables,
            "risks": self.risks,
            "opportunities": self.opportunities,
            "quality_score": self.quality_score,
            "processing_times": self.processing_times,
            "errors": self.errors,
            "warnings": self.warnings,
            "analysis": self.analysis,
            "timestamp": self.timestamp,
            "processing_metadata": {
                "total_processing_time": sum(self.processing_times.values()),
                "stages_completed": len(self.processing_times),
                "total_risks": len(self.risks),
                "total_opportunities": len(self.opportunities),
                "total_tables": len(self.tables),
                "total_product_tables": len(self.product_tables),
                "has_errors": len(self.errors) > 0,
                "has_warnings": len(self.warnings) > 0
            }
        }


@dataclass
class DocumentAnalysisResult:
    """Result from document analysis stages"""
    task_id: str
    analysis_type: str  # classification, risk_analysis, opportunity_analysis
    results: Dict[str, Any]
    confidence_score: float
    processing_time: float
    stage_id: int
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "analysis_type": self.analysis_type,
            "results": self.results,
            "confidence_score": self.confidence_score,
            "processing_time": self.processing_time,
            "stage_id": self.stage_id,
            "errors": self.errors,
            "warnings": self.warnings,
            "metadata": self.metadata
        }


@dataclass
class QualityAssessment:
    """Quality assessment result"""
    overall_score: float
    component_scores: Dict[str, float]
    quality_grade: str  # POOR, FAIR, GOOD, EXCELLENT
    recommendations: List[str]
    validation_errors: List[str] = field(default_factory=list)
    validation_warnings: List[str] = field(default_factory=list)
    assessment_details: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "overall_score": self.overall_score,
            "component_scores": self.component_scores,
            "quality_grade": self.quality_grade,
            "recommendations": self.recommendations,
            "validation_errors": self.validation_errors,
            "validation_warnings": self.validation_warnings,
            "assessment_details": self.assessment_details
        }


@dataclass
class ProcessingStageMetrics:
    """Metrics for individual processing stages"""
    stage_id: int
    stage_name: str
    start_time: float
    end_time: float
    duration: float
    memory_usage_mb: Optional[float] = None
    cpu_usage_percent: Optional[float] = None
    success: bool = True
    error_message: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "stage_id": self.stage_id,
            "stage_name": self.stage_name,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "duration": self.duration,
            "memory_usage_mb": self.memory_usage_mb,
            "cpu_usage_percent": self.cpu_usage_percent,
            "success": self.success,
            "error_message": self.error_message
        }


@dataclass
class DocumentMetadata:
    """Document metadata and processing information"""
    filename: str
    file_size_bytes: int
    file_type: str
    pages: int
    creation_date: Optional[str] = None
    modification_date: Optional[str] = None
    author: Optional[str] = None
    title: Optional[str] = None
    subject: Optional[str] = None
    language: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "filename": self.filename,
            "file_size_bytes": self.file_size_bytes,
            "file_type": self.file_type,
            "pages": self.pages,
            "creation_date": self.creation_date,
            "modification_date": self.modification_date,
            "author": self.author,
            "title": self.title,
            "subject": self.subject,
            "language": self.language
        }


@dataclass
class ProcessingConfiguration:
    """Configuration for document processing pipeline"""
    enable_ocr: bool = True
    ocr_language: str = "pt"
    enable_table_extraction: bool = True
    enable_image_extraction: bool = False
    enable_risk_analysis: bool = True
    enable_opportunity_analysis: bool = True
    quality_threshold: float = 0.7
    max_processing_time: int = 3600  # seconds
    callback_enabled: bool = False
    save_intermediate_results: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "enable_ocr": self.enable_ocr,
            "ocr_language": self.ocr_language,
            "enable_table_extraction": self.enable_table_extraction,
            "enable_image_extraction": self.enable_image_extraction,
            "enable_risk_analysis": self.enable_risk_analysis,
            "enable_opportunity_analysis": self.enable_opportunity_analysis,
            "quality_threshold": self.quality_threshold,
            "max_processing_time": self.max_processing_time,
            "callback_enabled": self.callback_enabled,
            "save_intermediate_results": self.save_intermediate_results
        }


@dataclass
class AuditLog:
    """Audit log entry for processing pipeline"""
    task_id: str
    timestamp: float
    action: str
    stage_id: Optional[int] = None
    stage_name: Optional[str] = None
    status: str = "info"  # info, warning, error
    message: str = ""
    details: Dict[str, Any] = field(default_factory=dict)
    user_id: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "timestamp": self.timestamp,
            "action": self.action,
            "stage_id": self.stage_id,
            "stage_name": self.stage_name,
            "status": self.status,
            "message": self.message,
            "details": self.details,
            "user_id": self.user_id
        }