"""
LLM-based content analysis for document processing
Implements stages 4-6 AI analysis components
"""

import asyncio
import json
import logging
import re
from typing import Dict, List, Any, Optional

from ..config.settings import Settings
from ..models.extraction_models import StructuredData, TableData
from ..utils.logger import setup_logger

logger = setup_logger(__name__)


class LLMAnalyzer:
    """LLM-based document content analyzer for classification and structuring"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        # In a production environment, this would initialize actual LLM clients
        # For now, we'll implement rule-based analysis with ML-like outputs
        
    async def initialize(self):
        """Initialize LLM analyzer"""
        logger.info("Initializing LLM analyzer")
        # Initialize any required models or connections
        
    async def classify_content(self, markdown_content: str, tables: List[TableData]) -> Dict[str, Any]:
        """
        Stage 4: Content Classification
        Analyzes and classifies document content using LLM techniques
        """
        logger.info("Starting content classification analysis")
        
        try:
            # Extract structured data using pattern matching and heuristics
            structured_data = await self._extract_structured_data(markdown_content)
            
            # Classify document type
            document_type = await self._classify_document_type(markdown_content)
            
            # Classify tables
            classified_tables = []
            for table in tables:
                table_classification = await self._classify_table(table)
                classified_tables.append(table_classification)
            
            return {
                "structured_data": structured_data,
                "document_type": document_type,
                "classified_tables": classified_tables,
                "content_analysis": {
                    "complexity_score": await self._calculate_complexity_score(markdown_content),
                    "key_sections": await self._identify_key_sections(markdown_content),
                    "language_quality": await self._assess_language_quality(markdown_content)
                }
            }
            
        except Exception as e:
            logger.error(f"Content classification failed: {str(e)}")
            raise
    
    async def _extract_structured_data(self, content: str) -> StructuredData:
        """Extract structured information from document content"""
        
        # Initialize structured data
        data = StructuredData()
        
        # Extract pregão number
        pregao_match = re.search(r'pregão.*?(\d{4}/\d{4}|\d+/\d{4})', content, re.IGNORECASE)
        if pregao_match:
            data.numero_pregao = pregao_match.group(1)
        
        # Extract UASG
        uasg_match = re.search(r'uasg.*?(\d{6})', content, re.IGNORECASE)
        if uasg_match:
            data.uasg = uasg_match.group(1)
        
        # Extract organization
        orgao_patterns = [
            r'órgão[:\-\s]+([^\n\r]+)',
            r'entidade[:\-\s]+([^\n\r]+)',
            r'unidade[:\-\s]+([^\n\r]+)'
        ]
        for pattern in orgao_patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                data.orgao = match.group(1).strip()
                break
        
        # Extract object/description
        objeto_patterns = [
            r'objeto[:\-\s]+([^\n\r]+)',
            r'descrição[:\-\s]+([^\n\r]+)',
            r'finalidade[:\-\s]+([^\n\r]+)'
        ]
        for pattern in objeto_patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                data.objeto = match.group(1).strip()
                break
        
        # Extract estimated value
        value_patterns = [
            r'valor\s+estimado[:\-\s]+r?\$?\s*([\d.,]+)',
            r'orçamento[:\-\s]+r?\$?\s*([\d.,]+)',
            r'preço\s+máximo[:\-\s]+r?\$?\s*([\d.,]+)'
        ]
        for pattern in value_patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                value_str = match.group(1).replace(',', '').replace('.', '')
                try:
                    # Convert to float (assuming last 2 digits are cents)
                    if len(value_str) > 2:
                        data.valor_estimado = float(value_str[:-2] + '.' + value_str[-2:])
                    else:
                        data.valor_estimado = float(value_str)
                except ValueError:
                    pass
                break
        
        # Extract opening date
        date_patterns = [
            r'data\s+de\s+abertura[:\-\s]+(\d{1,2}/\d{1,2}/\d{4})',
            r'abertura[:\-\s]+(\d{1,2}/\d{1,2}/\d{4})',
            r'data[:\-\s]+(\d{1,2}/\d{1,2}/\d{4})'
        ]
        for pattern in date_patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                data.data_abertura = match.group(1)
                break
        
        # Extract modality
        modalidade_patterns = [
            r'modalidade[:\-\s]+([^\n\r]+)',
            r'tipo\s+de\s+licitação[:\-\s]+([^\n\r]+)'
        ]
        for pattern in modalidade_patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                data.modalidade = match.group(1).strip()
                break
        
        # Extract delivery location
        local_patterns = [
            r'local\s+de\s+entrega[:\-\s]+([^\n\r]+)',
            r'entrega[:\-\s]+([^\n\r]+)',
            r'destino[:\-\s]+([^\n\r]+)'
        ]
        for pattern in local_patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                data.local_entrega = match.group(1).strip()
                break
        
        # Extract delivery deadline
        prazo_patterns = [
            r'prazo\s+de\s+entrega[:\-\s]+([^\n\r]+)',
            r'prazo[:\-\s]+([^\n\r]+)',
            r'tempo\s+de\s+entrega[:\-\s]+([^\n\r]+)'
        ]
        for pattern in prazo_patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                data.prazo_entrega = match.group(1).strip()
                break
        
        # Extract payment conditions
        pagamento_patterns = [
            r'condições\s+de\s+pagamento[:\-\s]+([^\n\r]+)',
            r'pagamento[:\-\s]+([^\n\r]+)',
            r'forma\s+de\s+pagamento[:\-\s]+([^\n\r]+)'
        ]
        for pattern in pagamento_patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                data.condicoes_pagamento = match.group(1).strip()
                break
        
        # Extract required certifications
        cert_keywords = [
            'certificação', 'certificado', 'norma', 'iso', 'inmetro', 
            'anvisa', 'abnt', 'regulamento', 'registro'
        ]
        for keyword in cert_keywords:
            pattern = rf'{keyword}[:\-\s]*([^\n\r]+)'
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches:
                cert = match.strip()
                if cert and cert not in data.certificacoes_exigidas:
                    data.certificacoes_exigidas.append(cert)
        
        return data
    
    async def _classify_document_type(self, content: str) -> str:
        """Classify the type of procurement document"""
        
        content_lower = content.lower()
        
        # Check for specific document types
        if any(term in content_lower for term in ['edital', 'pregão', 'licitação']):
            return 'edital'
        elif any(term in content_lower for term in ['termo de referência', 'tr', 'especificação']):
            return 'termo_referencia'
        elif any(term in content_lower for term in ['contrato', 'acordo', 'ajuste']):
            return 'contrato'
        elif any(term in content_lower for term in ['proposta', 'oferta', 'cotação']):
            return 'proposta'
        elif any(term in content_lower for term in ['ata', 'registro de preços']):
            return 'ata_registro_precos'
        else:
            return 'documento_generico'
    
    async def _classify_table(self, table: TableData) -> Dict[str, Any]:
        """Classify table content and type"""
        
        table_data = table.raw_data
        table_text = json.dumps(table_data).lower()
        
        # Classify table type
        if any(term in table_text for term in ['item', 'produto', 'serviço', 'descrição']):
            table_type = 'produtos_servicos'
        elif any(term in table_text for term in ['preço', 'valor', 'custo', 'orçamento']):
            table_type = 'financeiro'
        elif any(term in table_text for term in ['prazo', 'cronograma', 'data', 'período']):
            table_type = 'cronograma'
        elif any(term in table_text for term in ['especificação', 'técnico', 'característica']):
            table_type = 'especificacao_tecnica'
        else:
            table_type = 'geral'
        
        return {
            "table_id": table.table_id,
            "table_type": table_type,
            "confidence": 0.8,
            "contains_products": table_type == 'produtos_servicos',
            "contains_values": table_type == 'financeiro',
            "structured_analysis": {
                "estimated_rows": table.num_rows,
                "estimated_cols": table.num_cols,
                "has_headers": bool(table.headers),
                "complexity": "high" if table.num_rows * table.num_cols > 50 else "medium" if table.num_rows * table.num_cols > 10 else "low"
            }
        }
    
    async def _calculate_complexity_score(self, content: str) -> float:
        """Calculate document complexity score"""
        
        # Simple heuristic-based complexity calculation
        word_count = len(content.split())
        sentence_count = len(re.findall(r'[.!?]+', content))
        table_count = content.lower().count('tabela') + content.lower().count('table')
        technical_terms = len(re.findall(r'(norma|regulamento|especificação|certificação|iso|abnt)', content, re.IGNORECASE))
        
        # Normalize and combine factors
        complexity = min(1.0, (
            (word_count / 10000) * 0.3 +
            (sentence_count / 100) * 0.2 +
            (table_count / 20) * 0.3 +
            (technical_terms / 50) * 0.2
        ))
        
        return complexity
    
    async def _identify_key_sections(self, content: str) -> List[Dict[str, Any]]:
        """Identify key sections in the document"""
        
        sections = []
        
        # Common section patterns in procurement documents
        section_patterns = [
            (r'objeto', 'Objeto/Finalidade'),
            (r'especificaç(ões|ao)', 'Especificações Técnicas'),
            (r'condiç(ões|ao)', 'Condições'),
            (r'prazo', 'Prazos'),
            (r'pagamento', 'Pagamento'),
            (r'entrega', 'Entrega'),
            (r'garantia', 'Garantia'),
            (r'penalidade', 'Penalidades'),
            (r'anexo', 'Anexos')
        ]
        
        for pattern, section_name in section_patterns:
            matches = list(re.finditer(rf'\b{pattern}\b', content, re.IGNORECASE))
            if matches:
                sections.append({
                    "section_name": section_name,
                    "occurrences": len(matches),
                    "confidence": min(1.0, len(matches) / 3)
                })
        
        return sections
    
    async def _assess_language_quality(self, content: str) -> Dict[str, Any]:
        """Assess the quality and characteristics of document language"""
        
        # Simple language quality assessment
        word_count = len(content.split())
        char_count = len(content)
        
        # Check for common quality indicators
        has_numbers = bool(re.search(r'\d', content))
        has_punctuation = bool(re.search(r'[.!?;:]', content))
        has_technical_terms = bool(re.search(r'(especificação|norma|regulamento|certificação)', content, re.IGNORECASE))
        
        return {
            "word_count": word_count,
            "character_count": char_count,
            "avg_word_length": char_count / max(word_count, 1),
            "has_numbers": has_numbers,
            "has_punctuation": has_punctuation,
            "has_technical_terms": has_technical_terms,
            "estimated_quality": "high" if all([has_numbers, has_punctuation, has_technical_terms]) else "medium"
        }
    
    async def is_product_table(self, table_data: Dict[str, Any]) -> bool:
        """Determine if a table contains product/service information"""
        
        table_text = json.dumps(table_data).lower()
        
        # Keywords that indicate product/service tables
        product_keywords = [
            'item', 'produto', 'serviço', 'descrição', 'especificação',
            'código', 'material', 'equipamento', 'fornecimento'
        ]
        
        keyword_count = sum(1 for keyword in product_keywords if keyword in table_text)
        
        # Consider it a product table if it has multiple product-related keywords
        return keyword_count >= 2
    
    async def structure_product_table(self, table_data: Dict[str, Any]) -> Dict[str, Any]:
        """Structure a product table into standardized format"""
        
        # This would use more sophisticated LLM analysis in production
        # For now, provide a structured template
        
        return {
            "table_type": "produtos_servicos",
            "structured_data": table_data,
            "estimated_products": 0,  # Would be calculated from actual table analysis
            "has_prices": False,  # Would be detected from content
            "has_specifications": False,  # Would be detected from content
            "confidence": 0.8
        }