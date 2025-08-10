"""
Data models for document extraction results
"""

from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional
from datetime import datetime


@dataclass
class QualityScores:
    """Quality assessment scores from Docling confidence analysis"""
    overall_score: float
    layout_score: float
    ocr_score: float
    parse_score: float
    table_score: float
    quality_grade: str  # POOR, FAIR, GOOD, EXCELLENT
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "overall_score": self.overall_score,
            "component_scores": {
                "layout_score": self.layout_score,
                "ocr_score": self.ocr_score,
                "parse_score": self.parse_score,
                "table_score": self.table_score
            },
            "quality_grade": self.quality_grade
        }


@dataclass
class ProcessingStage:
    """Individual processing stage information"""
    stage_id: int
    stage_name: str
    duration_seconds: float
    status: str  # pending, in_progress, completed, failed
    confidence: float
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TableData:
    """Extracted table information"""
    table_id: int
    page_number: int
    raw_data: Dict[str, Any]
    structured_data: Optional[List[Dict]] = None
    headers: Optional[List[str]] = None
    num_rows: int = 0
    num_cols: int = 0
    confidence: float = 0.0
    table_type: Optional[str] = None  # product, financial, technical, etc.
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "table_id": self.table_id,
            "page_number": self.page_number,
            "raw_data": self.raw_data,
            "structured_data": self.structured_data,
            "headers": self.headers,
            "num_rows": self.num_rows,
            "num_cols": self.num_cols,
            "confidence": self.confidence,
            "table_type": self.table_type
        }


@dataclass
class ExtractionResult:
    """Complete document extraction result from Docling"""
    filename: str
    markdown_content: str
    text_content: str
    json_content: Dict[str, Any]
    tables: List[TableData]
    quality_scores: QualityScores
    processing_stages: List[ProcessingStage]
    total_processing_time: float
    confidence_score: float
    spacy_doc: Optional[Any] = None  # spaCy Doc object for layout analysis
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "filename": self.filename,
            "markdown_content": self.markdown_content,
            "text_content": self.text_content,
            "json_content": self.json_content,
            "tables": [table.to_dict() for table in self.tables],
            "quality_scores": self.quality_scores.to_dict(),
            "processing_stages": [
                {
                    "stage_id": stage.stage_id,
                    "stage_name": stage.stage_name,
                    "duration_seconds": stage.duration_seconds,
                    "status": stage.status,
                    "confidence": stage.confidence,
                    "errors": stage.errors,
                    "warnings": stage.warnings,
                    "metadata": stage.metadata
                }
                for stage in self.processing_stages
            ],
            "total_processing_time": self.total_processing_time,
            "confidence_score": self.confidence_score
        }


@dataclass
class RiskItem:
    """Individual risk item identified in document"""
    risk_id: str
    description: str
    risk_type: str  # technical, legal, commercial, logistic
    probability: float  # 0.0 to 1.0
    impact: float  # 0.0 to 1.0
    criticality_score: float  # probability * impact
    mitigation_suggestions: List[str] = field(default_factory=list)
    source_page: Optional[int] = None
    source_text: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "risk_id": self.risk_id,
            "description": self.description,
            "risk_type": self.risk_type,
            "probability": self.probability,
            "impact": self.impact,
            "criticality_score": self.criticality_score,
            "mitigation_suggestions": self.mitigation_suggestions,
            "source_page": self.source_page,
            "source_text": self.source_text
        }


@dataclass
class OpportunityItem:
    """Business opportunity identified in document"""
    opportunity_id: str
    description: str
    opportunity_type: str  # high_volume, high_value, recurring, strategic
    potential_value: Optional[float] = None
    likelihood: float = 0.0  # 0.0 to 1.0
    strategic_importance: str = "low"  # low, medium, high
    recommended_actions: List[str] = field(default_factory=list)
    source_page: Optional[int] = None
    source_text: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "opportunity_id": self.opportunity_id,
            "description": self.description,
            "opportunity_type": self.opportunity_type,
            "potential_value": self.potential_value,
            "likelihood": self.likelihood,
            "strategic_importance": self.strategic_importance,
            "recommended_actions": self.recommended_actions,
            "source_page": self.source_page,
            "source_text": self.source_text
        }


@dataclass
class StructuredData:
    """Structured information extracted from document"""
    numero_pregao: Optional[str] = None
    uasg: Optional[str] = None
    orgao: Optional[str] = None
    objeto: Optional[str] = None
    valor_estimado: Optional[float] = None
    data_abertura: Optional[str] = None
    modalidade: Optional[str] = None
    local_entrega: Optional[str] = None
    prazo_entrega: Optional[str] = None
    condicoes_pagamento: Optional[str] = None
    garantia_exigida: Optional[str] = None
    certificacoes_exigidas: List[str] = field(default_factory=list)
    penalidades: Dict[str, str] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "numero_pregao": self.numero_pregao,
            "uasg": self.uasg,
            "orgao": self.orgao,
            "objeto": self.objeto,
            "valor_estimado": self.valor_estimado,
            "data_abertura": self.data_abertura,
            "modalidade": self.modalidade,
            "local_entrega": self.local_entrega,
            "prazo_entrega": self.prazo_entrega,
            "condicoes_pagamento": self.condicoes_pagamento,
            "garantia_exigida": self.garantia_exigida,
            "certificacoes_exigidas": self.certificacoes_exigidas,
            "penalidades": self.penalidades
        }