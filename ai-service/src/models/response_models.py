"""
Response models customized for CotAi Edge project requirements
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
from enum import Enum


class ProcessingStatus(str, Enum):
    """Processing status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class QualityGrade(str, Enum):
    """Quality grade classification"""
    POOR = "POOR"
    FAIR = "FAIR"  
    GOOD = "GOOD"
    EXCELLENT = "EXCELLENT"


class RiskLevel(str, Enum):
    """Risk level classification"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# === Core Response Models ===

class ProcessingResponse(BaseModel):
    """Response for document processing initiation"""
    task_id: str = Field(..., description="Unique identifier for the processing task")
    status: ProcessingStatus = Field(..., description="Current processing status")
    message: str = Field(..., description="Human-readable status message")
    estimated_completion_time: Optional[int] = Field(None, description="Estimated completion in seconds")
    
    class Config:
        schema_extra = {
            "example": {
                "task_id": "123e4567-e89b-12d3-a456-426614174000",
                "status": "processing",
                "message": "Documento enviado para processamento com sucesso",
                "estimated_completion_time": 120
            }
        }


class ComponentScores(BaseModel):
    """Individual component quality scores"""
    layout_score: float = Field(..., ge=0.0, le=1.0, description="Document layout recognition quality")
    ocr_score: float = Field(..., ge=0.0, le=1.0, description="OCR text extraction quality")
    parse_score: float = Field(..., ge=0.0, le=1.0, description="Document parsing quality")
    table_score: float = Field(..., ge=0.0, le=1.0, description="Table extraction quality")


class ProcessingStageInfo(BaseModel):
    """Information about a processing stage"""
    stage_id: int = Field(..., description="Stage number (1-9)")
    stage_name: str = Field(..., description="Human-readable stage name")
    duration_seconds: float = Field(..., description="Time spent in this stage")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence level for this stage")
    status: str = Field(..., description="Stage completion status")
    errors: List[str] = Field(default=[], description="Errors encountered in this stage")
    warnings: List[str] = Field(default=[], description="Warnings from this stage")


class QualityResponse(BaseModel):
    """Quality assessment response for client dashboard"""
    task_id: str = Field(..., description="Task identifier")
    overall_score: float = Field(..., ge=0.0, le=1.0, description="Overall quality score (0-1)")
    quality_grade: QualityGrade = Field(..., description="Quality classification")
    component_scores: ComponentScores = Field(..., description="Individual component scores")
    processing_stages: List[ProcessingStageInfo] = Field(..., description="Detailed stage information")
    processing_times: Dict[str, float] = Field(..., description="Time spent per stage")
    total_processing_time: float = Field(..., description="Total processing time in seconds")
    
    class Config:
        schema_extra = {
            "example": {
                "task_id": "123e4567-e89b-12d3-a456-426614174000",
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
                        "stage_name": "Análise de Layout",
                        "duration_seconds": 5.2,
                        "confidence": 0.92,
                        "status": "completed",
                        "errors": [],
                        "warnings": []
                    }
                ],
                "processing_times": {"stage_1": 5.2, "stage_2": 12.8},
                "total_processing_time": 45.6
            }
        }


# === Procurement-Specific Models ===

class EditalInfo(BaseModel):
    """Structured information from procurement documents"""
    numero_pregao: Optional[str] = Field(None, description="Tender/bidding number")
    uasg: Optional[str] = Field(None, description="UASG administrative unit code")
    orgao: Optional[str] = Field(None, description="Government agency/organization")
    objeto: Optional[str] = Field(None, description="Procurement object/description")
    valor_estimado: Optional[float] = Field(None, description="Estimated contract value in BRL")
    data_abertura: Optional[str] = Field(None, description="Opening date (ISO format)")
    modalidade: Optional[str] = Field(None, description="Procurement modality")
    local_entrega: Optional[str] = Field(None, description="Delivery location")
    prazo_entrega: Optional[str] = Field(None, description="Delivery deadline")
    condicoes_pagamento: Optional[str] = Field(None, description="Payment terms")
    garantia_exigida: Optional[str] = Field(None, description="Required warranty/guarantee")
    certificacoes_exigidas: List[str] = Field(default=[], description="Required certifications")
    penalidades: Dict[str, str] = Field(default={}, description="Penalties and sanctions")


class RiskItem(BaseModel):
    """Individual risk assessment"""
    risk_id: str = Field(..., description="Unique risk identifier")
    description: str = Field(..., description="Risk description in Portuguese")
    risk_type: str = Field(..., description="Type: técnico, legal, comercial, logístico")
    probability: float = Field(..., ge=0.0, le=1.0, description="Probability of occurrence")
    impact: float = Field(..., ge=0.0, le=1.0, description="Impact severity")
    criticality_score: float = Field(..., ge=0.0, le=1.0, description="Overall criticality")
    risk_level: RiskLevel = Field(..., description="Risk level classification")
    mitigation_suggestions: List[str] = Field(default=[], description="Risk mitigation suggestions")
    source_page: Optional[int] = Field(None, description="Source page number")
    source_text: Optional[str] = Field(None, description="Original text excerpt")


class OpportunityItem(BaseModel):
    """Business opportunity assessment"""
    opportunity_id: str = Field(..., description="Unique opportunity identifier")
    description: str = Field(..., description="Opportunity description in Portuguese")
    opportunity_type: str = Field(..., description="Type: alto_volume, alto_valor, recorrente, estratégico")
    potential_value: Optional[float] = Field(None, description="Estimated value in BRL")
    likelihood: float = Field(..., ge=0.0, le=1.0, description="Success likelihood")
    strategic_importance: str = Field(..., description="baixa, média, alta")
    recommended_actions: List[str] = Field(default=[], description="Recommended next steps")
    source_page: Optional[int] = Field(None, description="Source page number")


class ProductTableItem(BaseModel):
    """Structured product/item from tables"""
    item_id: Optional[str] = Field(None, description="Item identification")
    description: str = Field(..., description="Product/service description")
    quantity: Optional[Union[int, str]] = Field(None, description="Required quantity")
    unit: Optional[str] = Field(None, description="Unit of measurement")
    estimated_price: Optional[float] = Field(None, description="Estimated unit price")
    total_estimated: Optional[float] = Field(None, description="Total estimated value")
    technical_specs: Dict[str, str] = Field(default={}, description="Technical specifications")
    delivery_requirements: Optional[str] = Field(None, description="Special delivery requirements")


class TableInfo(BaseModel):
    """Extracted table information"""
    table_id: int = Field(..., description="Table identifier within document")
    page_number: int = Field(..., description="Page number where table appears")
    table_type: Optional[str] = Field(None, description="Classified table type")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Extraction confidence")
    headers: List[str] = Field(default=[], description="Table column headers")
    num_rows: int = Field(..., description="Number of data rows")
    num_cols: int = Field(..., description="Number of columns")
    structured_data: List[Dict[str, Any]] = Field(default=[], description="Structured table data")


# === Complete Processing Result ===

class ProcessingResult(BaseModel):
    """Complete document processing result - CotAi Edge format"""
    task_id: str = Field(..., description="Processing task identifier")
    file_path: str = Field(..., description="Path to original file in storage")
    
    # Core extracted data
    structured_data: EditalInfo = Field(..., description="Structured procurement information")
    tables: List[TableInfo] = Field(default=[], description="All extracted tables")
    product_tables: List[ProductTableItem] = Field(default=[], description="Product/service items")
    
    # Analysis results
    risks: List[RiskItem] = Field(default=[], description="Identified risks")
    opportunities: List[OpportunityItem] = Field(default=[], description="Business opportunities")
    
    # Quality assessment
    quality_score: float = Field(..., ge=0.0, le=1.0, description="Overall quality score")
    quality_grade: QualityGrade = Field(..., description="Quality classification")
    processing_times: Dict[str, float] = Field(..., description="Processing time per stage")
    
    # Metadata
    errors: List[str] = Field(default=[], description="Processing errors encountered")
    warnings: List[str] = Field(default=[], description="Processing warnings")
    timestamp: str = Field(..., description="Processing completion timestamp (ISO format)")
    
    # Additional analysis data (for debugging/audit)
    analysis: Dict[str, Any] = Field(default={}, description="Additional analysis metadata")
    
    class Config:
        schema_extra = {
            "example": {
                "task_id": "123e4567-e89b-12d3-a456-426614174000",
                "file_path": "storage/2025/986531/PE-001-2025/edital_original.pdf",
                "structured_data": {
                    "numero_pregao": "PE-001-2025",
                    "uasg": "986531",
                    "orgao": "Ministério da Gestão",
                    "objeto": "Contratação de serviços de TI para modernização",
                    "valor_estimado": 500000.0,
                    "data_abertura": "2025-01-15T10:30:00",
                    "modalidade": "Pregão Eletrônico"
                },
                "risks": [
                    {
                        "risk_id": "risk_001",
                        "description": "Prazo de entrega muito restrito (5 dias úteis)",
                        "risk_type": "logístico",
                        "probability": 0.7,
                        "impact": 0.8,
                        "criticality_score": 0.56,
                        "risk_level": "high"
                    }
                ],
                "opportunities": [
                    {
                        "opportunity_id": "opp_001", 
                        "description": "Contrato de alto valor com potencial de renovação",
                        "opportunity_type": "alto_valor",
                        "potential_value": 500000.0,
                        "likelihood": 0.8,
                        "strategic_importance": "alta"
                    }
                ],
                "quality_score": 0.87,
                "quality_grade": "GOOD",
                "processing_times": {"stage_1": 5.2, "stage_2": 12.8},
                "timestamp": "2025-01-15T14:30:00Z"
            }
        }


# === Status and Monitoring Models ===

class TaskStatus(BaseModel):
    """Current task processing status"""
    task_id: str = Field(..., description="Task identifier")
    status: ProcessingStatus = Field(..., description="Current processing status")
    current_stage: int = Field(..., description="Current stage (1-9)")
    stage_name: str = Field(..., description="Current stage name")
    total_stages: int = Field(default=9, description="Total pipeline stages")
    progress_percentage: float = Field(..., ge=0.0, le=100.0, description="Completion percentage")
    created_at: str = Field(..., description="Task creation timestamp")
    completed_at: Optional[str] = Field(None, description="Task completion timestamp")
    estimated_remaining_time: Optional[int] = Field(None, description="Estimated remaining seconds")
    error: Optional[str] = Field(None, description="Error message if failed")
    
    class Config:
        schema_extra = {
            "example": {
                "task_id": "123e4567-e89b-12d3-a456-426614174000",
                "status": "processing",
                "current_stage": 4,
                "stage_name": "Classificação de Conteúdo",
                "total_stages": 9,
                "progress_percentage": 44.4,
                "created_at": "2025-01-15T14:25:00Z",
                "estimated_remaining_time": 65
            }
        }


class HealthStatus(BaseModel):
    """Service health status"""
    status: str = Field(..., description="Service health status")
    service: str = Field(..., description="Service name")
    version: str = Field(default="1.0.0", description="Service version")
    uptime_seconds: float = Field(..., description="Service uptime in seconds")
    models_loaded: bool = Field(..., description="Whether AI models are loaded")
    database_connected: bool = Field(..., description="Database connection status")
    
    class Config:
        schema_extra = {
            "example": {
                "status": "healthy",
                "service": "cotai-edge-ai",
                "version": "1.0.0", 
                "uptime_seconds": 3600.5,
                "models_loaded": True,
                "database_connected": True
            }
        }