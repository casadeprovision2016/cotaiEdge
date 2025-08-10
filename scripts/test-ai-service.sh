#!/bin/bash
# Test script for CotAi Edge AI Service

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_BASE="http://localhost:8000"

echo -e "${BLUE}🧪 CotAi Edge AI Service Test Suite${NC}"
echo "============================================"

# Function to make HTTP requests with error handling
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /tmp/response.json -w "%{http_code}" "$API_BASE$endpoint")
    elif [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -o /tmp/response.json -w "%{http_code}" -X POST "$API_BASE$endpoint" $data)
    fi
    
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo -e "${GREEN}✅ $method $endpoint - Status: $response${NC}"
        return 0
    else
        echo -e "${RED}❌ $method $endpoint - Status: $response${NC}"
        echo -e "${YELLOW}Response:${NC}"
        cat /tmp/response.json 2>/dev/null || echo "No response body"
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    echo -e "${BLUE}⏳ Waiting for AI service to be ready...${NC}"
    
    for i in {1..30}; do
        if curl -s "$API_BASE/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ AI service is ready!${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
    done
    
    echo -e "\n${RED}❌ AI service failed to start within 60 seconds${NC}"
    return 1
}

# Function to create test PDF
create_test_pdf() {
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python3 not found. Skipping PDF creation test.${NC}"
        return 1
    fi
    
    echo -e "${BLUE}📄 Creating test PDF document...${NC}"
    
    python3 << 'EOF'
import os
from datetime import datetime

# Create a simple text file that simulates a procurement document
test_content = f"""
PREGÃO ELETRÔNICO Nº PE-001/2024
UASG: 986531
ÓRGÃO: Ministério da Gestão e da Inovação em Serviços Públicos

OBJETO: Contratação de serviços especializados em tecnologia da informação para modernização de sistemas corporativos.

VALOR ESTIMADO: R$ 1.500.000,00 (um milhão e quinhentos mil reais)

DATA DE ABERTURA: 15/01/2024 às 10:30h

MODALIDADE: Pregão Eletrônico

LOCAL DE ENTREGA: Brasília - DF, Esplanada dos Ministérios, Bloco C

PRAZO DE ENTREGA: 90 (noventa) dias corridos contados da assinatura do contrato

CONDIÇÕES DE PAGAMENTO: Pagamento em 30 dias após atestação do serviço

GARANTIA EXIGIDA: 5% do valor do contrato

ESPECIFICAÇÕES TÉCNICAS:
- Desenvolvimento de aplicações web responsivas
- Integração com sistemas legados
- Implementação de APIs REST
- Testes automatizados
- Documentação técnica completa

CERTIFICAÇÕES EXIGIDAS:
- ISO 9001:2015
- ISO 27001:2013
- CMMI Nível 3

PENALIDADES:
- Multa de 10% por atraso na entrega
- Multa de 5% por descumprimento das especificações

TABELA DE ITENS:
Item | Descrição | Quantidade | Unidade | Preço Unitário | Total
1    | Desenvolvimento Frontend | 1 | Projeto | R$ 500.000,00 | R$ 500.000,00
2    | Desenvolvimento Backend | 1 | Projeto | R$ 400.000,00 | R$ 400.000,00
3    | Integração de Sistemas | 1 | Projeto | R$ 300.000,00 | R$ 300.000,00
4    | Testes e Qualidade | 1 | Projeto | R$ 200.000,00 | R$ 200.000,00
5    | Documentação | 1 | Projeto | R$ 100.000,00 | R$ 100.000,00

VALOR TOTAL: R$ 1.500.000,00
"""

# Save as text file (will be used for testing)
with open('/tmp/test_edital.txt', 'w', encoding='utf-8') as f:
    f.write(test_content)

print("✅ Test document created: /tmp/test_edital.txt")
EOF
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Test document created successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to create test document${NC}"
        return 1
    fi
}

# Test 1: Health Check
echo -e "\n${BLUE}🏥 Test 1: Health Check${NC}"
wait_for_service

if make_request "GET" "/health"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi

# Test 2: API Documentation
echo -e "\n${BLUE}📚 Test 2: API Documentation${NC}"
if make_request "GET" "/docs"; then
    echo -e "${GREEN}✅ API documentation accessible${NC}"
else
    echo -e "${YELLOW}⚠️  API documentation might not be available${NC}"
fi

# Test 3: Model Download
echo -e "\n${BLUE}📥 Test 3: Model Download${NC}"
if make_request "POST" "/api/v1/models/download"; then
    echo -e "${GREEN}✅ Model download endpoint working${NC}"
else
    echo -e "${YELLOW}⚠️  Model download might take time or fail${NC}"
fi

