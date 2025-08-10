"""
Quality analysis component for document processing
Implements comprehensive quality assessment and validation
"""

import logging
import statistics
from typing import Dict, List, Any, Optional

from ..config.settings import Settings
from ..models.extraction_models import QualityScores, RiskItem, StructuredData, TableData
from ..utils.logger import setup_logger

logger = setup_logger(__name__)


class QualityAnalyzer:
    """Quality assessment and validation for document processing results"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        
        # Quality assessment criteria
        self.quality_weights = {
            "extraction_quality": 0.30,
            "data_completeness": 0.25,
            "content_structure": 0.20,
            "risk_assessment": 0.15,
            "opportunity_identification": 0.10
        }
        
        # Required fields for completeness assessment
        self.required_fields = [
            "numero_pregao", "uasg", "orgao", "objeto", "valor_estimado",
            "data_abertura", "modalidade"
        ]
    
    async def initialize(self):
        """Initialize quality analyzer"""
        logger.info("Initializing quality analyzer")
        
    async def validate_data(self, structured_data: StructuredData,
                          tables: List[TableData], risks: List[RiskItem]) -> Dict[str, Any]:
        """
        Stage 7: Data Validation
        Validate extracted data for quality and completeness
        """
        logger.info("Starting data validation")
        
        validation_result = {
            "completeness_score": 0.0,
            "accuracy_score": 0.0,
            "consistency_score": 0.0,
            "overall_validation_score": 0.0,
            "errors": [],
            "warnings": [],
            "missing_fields": [],
            "validation_details": {}
        }
        
        # Assess data completeness
        completeness_result = await self._assess_completeness(structured_data)
        validation_result["completeness_score"] = completeness_result["score"]
        validation_result["missing_fields"] = completeness_result["missing_fields"]
        validation_result["warnings"].extend(completeness_result["warnings"])
        
        # Assess data accuracy
        accuracy_result = await self._assess_accuracy(structured_data)
        validation_result["accuracy_score"] = accuracy_result["score"]
        validation_result["errors"].extend(accuracy_result["errors"])
        validation_result["warnings"].extend(accuracy_result["warnings"])
        
        # Assess data consistency
        consistency_result = await self._assess_consistency(structured_data, tables)
        validation_result["consistency_score"] = consistency_result["score"]
        validation_result["errors"].extend(consistency_result["errors"])
        validation_result["warnings"].extend(consistency_result["warnings"])
        
        # Calculate overall validation score
        validation_result["overall_validation_score"] = (
            validation_result["completeness_score"] * 0.4 +
            validation_result["accuracy_score"] * 0.4 +
            validation_result["consistency_score"] * 0.2
        )
        
        # Add validation details
        validation_result["validation_details"] = {
            "total_fields_analyzed": len(self.required_fields),
            "fields_with_data": len(self.required_fields) - len(completeness_result["missing_fields"]),
            "accuracy_checks_performed": accuracy_result["checks_performed"],
            "consistency_checks_performed": consistency_result["checks_performed"]
        }
        
        logger.info(f"Data validation completed. Overall score: {validation_result['overall_validation_score']:.2f}")
        return validation_result
    
    async def calculate_final_quality(self, extraction_scores: QualityScores,
                                    validation_result: Dict[str, Any],
                                    risk_count: int, opportunity_count: int) -> Dict[str, Any]:
        """
        Stage 9: Calculate final quality score combining all assessments
        """
        logger.info("Calculating final quality score")
        
        # Component scores
        extraction_quality = extraction_scores.overall_score
        data_completeness = validation_result["completeness_score"]
        content_structure = validation_result["consistency_score"]
        
        # Risk assessment score (inverse - fewer high-risk items = better score)
        critical_risks = sum(1 for _ in range(risk_count))  # Simplified
        risk_score = max(0.0, 1.0 - (critical_risks * 0.1))
        
        # Opportunity identification score
        opportunity_score = min(1.0, opportunity_count * 0.2)
        
        # Calculate weighted final score
        final_score = (
            extraction_quality * self.quality_weights["extraction_quality"] +
            data_completeness * self.quality_weights["data_completeness"] +
            content_structure * self.quality_weights["content_structure"] +
            risk_score * self.quality_weights["risk_assessment"] +
            opportunity_score * self.quality_weights["opportunity_identification"]
        )
        
        # Determine quality grade
        quality_grade = self._score_to_grade(final_score)
        
        # Quality breakdown
        quality_breakdown = {
            "final_score": round(final_score, 3),
            "quality_grade": quality_grade,
            "component_scores": {
                "extraction_quality": round(extraction_quality, 3),
                "data_completeness": round(data_completeness, 3),
                "content_structure": round(content_structure, 3),
                "risk_assessment": round(risk_score, 3),
                "opportunity_identification": round(opportunity_score, 3)
            },
            "component_weights": self.quality_weights,
            "analysis_summary": {
                "total_risks_identified": risk_count,
                "total_opportunities_identified": opportunity_count,
                "data_validation_score": validation_result["overall_validation_score"],
                "extraction_confidence": extraction_scores.overall_score
            },
            "recommendations": await self._generate_quality_recommendations(
                final_score, quality_grade, validation_result, risk_count, opportunity_count
            )
        }
        
        logger.info(f"Final quality calculation completed. Grade: {quality_grade}, Score: {final_score:.3f}")
        return quality_breakdown
    
    async def _assess_completeness(self, structured_data: StructuredData) -> Dict[str, Any]:
        """Assess data completeness"""
        
        missing_fields = []
        warnings = []
        
        # Check required fields
        data_dict = structured_data.to_dict()
        for field in self.required_fields:
            value = data_dict.get(field)
            if not value:
                missing_fields.append(field)
            elif isinstance(value, str) and len(value.strip()) == 0:
                missing_fields.append(field)
                warnings.append(f"Campo '{field}' está vazio")
        
        # Calculate completeness score
        completeness_score = (len(self.required_fields) - len(missing_fields)) / len(self.required_fields)
        
        # Additional warnings for optional but important fields
        if not structured_data.local_entrega:
            warnings.append("Local de entrega não identificado")
        if not structured_data.prazo_entrega:
            warnings.append("Prazo de entrega não identificado")
        if not structured_data.condicoes_pagamento:
            warnings.append("Condições de pagamento não identificadas")
        
        return {
            "score": completeness_score,
            "missing_fields": missing_fields,
            "warnings": warnings
        }
    
    async def _assess_accuracy(self, structured_data: StructuredData) -> Dict[str, Any]:
        """Assess data accuracy using validation rules"""
        
        errors = []
        warnings = []
        checks_performed = 0
        accuracy_issues = 0
        
        # Validate UASG format
        if structured_data.uasg:
            checks_performed += 1
            if not structured_data.uasg.isdigit() or len(structured_data.uasg) != 6:
                errors.append(f"UASG inválido: {structured_data.uasg} (deve ter 6 dígitos)")
                accuracy_issues += 1
        
        # Validate estimated value
        if structured_data.valor_estimado:
            checks_performed += 1
            if structured_data.valor_estimado <= 0:
                errors.append(f"Valor estimado inválido: {structured_data.valor_estimado}")
                accuracy_issues += 1
            elif structured_data.valor_estimado > 100000000:  # > 100M
                warnings.append(f"Valor estimado muito alto: R$ {structured_data.valor_estimado:,.2f}")
        
        # Validate date format
        if structured_data.data_abertura:
            checks_performed += 1
            import re
            date_pattern = r'^\d{1,2}/\d{1,2}/\d{4}$'
            if not re.match(date_pattern, structured_data.data_abertura):
                warnings.append(f"Formato de data pode estar incorreto: {structured_data.data_abertura}")
        
        # Validate pregão number format
        if structured_data.numero_pregao:
            checks_performed += 1
            pregao_pattern = r'^\d+/\d{4}$'
            if not re.match(pregao_pattern, structured_data.numero_pregao):
                warnings.append(f"Formato do número do pregão pode estar incorreto: {structured_data.numero_pregao}")
        
        # Calculate accuracy score
        if checks_performed > 0:
            accuracy_score = (checks_performed - accuracy_issues) / checks_performed
        else:
            accuracy_score = 1.0  # No checks performed, assume perfect accuracy
        
        return {
            "score": accuracy_score,
            "errors": errors,
            "warnings": warnings,
            "checks_performed": checks_performed
        }
    
    async def _assess_consistency(self, structured_data: StructuredData,
                                tables: List[TableData]) -> Dict[str, Any]:
        """Assess internal consistency of extracted data"""
        
        errors = []
        warnings = []
        checks_performed = 0
        consistency_issues = 0
        
        # Check consistency between structured data and tables
        if structured_data.valor_estimado and tables:
            checks_performed += 1
            # Look for value inconsistencies in tables
            table_values = []
            for table in tables:
                if table.structured_data:
                    table_text = str(table.structured_data).lower()
                    if any(term in table_text for term in ['valor', 'preço', 'custo']):
                        # Table contains financial information
                        import re
                        value_matches = re.findall(r'(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)', str(table.structured_data))
                        for match in value_matches:
                            try:
                                value = float(match.replace('.', '').replace(',', '.'))
                                if value > 1000:  # Significant value
                                    table_values.append(value)
                            except ValueError:
                                continue
            
            if table_values:
                max_table_value = max(table_values)
                if abs(structured_data.valor_estimado - max_table_value) > structured_data.valor_estimado * 0.5:
                    warnings.append(f"Valor estimado ({structured_data.valor_estimado:,.2f}) difere significativamente dos valores encontrados nas tabelas")
        
        # Check object consistency
        if structured_data.objeto and tables:
            checks_performed += 1
            objeto_lower = structured_data.objeto.lower()
            
            # Check if tables contain items related to the object
            related_tables = 0
            for table in tables:
                if table.structured_data:
                    table_text = str(table.structured_data).lower()
                    objeto_words = set(objeto_lower.split())
                    table_words = set(table_text.split())
                    
                    # Check for word overlap
                    overlap = len(objeto_words.intersection(table_words))
                    if overlap > 0:
                        related_tables += 1
            
            if len(tables) > 0 and related_tables == 0:
                warnings.append("Tabelas podem não estar relacionadas ao objeto da licitação")
        
        # Check UASG and organization consistency
        if structured_data.uasg and structured_data.orgao:
            checks_performed += 1
            # This would typically involve checking against a UASG database
            # For now, just check if they both exist
            if len(structured_data.orgao.strip()) < 5:
                warnings.append("Nome do órgão parece muito curto para ser válido")
        
        # Calculate consistency score
        if checks_performed > 0:
            consistency_score = (checks_performed - consistency_issues) / checks_performed
        else:
            consistency_score = 1.0
        
        return {
            "score": consistency_score,
            "errors": errors,
            "warnings": warnings,
            "checks_performed": checks_performed
        }
    
    def _score_to_grade(self, score: float) -> str:
        """Convert numerical score to quality grade"""
        if score >= self.settings.quality_threshold_excellent:
            return "EXCELLENT"
        elif score >= self.settings.quality_threshold_good:
            return "GOOD"
        elif score >= self.settings.quality_threshold_fair:
            return "FAIR"
        else:
            return "POOR"
    
    async def _generate_quality_recommendations(self, final_score: float, quality_grade: str,
                                              validation_result: Dict[str, Any],
                                              risk_count: int, opportunity_count: int) -> List[str]:
        """Generate quality improvement recommendations"""
        
        recommendations = []
        
        # Score-based recommendations
        if final_score < 0.6:
            recommendations.append("Qualidade geral baixa - revisar processo de extração")
            recommendations.append("Verificar qualidade do documento original")
        elif final_score < 0.8:
            recommendations.append("Qualidade moderada - possível melhoria na extração de dados")
        
        # Completeness recommendations
        if validation_result["completeness_score"] < 0.7:
            recommendations.append("Baixa completude dos dados - verificar se informações estão disponíveis no documento")
            if validation_result["missing_fields"]:
                recommendations.append(f"Campos ausentes: {', '.join(validation_result['missing_fields'])}")
        
        # Accuracy recommendations
        if validation_result["accuracy_score"] < 0.8:
            recommendations.append("Problemas de precisão identificados - revisar dados extraídos")
            if validation_result["errors"]:
                recommendations.append("Corrigir erros de validação identificados")
        
        # Risk-based recommendations
        if risk_count > 10:
            recommendations.append("Alto número de riscos identificados - análise detalhada recomendada")
        elif risk_count == 0:
            recommendations.append("Nenhum risco identificado - verificar se análise está completa")
        
        # Opportunity-based recommendations
        if opportunity_count == 0:
            recommendations.append("Nenhuma oportunidade identificada - verificar potencial do documento")
        elif opportunity_count > 5:
            recommendations.append("Múltiplas oportunidades identificadas - priorizar por valor e probabilidade")
        
        # Table-specific recommendations
        if len(validation_result.get("errors", [])) == 0 and len(validation_result.get("warnings", [])) == 0:
            recommendations.append("Processamento executado sem erros ou alertas")
        
        return recommendations