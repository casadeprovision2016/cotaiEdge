"""
Risk analysis component for document processing
Identifies procurement risks using rule-based and ML approaches
"""

import logging
import re
import uuid
from typing import Dict, List, Any

from ..config.settings import Settings
from ..models.extraction_models import RiskItem, StructuredData
from ..utils.logger import setup_logger

logger = setup_logger(__name__)


class RiskAnalyzer:
    """Risk identification and analysis for procurement documents"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        
        # Risk patterns and keywords
        self.risk_patterns = {
            "technical": {
                "keywords": [
                    "especificação restritiva", "marca específica", "modelo único",
                    "tecnologia proprietária", "certificação específica", "norma restritiva",
                    "compatibilidade", "integração", "customização", "desenvolvimento"
                ],
                "patterns": [
                    r"apenas\s+da\s+marca",
                    r"somente\s+(o\s+)?modelo",
                    r"exclusivamente\s+certificado",
                    r"única\s+solução",
                    r"não\s+aceita\s+similar"
                ]
            },
            "legal": {
                "keywords": [
                    "cláusula abusiva", "responsabilidade exclusiva", "penalidade excessiva",
                    "rescisão unilateral", "alteração contratual", "interpretação restritiva",
                    "foro específico", "legislação específica", "conformidade regulatória"
                ],
                "patterns": [
                    r"multa\s+de\s+\d+%",
                    r"penalidade\s+de\s+até\s+\d+%",
                    r"rescisão\s+imediata",
                    r"responsabilidade\s+integral",
                    r"indenização\s+total"
                ]
            },
            "commercial": {
                "keywords": [
                    "preço elevado", "margem baixa", "concorrência limitada", "fornecedor único",
                    "prazo apertado", "condições rígidas", "garantia extensa", "pagamento restrito",
                    "reajuste bloqueado", "desconto mínimo"
                ],
                "patterns": [
                    r"valor\s+acima\s+do\s+mercado",
                    r"preço\s+superior",
                    r"único\s+fornecedor",
                    r"exclusividade",
                    r"pagamento\s+à\s+vista"
                ]
            },
            "logistic": {
                "keywords": [
                    "prazo insuficiente", "local específico", "transporte complexo",
                    "armazenamento especial", "instalação complexa", "logística reversa",
                    "entrega parcelada", "cronograma apertado"
                ],
                "patterns": [
                    r"entrega\s+em\s+\d+\s+dias",
                    r"prazo\s+de\s+\d+\s+(dia|semana)s?",
                    r"instalação\s+imediata",
                    r"transporte\s+especializado",
                    r"armazenamento\s+controlado"
                ]
            }
        }
    
    async def initialize(self):
        """Initialize risk analyzer"""
        logger.info("Initializing risk analyzer")
        
    async def analyze_risks(self, content: str, structured_data: StructuredData) -> List[RiskItem]:
        """
        Stage 5: Risk Analysis
        Identify and analyze risks in the procurement document
        """
        logger.info("Starting risk analysis")
        
        risks = []
        content_lower = content.lower()
        
        # Analyze technical risks
        technical_risks = await self._analyze_technical_risks(content, content_lower)
        risks.extend(technical_risks)
        
        # Analyze legal risks
        legal_risks = await self._analyze_legal_risks(content, content_lower)
        risks.extend(legal_risks)
        
        # Analyze commercial risks
        commercial_risks = await self._analyze_commercial_risks(content, content_lower, structured_data)
        risks.extend(commercial_risks)
        
        # Analyze logistic risks
        logistic_risks = await self._analyze_logistic_risks(content, content_lower, structured_data)
        risks.extend(logistic_risks)
        
        # Analyze value-based risks
        value_risks = await self._analyze_value_risks(structured_data)
        risks.extend(value_risks)
        
        # Sort risks by criticality score
        risks.sort(key=lambda x: x.criticality_score, reverse=True)
        
        logger.info(f"Risk analysis completed. Found {len(risks)} risks")
        return risks
    
    async def _analyze_technical_risks(self, content: str, content_lower: str) -> List[RiskItem]:
        """Analyze technical risks in the document"""
        risks = []
        
        # Check for restrictive specifications
        if self._contains_keywords(content_lower, self.risk_patterns["technical"]["keywords"]):
            risk = RiskItem(
                risk_id=str(uuid.uuid4()),
                description="Especificações técnicas podem ser restritivas à concorrência",
                risk_type="technical",
                probability=0.7,
                impact=0.8,
                criticality_score=0.56,
                mitigation_suggestions=[
                    "Revisar especificações para aceitar produtos similares",
                    "Permitir equivalência técnica comprovada",
                    "Ampliar critérios de aceitação"
                ]
            )
            risks.append(risk)
        
        # Check for brand-specific requirements
        brand_patterns = [
            r"marca\s+[A-Z][a-z]+",
            r"fabricante\s+[A-Z][a-z]+",
            r"modelo\s+[A-Z0-9\-]+"
        ]
        
        for pattern in brand_patterns:
            matches = re.findall(pattern, content)
            if len(matches) > 3:  # Multiple brand specifications
                risk = RiskItem(
                    risk_id=str(uuid.uuid4()),
                    description="Especificação de marcas/modelos específicos pode restringir competitividade",
                    risk_type="technical",
                    probability=0.8,
                    impact=0.7,
                    criticality_score=0.56,
                    mitigation_suggestions=[
                        "Substituir marcas por especificações técnicas",
                        "Incluir cláusula 'ou similar'",
                        "Definir critérios objetivos de equivalência"
                    ]
                )
                risks.append(risk)
                break
        
        # Check for complex integration requirements
        if any(term in content_lower for term in ["integração", "compatibilidade", "customização"]):
            risk = RiskItem(
                risk_id=str(uuid.uuid4()),
                description="Requisitos de integração podem aumentar complexidade e custos",
                risk_type="technical",
                probability=0.6,
                impact=0.7,
                criticality_score=0.42,
                mitigation_suggestions=[
                    "Definir claramente interfaces e padrões",
                    "Prever testes de integração",
                    "Estabelecer responsabilidades técnicas"
                ]
            )
            risks.append(risk)
        
        return risks
    
    async def _analyze_legal_risks(self, content: str, content_lower: str) -> List[RiskItem]:
        """Analyze legal and compliance risks"""
        risks = []
        
        # Check for excessive penalties
        penalty_matches = re.findall(r"multa\s+de\s+(\d+(?:,\d+)?)\s*%", content_lower)
        if penalty_matches:
            max_penalty = max(float(p.replace(',', '.')) for p in penalty_matches)
            if max_penalty > 20:  # More than 20%
                risk = RiskItem(
                    risk_id=str(uuid.uuid4()),
                    description=f"Penalidades elevadas identificadas (até {max_penalty}%)",
                    risk_type="legal",
                    probability=0.5,
                    impact=0.9,
                    criticality_score=0.45,
                    mitigation_suggestions=[
                        "Revisar valores das penalidades",
                        "Estabelecer penalidades proporcionais",
                        "Incluir critérios de atenuação"
                    ]
                )
                risks.append(risk)
        
        # Check for strict liability clauses
        liability_terms = [
            "responsabilidade integral", "responsabilidade total", "responsabilidade exclusiva",
            "indenização total", "ressarcimento integral"
        ]
        
        if self._contains_keywords(content_lower, liability_terms):
            risk = RiskItem(
                risk_id=str(uuid.uuid4()),
                description="Cláusulas de responsabilidade muito restritivas para o fornecedor",
                risk_type="legal",
                probability=0.7,
                impact=0.8,
                criticality_score=0.56,
                mitigation_suggestions=[
                    "Revisar cláusulas de responsabilidade",
                    "Estabelecer limites de responsabilidade",
                    "Definir excludentes de responsabilidade"
                ]
            )
            risks.append(risk)
        
        # Check for specific forum clauses
        if re.search(r"foro\s+da\s+comarca", content_lower):
            risk = RiskItem(
                risk_id=str(uuid.uuid4()),
                description="Foro específico pode dificultar defesa judicial",
                risk_type="legal",
                probability=0.4,
                impact=0.6,
                criticality_score=0.24,
                mitigation_suggestions=[
                    "Verificar viabilidade do foro escolhido",
                    "Avaliar custos de eventual litígio",
                    "Considerar cláusula de arbitragem"
                ]
            )
            risks.append(risk)
        
        # Check for compliance requirements
        compliance_terms = [
            "certificação obrigatória", "registro obrigatório", "licença específica",
            "conformidade regulatória", "norma específica"
        ]
        
        if self._contains_keywords(content_lower, compliance_terms):
            risk = RiskItem(
                risk_id=str(uuid.uuid4()),
                description="Requisitos regulatórios específicos podem limitar fornecedores",
                risk_type="legal",
                probability=0.6,
                impact=0.7,
                criticality_score=0.42,
                mitigation_suggestions=[
                    "Verificar disponibilidade de certificações",
                    "Prever prazo para adequação regulatória",
                    "Aceitar certificações equivalentes"
                ]
            )
            risks.append(risk)
        
        return risks
    
    async def _analyze_commercial_risks(self, content: str, content_lower: str, 
                                      structured_data: StructuredData) -> List[RiskItem]:
        """Analyze commercial and financial risks"""
        risks = []
        
        # Check payment conditions
        payment_terms = structured_data.condicoes_pagamento
        if payment_terms and "à vista" in payment_terms.lower():
            risk = RiskItem(
                risk_id=str(uuid.uuid4()),
                description="Pagamento à vista pode limitar participação de fornecedores",
                risk_type="commercial",
                probability=0.6,
                impact=0.7,
                criticality_score=0.42,
                mitigation_suggestions=[
                    "Considerar parcelamento do pagamento",
                    "Avaliar impacto no preço final",
                    "Verificar capacidade financeira dos fornecedores"
                ]
            )
            risks.append(risk)
        
        # Check for single supplier indicators
        single_supplier_terms = [
            "único fornecedor", "exclusividade", "fornecedor exclusivo",
            "representante exclusivo", "distribuidor autorizado"
        ]
        
        if self._contains_keywords(content_lower, single_supplier_terms):
            risk = RiskItem(
                risk_id=str(uuid.uuid4()),
                description="Indicadores de fornecedor único ou exclusividade",
                risk_type="commercial",
                probability=0.8,
                impact=0.9,
                criticality_score=0.72,
                mitigation_suggestions=[
                    "Pesquisar mercado para identificar alternativas",
                    "Verificar justificativa para exclusividade",
                    "Considerar contratação por lotes"
                ]
            )
            risks.append(risk)
        
        # Check estimated value vs market
        if structured_data.valor_estimado and structured_data.valor_estimado > 1000000:  # > 1M
            risk = RiskItem(
                risk_id=str(uuid.uuid4()),
                description="Valor elevado requer atenção especial na análise de mercado",
                risk_type="commercial",
                probability=0.5,
                impact=0.8,
                criticality_score=0.40,
                mitigation_suggestions=[
                    "Realizar pesquisa ampla de preços",
                    "Considerar parcelamento da contratação",
                    "Avaliar viabilidade orçamentária"
                ]
            )
            risks.append(risk)
        
        # Check warranty requirements
        if "garantia" in content_lower:
            warranty_matches = re.findall(r"garantia\s+de\s+(\d+)\s+(ano|mês)", content_lower)
            if warranty_matches:
                for match in warranty_matches:
                    period = int(match[0])
                    unit = match[1]
                    months = period * 12 if unit == "ano" else period
                    
                    if months > 24:  # More than 2 years
                        risk = RiskItem(
                            risk_id=str(uuid.uuid4()),
                            description=f"Período de garantia extenso ({period} {unit}s) pode impactar custos",
                            risk_type="commercial",
                            probability=0.6,
                            impact=0.6,
                            criticality_score=0.36,
                            mitigation_suggestions=[
                                "Avaliar custo da garantia estendida",
                                "Verificar padrões do mercado",
                                "Considerar garantia escalonada"
                            ]
                        )
                        risks.append(risk)
                        break
        
        return risks
    
    async def _analyze_logistic_risks(self, content: str, content_lower: str,
                                    structured_data: StructuredData) -> List[RiskItem]:
        """Analyze logistic and delivery risks"""
        risks = []
        
        # Check delivery deadlines
        if structured_data.prazo_entrega:
            prazo_lower = structured_data.prazo_entrega.lower()
            
            # Extract days from deadline
            day_matches = re.findall(r"(\d+)\s+dias?", prazo_lower)
            if day_matches:
                days = int(day_matches[0])
                if days <= 15:  # Very short deadline
                    risk = RiskItem(
                        risk_id=str(uuid.uuid4()),
                        description=f"Prazo de entrega muito curto ({days} dias)",
                        risk_type="logistic",
                        probability=0.8,
                        impact=0.7,
                        criticality_score=0.56,
                        mitigation_suggestions=[
                            "Verificar viabilidade do prazo com fornecedores",
                            "Considerar entregas parciais",
                            "Avaliar estoque disponível no mercado"
                        ]
                    )
                    risks.append(risk)
        
        # Check delivery location
        if structured_data.local_entrega:
            local_lower = structured_data.local_entrega.lower()
            
            # Check for remote or difficult locations
            remote_indicators = [
                "interior", "zona rural", "área remota", "difícil acesso",
                "região isolada", "localidade distante"
            ]
            
            if self._contains_keywords(local_lower, remote_indicators):
                risk = RiskItem(
                    risk_id=str(uuid.uuid4()),
                    description="Local de entrega em área remota pode encarecer logística",
                    risk_type="logistic",
                    probability=0.7,
                    impact=0.6,
                    criticality_score=0.42,
                    mitigation_suggestions=[
                        "Prever custos adicionais de transporte",
                        "Verificar disponibilidade de transportadoras",
                        "Considerar pontos de entrega alternativos"
                    ]
                )
                risks.append(risk)
        
        # Check for special handling requirements
        special_handling = [
            "refrigerado", "congelado", "temperatura controlada", "frágil",
            "perigoso", "controlado", "esterilizado", "asséptico"
        ]
        
        if self._contains_keywords(content_lower, special_handling):
            risk = RiskItem(
                risk_id=str(uuid.uuid4()),
                description="Produtos requerem manuseio/transporte especial",
                risk_type="logistic",
                probability=0.6,
                impact=0.7,
                criticality_score=0.42,
                mitigation_suggestions=[
                    "Verificar capacidade logística especializada",
                    "Prever custos adicionais de transporte",
                    "Estabelecer controles de qualidade"
                ]
            )
            risks.append(risk)
        
        # Check installation requirements
        if any(term in content_lower for term in ["instalação", "montagem", "configuração"]):
            risk = RiskItem(
                risk_id=str(uuid.uuid4()),
                description="Produtos requerem instalação/configuração especializada",
                risk_type="logistic",
                probability=0.5,
                impact=0.6,
                criticality_score=0.30,
                mitigation_suggestions=[
                    "Definir responsabilidades de instalação",
                    "Prever treinamento da equipe",
                    "Estabelecer critérios de aceite"
                ]
            )
            risks.append(risk)
        
        return risks
    
    async def _analyze_value_risks(self, structured_data: StructuredData) -> List[RiskItem]:
        """Analyze risks related to estimated values"""
        risks = []
        
        if not structured_data.valor_estimado:
            risk = RiskItem(
                risk_id=str(uuid.uuid4()),
                description="Valor estimado não identificado no documento",
                risk_type="commercial",
                probability=0.9,
                impact=0.8,
                criticality_score=0.72,
                mitigation_suggestions=[
                    "Localizar informações de orçamento",
                    "Solicitar esclarecimentos sobre valores",
                    "Realizar pesquisa de mercado independente"
                ]
            )
            risks.append(risk)
        
        return risks
    
    def _contains_keywords(self, text: str, keywords: List[str]) -> bool:
        """Check if text contains any of the specified keywords"""
        return any(keyword in text for keyword in keywords)