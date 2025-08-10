"""
Opportunity analysis component for document processing
Identifies business opportunities using advanced analysis
"""

import logging
import re
import uuid
from typing import Dict, List, Any

from ..config.settings import Settings
from ..models.extraction_models import OpportunityItem, StructuredData, TableData
from ..utils.logger import setup_logger

logger = setup_logger(__name__)


class OpportunityAnalyzer:
    """Business opportunity identification and analysis for procurement documents"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        
        # Opportunity indicators and patterns
        self.opportunity_patterns = {
            "high_volume": {
                "keywords": [
                    "grande quantidade", "alto volume", "lote único", "fornecimento contínuo",
                    "demanda recorrente", "renovação automática", "múltiplas unidades"
                ],
                "patterns": [
                    r"quantidade[:\s]*(\d{1,3}(?:\.\d{3})*|\d+)",
                    r"(\d{1,3}(?:\.\d{3})*|\d+)\s+unidades?",
                    r"lote\s+de\s+(\d{1,3}(?:\.\d{3})*|\d+)",
                ]
            },
            "high_value": {
                "keywords": [
                    "alto valor", "grande investimento", "orçamento significativo",
                    "contrato de grande porte", "valor elevado"
                ],
                "patterns": [
                    r"r?\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)",
                    r"(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*reais?",
                    r"valor.*?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)"
                ]
            },
            "recurring": {
                "keywords": [
                    "renovação", "prorrogação", "fornecimento continuado", "contrato plurianual",
                    "demanda permanente", "necessidade contínua", "suprimento regular"
                ],
                "patterns": [
                    r"renovação\s+por\s+(\d+)",
                    r"prazo\s+de\s+(\d+)\s+anos?",
                    r"vigência\s+de\s+(\d+)\s+anos?"
                ]
            },
            "strategic": {
                "keywords": [
                    "estratégico", "prioritário", "essencial", "crítico", "fundamental",
                    "modernização", "inovação", "tecnologia avançada", "diferencial competitivo"
                ],
                "patterns": [
                    r"projeto\s+estratégico",
                    r"iniciativa\s+prioritária",
                    r"modernização\s+tecnológica"
                ]
            }
        }
        
        # Value thresholds for opportunity classification
        self.value_thresholds = {
            "high": 1000000,    # R$ 1M+
            "medium": 100000,   # R$ 100K+
            "low": 10000        # R$ 10K+
        }
    
    async def initialize(self):
        """Initialize opportunity analyzer"""
        logger.info("Initializing opportunity analyzer")
        
    async def identify_opportunities(self, content: str, structured_data: StructuredData,
                                   tables: List[TableData]) -> List[OpportunityItem]:
        """
        Stage 6: Opportunity Identification
        Identify and analyze business opportunities in the procurement document
        """
        logger.info("Starting opportunity identification")
        
        opportunities = []
        content_lower = content.lower()
        
        # Analyze high-volume opportunities
        volume_opportunities = await self._analyze_volume_opportunities(content, content_lower, tables)
        opportunities.extend(volume_opportunities)
        
        # Analyze high-value opportunities
        value_opportunities = await self._analyze_value_opportunities(content, content_lower, structured_data)
        opportunities.extend(value_opportunities)
        
        # Analyze recurring opportunities
        recurring_opportunities = await self._analyze_recurring_opportunities(content, content_lower, structured_data)
        opportunities.extend(recurring_opportunities)
        
        # Analyze strategic opportunities
        strategic_opportunities = await self._analyze_strategic_opportunities(content, content_lower, structured_data)
        opportunities.extend(strategic_opportunities)
        
        # Analyze market opportunities
        market_opportunities = await self._analyze_market_opportunities(content, structured_data)
        opportunities.extend(market_opportunities)
        
        # Analyze technical opportunities
        technical_opportunities = await self._analyze_technical_opportunities(content, content_lower)
        opportunities.extend(technical_opportunities)
        
        # Sort opportunities by potential value and likelihood
        opportunities.sort(key=lambda x: (x.potential_value or 0) * x.likelihood, reverse=True)
        
        logger.info(f"Opportunity identification completed. Found {len(opportunities)} opportunities")
        return opportunities
    
    async def _analyze_volume_opportunities(self, content: str, content_lower: str,
                                          tables: List[TableData]) -> List[OpportunityItem]:
        """Analyze high-volume opportunities"""
        opportunities = []
        
        # Extract quantities from content
        quantity_patterns = [
            r"quantidade[:\s]*(\d{1,3}(?:\.\d{3})*|\d+)",
            r"(\d{1,3}(?:\.\d{3})*|\d+)\s+unidades?",
            r"(\d{1,3}(?:\.\d{3})*|\d+)\s+itens?",
            r"lote\s+de\s+(\d{1,3}(?:\.\d{3})*|\d+)"
        ]
        
        max_quantity = 0
        for pattern in quantity_patterns:
            matches = re.findall(pattern, content_lower)
            for match in matches:
                try:
                    quantity = int(match.replace('.', ''))
                    max_quantity = max(max_quantity, quantity)
                except ValueError:
                    continue
        
        if max_quantity > 1000:  # High volume threshold
            opportunity = OpportunityItem(
                opportunity_id=str(uuid.uuid4()),
                description=f"Oportunidade de alto volume identificada (até {max_quantity:,} unidades)",
                opportunity_type="high_volume",
                likelihood=0.8,
                strategic_importance="high" if max_quantity > 10000 else "medium",
                recommended_actions=[
                    "Avaliar capacidade produtiva para grandes volumes",
                    "Negociar preços escalonados por quantidade",
                    "Considerar parcerias para atendimento do volume",
                    "Verificar prazos de entrega para grandes lotes"
                ]
            )
            opportunities.append(opportunity)
        
        # Analyze tables for volume indicators
        for table in tables:
            if table.structured_data:
                # Look for quantity columns in tables
                table_text = str(table.structured_data).lower()
                if any(term in table_text for term in ['quantidade', 'qtd', 'unidades']):
                    opportunity = OpportunityItem(
                        opportunity_id=str(uuid.uuid4()),
                        description="Tabela com especificação de quantidades detectada",
                        opportunity_type="high_volume",
                        likelihood=0.7,
                        strategic_importance="medium",
                        recommended_actions=[
                            "Analisar detalhadamente as quantidades especificadas",
                            "Verificar possibilidade de fornecimento total ou parcial",
                            "Avaliar capacidade de atendimento por lotes"
                        ]
                    )
                    opportunities.append(opportunity)
                    break  # Only add one opportunity per table type
        
        return opportunities
    
    async def _analyze_value_opportunities(self, content: str, content_lower: str,
                                         structured_data: StructuredData) -> List[OpportunityItem]:
        """Analyze high-value opportunities"""
        opportunities = []
        
        # Use structured data value if available
        estimated_value = structured_data.valor_estimado
        
        if not estimated_value:
            # Try to extract value from content
            value_patterns = [
                r"r?\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)",
                r"(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*reais?",
                r"valor.*?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)"
            ]
            
            max_value = 0
            for pattern in value_patterns:
                matches = re.findall(pattern, content_lower)
                for match in matches:
                    try:
                        value_str = match.replace('.', '').replace(',', '.')
                        value = float(value_str)
                        max_value = max(max_value, value)
                    except ValueError:
                        continue
            
            estimated_value = max_value
        
        if estimated_value and estimated_value >= self.value_thresholds["high"]:
            opportunity = OpportunityItem(
                opportunity_id=str(uuid.uuid4()),
                description=f"Oportunidade de alto valor identificada (R$ {estimated_value:,.2f})",
                opportunity_type="high_value",
                potential_value=estimated_value,
                likelihood=0.9,
                strategic_importance="high",
                recommended_actions=[
                    "Priorizar participação no processo licitatório",
                    "Formar equipe dedicada para a proposta",
                    "Realizar análise detalhada de viabilidade",
                    "Considerar parcerias estratégicas se necessário"
                ]
            )
            opportunities.append(opportunity)
        elif estimated_value and estimated_value >= self.value_thresholds["medium"]:
            opportunity = OpportunityItem(
                opportunity_id=str(uuid.uuid4()),
                description=f"Oportunidade de valor médio identificada (R$ {estimated_value:,.2f})",
                opportunity_type="high_value",
                potential_value=estimated_value,
                likelihood=0.8,
                strategic_importance="medium",
                recommended_actions=[
                    "Avaliar margem de contribuição esperada",
                    "Verificar competitividade da proposta",
                    "Analisar custos de participação no certame"
                ]
            )
            opportunities.append(opportunity)
        
        return opportunities
    
    async def _analyze_recurring_opportunities(self, content: str, content_lower: str,
                                             structured_data: StructuredData) -> List[OpportunityItem]:
        """Analyze recurring business opportunities"""
        opportunities = []
        
        # Keywords indicating recurring business
        recurring_keywords = [
            "renovação", "prorrogação", "fornecimento continuado", "contrato plurianual",
            "demanda permanente", "necessidade contínua", "suprimento regular", "ata de registro"
        ]
        
        if self._contains_keywords(content_lower, recurring_keywords):
            # Extract contract duration
            duration_patterns = [
                r"renovação\s+por\s+(\d+)",
                r"prazo\s+de\s+(\d+)\s+anos?",
                r"vigência\s+de\s+(\d+)\s+anos?",
                r"período\s+de\s+(\d+)\s+anos?"
            ]
            
            max_duration = 1  # Default 1 year
            for pattern in duration_patterns:
                matches = re.findall(pattern, content_lower)
                for match in matches:
                    try:
                        duration = int(match)
                        max_duration = max(max_duration, duration)
                    except ValueError:
                        continue
            
            opportunity = OpportunityItem(
                opportunity_id=str(uuid.uuid4()),
                description=f"Oportunidade de negócio recorrente identificada (vigência até {max_duration} anos)",
                opportunity_type="recurring",
                likelihood=0.7,
                strategic_importance="high" if max_duration > 2 else "medium",
                recommended_actions=[
                    "Avaliar capacidade de fornecimento de longo prazo",
                    "Considerar investimentos em capacidade produtiva",
                    "Planejar relacionamento de longo prazo com cliente",
                    "Verificar cláusulas de reajuste de preços"
                ]
            )
            opportunities.append(opportunity)
        
        # Check for framework agreement indicators
        framework_keywords = ["ata de registro de preços", "acordo quadro", "contrato guarda-chuva"]
        if self._contains_keywords(content_lower, framework_keywords):
            opportunity = OpportunityItem(
                opportunity_id=str(uuid.uuid4()),
                description="Oportunidade de participação em ata de registro de preços",
                opportunity_type="recurring",
                likelihood=0.8,
                strategic_importance="high",
                recommended_actions=[
                    "Verificar estimativa de demanda por período",
                    "Analisar histórico de consumo do órgão",
                    "Preparar estrutura para atendimento sob demanda",
                    "Considerar preços competitivos para todo o período"
                ]
            )
            opportunities.append(opportunity)
        
        return opportunities
    
    async def _analyze_strategic_opportunities(self, content: str, content_lower: str,
                                             structured_data: StructuredData) -> List[OpportunityItem]:
        """Analyze strategic business opportunities"""
        opportunities = []
        
        # Strategic keywords
        strategic_keywords = [
            "estratégico", "prioritário", "essencial", "crítico", "fundamental",
            "modernização", "inovação", "tecnologia avançada", "diferencial competitivo",
            "projeto especial", "iniciativa prioritária"
        ]
        
        if self._contains_keywords(content_lower, strategic_keywords):
            opportunity = OpportunityItem(
                opportunity_id=str(uuid.uuid4()),
                description="Oportunidade estratégica identificada - projeto prioritário do órgão",
                opportunity_type="strategic",
                likelihood=0.6,
                strategic_importance="high",
                recommended_actions=[
                    "Identificar decisores e influenciadores chave",
                    "Demonstrar alinhamento com objetivos estratégicos",
                    "Destacar diferenciais competitivos",
                    "Preparar proposta técnica robusta"
                ]
            )
            opportunities.append(opportunity)
        
        # Check for innovation/modernization opportunities
        innovation_keywords = [
            "inovação", "modernização", "digitalização", "transformação digital",
            "tecnologia de ponta", "solução inovadora", "estado da arte"
        ]
        
        if self._contains_keywords(content_lower, innovation_keywords):
            opportunity = OpportunityItem(
                opportunity_id=str(uuid.uuid4()),
                description="Oportunidade de inovação tecnológica identificada",
                opportunity_type="strategic",
                likelihood=0.5,
                strategic_importance="high",
                recommended_actions=[
                    "Destacar aspectos inovadores da solução",
                    "Demonstrar benefícios de longo prazo",
                    "Apresentar casos de sucesso similares",
                    "Oferecer suporte técnico especializado"
                ]
            )
            opportunities.append(opportunity)
        
        return opportunities
    
    async def _analyze_market_opportunities(self, content: str,
                                          structured_data: StructuredData) -> List[OpportunityItem]:
        """Analyze market-specific opportunities"""
        opportunities = []
        
        # Identify the organ/entity
        orgao = structured_data.orgao
        if orgao:
            orgao_lower = orgao.lower()
            
            # Government sectors with specific opportunities
            sector_opportunities = {
                "saúde": {
                    "description": "Oportunidade no setor de saúde pública",
                    "importance": "high",
                    "actions": [
                        "Verificar conformidade com regulamentações sanitárias",
                        "Destacar benefícios para saúde pública",
                        "Demonstrar experiência no setor de saúde"
                    ]
                },
                "educação": {
                    "description": "Oportunidade no setor educacional",
                    "importance": "medium",
                    "actions": [
                        "Alinhar proposta com políticas educacionais",
                        "Destacar impacto na qualidade do ensino",
                        "Demonstrar adequação ao ambiente escolar"
                    ]
                },
                "segurança": {
                    "description": "Oportunidade no setor de segurança pública",
                    "importance": "high",
                    "actions": [
                        "Evidenciar conformidade com normas de segurança",
                        "Destacar contribuição para segurança pública",
                        "Demonstrar confiabilidade e robustez"
                    ]
                }
            }
            
            for sector, info in sector_opportunities.items():
                if sector in orgao_lower:
                    opportunity = OpportunityItem(
                        opportunity_id=str(uuid.uuid4()),
                        description=info["description"],
                        opportunity_type="strategic",
                        likelihood=0.7,
                        strategic_importance=info["importance"],
                        recommended_actions=info["actions"]
                    )
                    opportunities.append(opportunity)
                    break
        
        return opportunities
    
    async def _analyze_technical_opportunities(self, content: str, content_lower: str) -> List[OpportunityItem]:
        """Analyze technical opportunities"""
        opportunities = []
        
        # Advanced technology indicators
        tech_keywords = [
            "inteligência artificial", "machine learning", "iot", "internet das coisas",
            "big data", "analytics", "cloud", "nuvem", "blockchain", "automação",
            "robotização", "indústria 4.0", "digital twin"
        ]
        
        if self._contains_keywords(content_lower, tech_keywords):
            opportunity = OpportunityItem(
                opportunity_id=str(uuid.uuid4()),
                description="Oportunidade de fornecimento de tecnologia avançada",
                opportunity_type="strategic",
                likelihood=0.6,
                strategic_importance="high",
                recommended_actions=[
                    "Destacar expertise tecnológica da empresa",
                    "Demonstrar ROI da tecnologia proposta",
                    "Oferecer treinamento e suporte técnico",
                    "Apresentar roadmap de evolução tecnológica"
                ]
            )
            opportunities.append(opportunity)
        
        # Sustainability opportunities
        sustainability_keywords = [
            "sustentabilidade", "sustentável", "verde", "eco", "ambiental",
            "carbono neutro", "energia renovável", "eficiência energética",
            "economia circular", "responsabilidade social"
        ]
        
        if self._contains_keywords(content_lower, sustainability_keywords):
            opportunity = OpportunityItem(
                opportunity_id=str(uuid.uuid4()),
                description="Oportunidade relacionada à sustentabilidade",
                opportunity_type="strategic",
                likelihood=0.7,
                strategic_importance="medium",
                recommended_actions=[
                    "Destacar credenciais de sustentabilidade",
                    "Demonstrar impacto ambiental positivo",
                    "Apresentar certificações ambientais",
                    "Quantificar benefícios sustentáveis"
                ]
            )
            opportunities.append(opportunity)
        
        return opportunities
    
    def _contains_keywords(self, text: str, keywords: List[str]) -> bool:
        """Check if text contains any of the specified keywords"""
        return any(keyword in text for keyword in keywords)