# Test 4: Create and Process Test Document
echo -e "\n${BLUE}📄 Test 4: Document Processing${NC}"

# Create test document
if create_test_pdf; then
    echo -e "${BLUE}⬆️  Uploading test document...${NC}"
    
    # Upload document for processing
    response=$(curl -s -w "%{http_code}" \
        -X POST "$API_BASE/api/v1/process/document" \
        -F "file=@/tmp/test_edital.txt" \
        -F "ano=2024" \
        -F "uasg=986531" \
        -F "numero_pregao=PE-001-2024" \
        -o /tmp/upload_response.json)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ Document uploaded successfully${NC}"
        
        # Extract task ID
        task_id=$(python3 -c "
import json
try:
    with open('/tmp/upload_response.json', 'r') as f:
        data = json.load(f)
        print(data.get('task_id', ''))
except:
    pass
")
        
        if [ -n "$task_id" ]; then
            echo -e "${BLUE}📋 Task ID: $task_id${NC}"
            
            # Test 5: Monitor Processing Status
            echo -e "\n${BLUE}⏳ Test 5: Processing Status Monitoring${NC}"
            
            for i in {1..30}; do
                if make_request "GET" "/api/v1/process/$task_id/status"; then
                    status=$(python3 -c "
import json
try:
    with open('/tmp/response.json', 'r') as f:
        data = json.load(f)
        print(data.get('status', ''))
except:
    pass
")
                    current_stage=$(python3 -c "
import json
try:
    with open('/tmp/response.json', 'r') as f:
        data = json.load(f)
        print(data.get('current_stage', ''))
except:
    pass
")
                    
                    echo -e "${BLUE}Status: $status, Stage: $current_stage/9${NC}"
                    
                    if [ "$status" = "completed" ]; then
                        echo -e "${GREEN}✅ Processing completed successfully!${NC}"
                        
                        # Test 6: Quality Assessment
                        echo -e "\n${BLUE}📊 Test 6: Quality Assessment${NC}"
                        if make_request "GET" "/api/v1/process/$task_id/quality"; then
                            quality_grade=$(python3 -c "
import json
try:
    with open('/tmp/response.json', 'r') as f:
        data = json.load(f)
        quality = data.get('quality_score', {})
        print(quality.get('quality_grade', ''))
except:
    pass
")
                            echo -e "${GREEN}✅ Quality Grade: $quality_grade${NC}"
                        fi
                        
                        # Test 7: Get Final Results
                        echo -e "\n${BLUE}📋 Test 7: Final Results${NC}"
                        if make_request "GET" "/api/v1/process/$task_id/result"; then
                            echo -e "${GREEN}✅ Results retrieved successfully${NC}"
                            
                            # Show summary of extracted data
                            python3 -c "
import json
try:
    with open('/tmp/response.json', 'r') as f:
        data = json.load(f)
        structured = data.get('structured_data', {})
        risks = data.get('risks', [])
        opportunities = data.get('opportunities', [])
        
        print(f'📊 Extracted Data Summary:')
        print(f'  - Pregão: {structured.get(\"numero_pregao\", \"N/A\")}')
        print(f'  - UASG: {structured.get(\"uasg\", \"N/A\")}')  
        print(f'  - Órgão: {structured.get(\"orgao\", \"N/A\")}')
        print(f'  - Valor: R$ {structured.get(\"valor_estimado\", 0):,.2f}')
        print(f'  - Risks identified: {len(risks)}')
        print(f'  - Opportunities identified: {len(opportunities)}')
except Exception as e:
    print(f'Error parsing results: {e}')
"
                        fi
                        
                        break
                    elif [ "$status" = "failed" ]; then
                        echo -e "${RED}❌ Processing failed${NC}"
                        break
                    fi
                fi
                
                sleep 3
            done
            
        else
            echo -e "${RED}❌ No task ID received from upload${NC}"
        fi
    else
        echo -e "${RED}❌ Document upload failed - Status: $response${NC}"
        cat /tmp/upload_response.json 2>/dev/null || echo "No response body"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping document processing test${NC}"
fi

# Cleanup
echo -e "\n${BLUE}🧹 Cleanup${NC}"
rm -f /tmp/test_edital.txt /tmp/response.json /tmp/upload_response.json

echo -e "\n${BLUE}🎉 Test Suite Complete!${NC}"
echo "============================================"

# Final status
echo -e "${GREEN}✅ AI Service tests completed${NC}"
echo -e "${BLUE}💡 Next steps:${NC}"
echo "  - Check service logs for detailed processing information"
echo "  - Visit http://localhost:8000/docs for interactive API documentation"
echo "  - Monitor quality scores in the frontend dashboard"
echo "  - Review stored results in the configured storage directory"