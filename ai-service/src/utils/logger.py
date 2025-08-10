"""
Structured logging configuration for CotAi Edge AI Service
"""

import logging
import sys
from typing import Optional
import structlog
from datetime import datetime


def setup_logger(name: str, level: str = "INFO") -> structlog.BoundLogger:
    """
    Setup structured logging with consistent format
    
    Args:
        name: Logger name (usually __name__)
        level: Log level (DEBUG, INFO, WARNING, ERROR)
    
    Returns:
        Configured structlog logger
    """
    
    # Configure standard logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, level.upper())
    )
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    return structlog.get_logger(name)


class ProcessingLogger:
    """
    Specialized logger for tracking document processing stages
    """
    
    def __init__(self, task_id: str):
        self.task_id = task_id
        self.logger = setup_logger("processing")
        self.start_time = datetime.now()
    
    def log_stage_start(self, stage_id: int, stage_name: str):
        """Log the start of a processing stage"""
        self.logger.info(
            "Stage started",
            task_id=self.task_id,
            stage_id=stage_id,
            stage_name=stage_name,
            timestamp=datetime.now().isoformat()
        )
    
    def log_stage_complete(self, stage_id: int, stage_name: str, 
                          duration: float, confidence: float):
        """Log the completion of a processing stage"""
        self.logger.info(
            "Stage completed",
            task_id=self.task_id,
            stage_id=stage_id,
            stage_name=stage_name,
            duration_seconds=duration,
            confidence=confidence,
            timestamp=datetime.now().isoformat()
        )
    
    def log_stage_error(self, stage_id: int, stage_name: str, error: str):
        """Log an error in a processing stage"""
        self.logger.error(
            "Stage failed",
            task_id=self.task_id,
            stage_id=stage_id,
            stage_name=stage_name,
            error=error,
            timestamp=datetime.now().isoformat()
        )
    
    def log_quality_score(self, overall_score: float, component_scores: dict):
        """Log quality assessment results"""
        self.logger.info(
            "Quality assessment completed",
            task_id=self.task_id,
            overall_score=overall_score,
            component_scores=component_scores,
            timestamp=datetime.now().isoformat()
        )
    
    def log_risks_identified(self, risk_count: int, high_risk_count: int):
        """Log risk analysis results"""
        self.logger.info(
            "Risk analysis completed",
            task_id=self.task_id,
            total_risks=risk_count,
            high_risk_count=high_risk_count,
            timestamp=datetime.now().isoformat()
        )
    
    def log_opportunities_identified(self, opportunity_count: int, 
                                   high_value_count: int):
        """Log opportunity analysis results"""
        self.logger.info(
            "Opportunity analysis completed",
            task_id=self.task_id,
            total_opportunities=opportunity_count,
            high_value_count=high_value_count,
            timestamp=datetime.now().isoformat()
        )
    
    def log_final_result(self, total_processing_time: float, 
                        final_quality_score: float):
        """Log final processing results"""
        self.logger.info(
            "Document processing completed",
            task_id=self.task_id,
            total_processing_time=total_processing_time,
            final_quality_score=final_quality_score,
            timestamp=datetime.now().isoformat()
        )