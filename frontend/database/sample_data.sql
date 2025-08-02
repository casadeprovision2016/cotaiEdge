-- =====================================================
-- CotAi Edge - Dados de Exemplo B2B
-- Sistema para Empresas
-- =====================================================

-- =====================================================
-- 1. ORGANIZAÇÕES DE EXEMPLO (Empresas)
-- =====================================================

-- Empresa de grande porte
INSERT INTO organizations (
    id,
    name,
    cnpj,
    email,
    phone,
    address,
    subscription_plan,
    plan_limits,
    status
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'TechCorp Soluções Ltda',
    '12.345.678/0001-90',
    'contato@techcorp.com.br',
    '(11) 3456-7890',
    '{
        "street": "Av. Paulista, 1000",
        "district": "Bela Vista",
        "city": "São Paulo",
        "state": "SP",
        "zipcode": "01310-100",
        "country": "Brasil"
    }',
    'premium',
    '{
        "quotations_per_month": 1000,
        "suppliers_limit": 500,
        "storage_gb": 100,
        "users_limit": 50
    }',
    'active'
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'Indústria MetalMax S.A.',
    '98.765.432/0001-10',
    'compras@metalmax.com.br',
    '(21) 2345-6789',
    '{
        "street": "Rua das Indústrias, 500",
        "district": "Distrito Industrial",
        "city": "Rio de Janeiro",
        "state": "RJ",
        "zipcode": "20220-080",
        "country": "Brasil"
    }',
    'enterprise',
    '{
        "quotations_per_month": 5000,
        "suppliers_limit": 1000,
        "storage_gb": 500,
        "users_limit": 100
    }',
    'active'
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'Comercial BrasilTrade Ltda',
    '56.789.123/0001-45',
    'admin@brasiltrade.com.br',
    '(31) 3456-7890',
    '{
        "street": "Av. Afonso Pena, 3000",
        "district": "Centro",
        "city": "Belo Horizonte",
        "state": "MG",
        "zipcode": "30130-009",
        "country": "Brasil"
    }',
    'professional',
    '{
        "quotations_per_month": 300,
        "suppliers_limit": 200,
        "storage_gb": 50,
        "users_limit": 20
    }',
    'active'
);

-- =====================================================
-- 2. USUÁRIOS DAS EMPRESAS
-- =====================================================

-- Usuários da TechCorp
INSERT INTO users (
    id,
    organization_id,
    supabase_uid,
    email,
    name,
    role,
    permissions,
    preferences,
    is_active,
    status
) VALUES (
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    '8edf2a3c-9115-439c-bedb-4e12dd3d62ac', -- UUID do Supabase Auth
    'admin@techcorp.com.br',
    'Carlos Silva',
    'admin',
    '{
        "quotations_create": true,
        "quotations_edit": true,
        "quotations_delete": true,
        "quotations_view": true,
        "quotations_manage_status": true,
        "suppliers_create": true,
        "suppliers_edit": true,
        "suppliers_delete": true,
        "suppliers_view": true,
        "users_create": true,
        "users_edit": true,
        "users_delete": true,
        "users_view": true,
        "reports_view": true,
        "reports_export": true,
        "settings_view": true,
        "settings_edit": true,
        "organization_manage": true
    }',
    '{
        "theme": "light",
        "language": "pt-BR",
        "notifications_email": true,
        "notifications_browser": true,
        "dashboard_layout": "kanban"
    }',
    true,
    'active'
),
(
    '660e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    '7edf2a3c-9115-439c-bedb-4e12dd3d62ac',
    'compras@techcorp.com.br',
    'Ana Santos',
    'user',
    '{
        "quotations_create": true,
        "quotations_edit": true,
        "quotations_view": true,
        "quotations_manage_status": true,
        "suppliers_create": true,
        "suppliers_edit": true,
        "suppliers_view": true,
        "reports_view": true
    }',
    '{
        "theme": "light",
        "language": "pt-BR",
        "notifications_email": true
    }',
    true,
    'active'
);

-- Usuários da MetalMax
INSERT INTO users (
    id,
    organization_id,
    supabase_uid,
    email,
    name,
    role,
    permissions,
    is_active,
    status
) VALUES (
    '660e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440002',
    '6edf2a3c-9115-439c-bedb-4e12dd3d62ac',
    'admin@metalmax.com.br',
    'Roberto Oliveira',
    'admin',
    '{
        "quotations_create": true,
        "quotations_edit": true,
        "quotations_delete": true,
        "quotations_view": true,
        "quotations_manage_status": true,
        "suppliers_create": true,
        "suppliers_edit": true,
        "suppliers_view": true,
        "organization_manage": true
    }',
    true,
    'active'
);

-- =====================================================
-- 3. FORNECEDORES CORPORATIVOS
-- =====================================================

-- Fornecedores para TechCorp
INSERT INTO suppliers (
    id,
    organization_id,
    name,
    cnpj,
    type,
    email,
    phone,
    whatsapp,
    address,
    performance_score,
    total_quotations,
    response_rate,
    avg_response_time_hours,
    last_interaction,
    categories,
    status,
    documents,
    certifications
) VALUES (
    '770e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'TI Solutions Distribuidora Ltda',
    '11.222.333/0001-44',
    'pj',
    'vendas@tisolutions.com.br',
    '(11) 4567-8900',
    '(11) 94567-8900',
    '{
        "street": "Rua da Tecnologia, 100",
        "district": "Vila Olímpia",
        "city": "São Paulo",
        "state": "SP",
        "zipcode": "04551-000"
    }',
    8.5,
    45,
    92.3,
    24,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    '["hardware", "software", "periféricos", "infraestrutura"]',
    'active',
    '{
        "cnpj_document": "https://storage.url/cnpj_ti_solutions.pdf",
        "inscricao_estadual": "123.456.789.012",
        "alvara_funcionamento": "https://storage.url/alvara_ti.pdf"
    }',
    '["ISO 9001", "ISO 27001", "Microsoft Partner"]'
),
(
    '770e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'Office Premium Suprimentos S.A.',
    '22.333.444/0001-55',
    'pj',
    'comercial@officepremium.com.br',
    '(11) 3456-7890',
    '(11) 93456-7890',
    '{
        "street": "Av. das Empresas, 2000",
        "district": "Alphaville",
        "city": "Barueri",
        "state": "SP",
        "zipcode": "06454-000"
    }',
    9.2,
    78,
    95.8,
    18,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    '["material_escritório", "móveis", "limpeza", "papelaria"]',
    'active',
    '{
        "cnpj_document": "https://storage.url/cnpj_office.pdf",
        "certificado_qualidade": "https://storage.url/cert_quality.pdf"
    }',
    '["FSC Certified", "Green Office"]'
),
(
    '770e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440001',
    'Serviços Corporativos Excellence Ltda',
    '33.444.555/0001-66',
    'pj',
    'propostas@excellence.com.br',
    '(11) 2345-6789',
    '(11) 92345-6789',
    '{
        "street": "Rua dos Serviços, 300",
        "district": "Itaim Bibi",
        "city": "São Paulo", 
        "state": "SP",
        "zipcode": "04530-001"
    }',
    7.8,
    32,
    87.5,
    36,
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    '["consultoria", "treinamento", "terceirização", "segurança"]',
    'active',
    '{
        "cnpj_document": "https://storage.url/cnpj_excellence.pdf",
        "certificado_seguranca": "https://storage.url/cert_security.pdf"
    }',
    '["ISO 45001", "ABNT NBR 16001"]'
);

-- Fornecedores para MetalMax
INSERT INTO suppliers (
    id,
    organization_id,
    name,
    cnpj,
    type,
    email,
    phone,
    categories,
    performance_score,
    total_quotations,
    response_rate,
    avg_response_time_hours,
    status
) VALUES (
    '770e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440002',
    'Siderúrgica Nacional S.A.',
    '44.555.666/0001-77',
    'pj',
    'vendas@siderurgica.com.br',
    '(21) 3456-7890',
    '["aço", "ferro", "materiais_siderúrgicos", "matéria_prima"]',
    9.5,
    125,
    98.2,
    12,
    'active'
),
(
    '770e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440002',
    'Equipamentos Industriais Pro Ltda',
    '55.666.777/0001-88',
    'pj',
    'comercial@equipamentos.com.br',
    '(21) 2345-6789',
    '["máquinas", "equipamentos", "ferramentas", "manutenção"]',
    8.8,
    67,
    94.5,
    20,
    'active'
);

-- =====================================================
-- 4. COTAÇÕES DE EXEMPLO
-- =====================================================

-- Cotação da TechCorp para equipamentos de TI
INSERT INTO quotations (
    id,
    organization_id,
    number,
    title,
    description,
    orgao,
    modalidade,
    local,
    opening_date,
    closing_date,
    response_deadline,
    estimated_value,
    max_value,
    status,
    priority,
    auto_invite,
    require_documents,
    responsible_user_id
) VALUES (
    '880e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'COT-2025-001',
    'Aquisição de Workstations e Servidores para Expansão',
    'Cotação para aquisição de 50 workstations de alta performance e 5 servidores para expansão da infraestrutura de TI da empresa. Equipamentos devem atender especificações técnicas detalhadas e incluir garantia de 3 anos.',
    'TechCorp Soluções Ltda',
    'Cotação Fechada',
    'São Paulo/SP',
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP + INTERVAL '15 days',
    CURRENT_TIMESTAMP + INTERVAL '10 days',
    450000.00,
    500000.00,
    'em_andamento',
    'alta',
    true,
    true,
    '660e8400-e29b-41d4-a716-446655440001'
),
(
    '880e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'COT-2025-002',
    'Material de Escritório - Suprimentos Anuais',
    'Fornecimento de material de escritório e suprimentos diversos para uso durante o ano de 2025. Inclui papelaria, cartuchos de impressora, material de limpeza e móveis básicos.',
    'TechCorp Soluções Ltda',
    'Cotação Aberta',
    'São Paulo/SP',
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP + INTERVAL '20 days',
    CURRENT_TIMESTAMP + INTERVAL '12 days',
    85000.00,
    100000.00,
    'abertas',
    'media',
    false,
    false,
    '660e8400-e29b-41d4-a716-446655440002'
),
(
    '880e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440001',
    'COT-2025-003',
    'Serviços de Consultoria em Segurança da Informação',
    'Contratação de empresa especializada para realizar auditoria de segurança, implementação de políticas de compliance e treinamento da equipe técnica.',
    'TechCorp Soluções Ltda',
    'Prestação de Serviços',
    'São Paulo/SP',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP + INTERVAL '25 days',
    CURRENT_TIMESTAMP + INTERVAL '18 days',
    120000.00,
    150000.00,
    'respondidas',
    'alta',
    true,
    true,
    '660e8400-e29b-41d4-a716-446655440001'
);

-- Cotação da MetalMax
INSERT INTO quotations (
    id,
    organization_id,
    number,
    title,
    description,
    estimated_value,
    status,
    priority,
    responsible_user_id
) VALUES (
    '880e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440002',
    'COT-2025-001',
    'Aquisição de Matéria Prima - Aço Carbono',
    'Fornecimento de 500 toneladas de aço carbono SAE 1020 para produção industrial do primeiro semestre de 2025.',
    2500000.00,
    'abertas',
    'alta',
    '660e8400-e29b-41d4-a716-446655440003'
);

-- =====================================================
-- 5. ITENS DAS COTAÇÕES
-- =====================================================

-- Itens da cotação de TI (COT-2025-001)
INSERT INTO quotation_items (
    id,
    quotation_id,
    item_number,
    description,
    quantity,
    unit,
    specifications,
    brand_required,
    technical_requirements,
    reference_price,
    max_price
) VALUES (
    '990e8400-e29b-41d4-a716-446655440001',
    '880e8400-e29b-41d4-a716-446655440001',
    1,
    'Workstation Alto Desempenho',
    50,
    'unidade',
    'Processador Intel Core i7 ou AMD Ryzen 7, mínimo 32GB RAM DDR4, SSD 1TB NVMe, Placa de vídeo dedicada mín. 8GB, Windows 11 Pro',
    false,
    '{
        "processor": "Intel i7 11th gen ou superior / AMD Ryzen 7 5000 series ou superior",
        "memory": "32GB DDR4 mínimo",
        "storage": "SSD NVMe 1TB",
        "graphics": "Placa de vídeo dedicada 8GB mínimo",
        "os": "Windows 11 Pro",
        "warranty": "3 anos on-site"
    }',
    7500.00,
    8500.00
),
(
    '990e8400-e29b-41d4-a716-446655440002',
    '880e8400-e29b-41d4-a716-446655440001',
    2,
    'Servidor Rack 2U',
    5,
    'unidade',
    'Servidor 2U com processador Xeon, 64GB RAM, 4x SSD 2TB em RAID 10, fonte redundante, Windows Server 2022',
    false,
    '{
        "processor": "Intel Xeon Silver ou superior",
        "memory": "64GB DDR4 ECC",
        "storage": "4x SSD 2TB RAID 10",
        "power": "Fonte redundante hot-swap",
        "os": "Windows Server 2022 Standard",
        "warranty": "3 anos NBD"
    }',
    25000.00,
    28000.00
);

-- Itens da cotação de material de escritório (COT-2025-002)
INSERT INTO quotation_items (
    id,
    quotation_id,
    item_number,
    description,
    quantity,
    unit,
    specifications,
    reference_price,
    max_price
) VALUES (
    '990e8400-e29b-41d4-a716-446655440003',
    '880e8400-e29b-41d4-a716-446655440002',
    1,
    'Cartucho de Tinta Impressora HP',
    200,
    'unidade',
    'Cartucho original HP 664 preto e colorido compatível com impressoras HP DeskJet',
    45.00,
    55.00
),
(
    '990e8400-e29b-41d4-a716-446655440004',
    '880e8400-e29b-41d4-a716-446655440002',
    2,
    'Papel A4 75g Resma',
    500,
    'resma',
    'Papel sulfite A4 branco 75g/m² pacote com 500 folhas',
    22.00,
    28.00
);

-- =====================================================
-- 6. CONVITES PARA FORNECEDORES
-- =====================================================

-- Convites para cotação de TI
INSERT INTO quotation_invitations (
    id,
    quotation_id,
    supplier_id,
    invitation_method,
    sent_by,
    status,
    viewed_at
) VALUES (
    'aa0e8400-e29b-41d4-a716-446655440001',
    '880e8400-e29b-41d4-a716-446655440001',
    '770e8400-e29b-41d4-a716-446655440001',
    'email',
    '660e8400-e29b-41d4-a716-446655440001',
    'responded',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
);

-- Convites para cotação de material de escritório
INSERT INTO quotation_invitations (
    id,
    quotation_id,
    supplier_id,
    invitation_method,
    sent_by,
    status,
    viewed_at
) VALUES (
    'aa0e8400-e29b-41d4-a716-446655440002',
    '880e8400-e29b-41d4-a716-446655440002',
    '770e8400-e29b-41d4-a716-446655440002',
    'email',
    '660e8400-e29b-41d4-a716-446655440002',
    'sent',
    NULL
);

-- =====================================================
-- 7. PROPOSTAS DOS FORNECEDORES
-- =====================================================

-- Proposta da TI Solutions para workstations
INSERT INTO supplier_proposals (
    id,
    quotation_id,
    supplier_id,
    quotation_invitation_id,
    proposal_number,
    total_value,
    validity_days,
    delivery_time_days,
    payment_terms,
    observations,
    technical_compliance,
    status,
    reviewed_by
) VALUES (
    'bb0e8400-e29b-41d4-a716-446655440001',
    '880e8400-e29b-41d4-a716-446655440001',
    '770e8400-e29b-41d4-a716-446655440001',
    'aa0e8400-e29b-41d4-a716-446655440001',
    'PROP-TI-2025-001',
    425000.00,
    45,
    30,
    '30% na assinatura do contrato, 40% na entrega, 30% em 30 dias após aceite',
    'Proposta inclui instalação, configuração e migração de dados. Treinamento da equipe técnica incluído.',
    '{
        "workstations_compliance": "100%",
        "servers_compliance": "100%", 
        "warranty_compliance": "3 anos on-site confirmado",
        "delivery_compliance": "30 dias confirmado"
    }',
    'under_review',
    '660e8400-e29b-41d4-a716-446655440001'
);

-- =====================================================
-- 8. ITENS DAS PROPOSTAS
-- =====================================================

-- Itens da proposta TI Solutions
INSERT INTO proposal_items (
    id,
    proposal_id,
    quotation_item_id,
    unit_price,
    total_price,
    quantity,
    brand,
    model,
    technical_specs,
    notes
) VALUES (
    'cc0e8400-e29b-41d4-a716-446655440001',
    'bb0e8400-e29b-41d4-a716-446655440001',
    '990e8400-e29b-41d4-a716-446655440001',
    7200.00,
    360000.00,
    50,
    'Dell',
    'OptiPlex 7090 Tower',
    '{
        "processor": "Intel Core i7-11700 3.6GHz",
        "memory": "32GB DDR4 3200MHz",
        "storage": "SSD NVMe 1TB Samsung",
        "graphics": "NVIDIA GTX 1660 Super 6GB",
        "os": "Windows 11 Pro",
        "warranty": "3 anos ProSupport on-site"
    }',
    'Configuração personalizada conforme especificações. Inclui mouse e teclado sem fio.'
),
(
    'cc0e8400-e29b-41d4-a716-446655440002',
    'bb0e8400-e29b-41d4-a716-446655440001',
    '990e8400-e29b-41d4-a716-446655440002',
    13000.00,
    65000.00,
    5,
    'Dell',
    'PowerEdge R750',
    '{
        "processor": "Intel Xeon Silver 4314 2.4GHz",
        "memory": "64GB DDR4 ECC 3200MHz",
        "storage": "4x SSD 2TB Dell em RAID 10",
        "power": "Fonte dupla 750W hot-swap",
        "os": "Windows Server 2022 Standard",
        "warranty": "3 anos ProSupport NBD"
    }',
    'Servidor rack 2U com configuração alta disponibilidade. Inclui rails e cabo de força.'
);

-- =====================================================
-- 9. OPORTUNIDADES PNCP DE EXEMPLO
-- =====================================================

INSERT INTO pncp_opportunities (
    id,
    pncp_contracting_id,
    notice_number,
    title,
    organ_code,
    organ_name,
    uf,
    municipality,
    modality_id,
    modality_name,
    procurement_object,
    estimated_total_value,
    proposal_opening_date,
    proposal_closing_date,
    publication_date,
    situation,
    raw_data,
    is_imported
) VALUES (
    'dd0e8400-e29b-41d4-a716-446655440001',
    '12345678000190-1-000001/2025',
    'PE-001/2025',
    'Pregão Eletrônico - Aquisição de Equipamentos de Informática',
    '12345',
    'Secretaria Municipal de Administração',
    'SP',
    'São Paulo',
    1,
    'Pregão Eletrônico',
    'Aquisição de computadores, impressoras e equipamentos de rede para modernização do parque tecnológico',
    850000.00,
    CURRENT_TIMESTAMP + INTERVAL '15 days',
    CURRENT_TIMESTAMP + INTERVAL '30 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    'Aberto',
    '{
        "numeroControleEdital": "12345678000190-1-000001/2025",
        "linkSistemaOrigem": "https://pncp.gov.br/edital/12345",
        "nomeRazaoSocialFornecedor": "",
        "numeroDocumento": "",
        "tipoPessoa": "",
        "porte": "",
        "situacaoEdital": "Aberto",
        "modalidadeId": 1,
        "modalidadeNome": "Pregão Eletrônico",
        "unidadeOrgao": {
            "codigoUnidade": "12345",
            "nomeUnidade": "Secretaria Municipal de Administração",
            "ufNome": "São Paulo",
            "municipioNome": "São Paulo",
            "codigoIbge": "3550308"
        },
        "objetoEdital": "Aquisição de equipamentos de informática",
        "valorTotalEstimado": 850000.00,
        "dataAberturaProposta": "2025-02-15T10:00:00Z",
        "dataEncerramentoProposta": "2025-03-01T18:00:00Z",
        "dataPublicacaoPncp": "2025-01-30T09:00:00Z"
    }',
    false
);

-- =====================================================
-- 10. NOTIFICAÇÕES DE EXEMPLO
-- =====================================================

-- Notificações para usuários TechCorp
INSERT INTO notifications (
    id,
    user_id,
    organization_id,
    title,
    message,
    type,
    related_entity_type,
    related_entity_id,
    is_read,
    channels
) VALUES (
    'ee0e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'Nova proposta recebida',
    'A empresa TI Solutions enviou uma proposta para a cotação COT-2025-001 - Aquisição de Workstations',
    'info',
    'quotation',
    '880e8400-e29b-41d4-a716-446655440001',
    false,
    '["web", "email"]'
),
(
    'ee0e8400-e29b-41d4-a716-446655440002',
    '660e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'Prazo da cotação se aproxima',
    'A cotação COT-2025-002 - Material de Escritório tem prazo de resposta até 12/02/2025',
    'warning',
    'quotation',
    '880e8400-e29b-41d4-a716-446655440002',
    false,
    '["web", "email"]'
),
(
    'ee0e8400-e29b-41d4-a716-446655440003',
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'Nova oportunidade PNCP encontrada',
    'Foi identificada uma nova oportunidade no PNCP que pode ser do seu interesse: Pregão Eletrônico - Equipamentos de Informática',
    'success',
    'pncp_opportunity',
    'dd0e8400-e29b-41d4-a716-446655440001',
    false,
    '["web"]'
);

-- =====================================================
-- 11. LOGS DE AUDITORIA INICIAIS
-- =====================================================

INSERT INTO audit_logs (
    entity_type,
    entity_id,
    action,
    new_values,
    user_id,
    organization_id
) VALUES (
    'organization',
    '550e8400-e29b-41d4-a716-446655440001',
    'INSERT',
    '{"name": "TechCorp Soluções Ltda", "status": "active", "subscription_plan": "premium"}',
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001'
),
(
    'quotation',
    '880e8400-e29b-41d4-a716-446655440001',
    'INSERT',
    '{"number": "COT-2025-001", "title": "Aquisição de Workstations e Servidores", "status": "em_andamento"}',
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001'
),
(
    'supplier_proposal',
    'bb0e8400-e29b-41d4-a716-446655440001',
    'INSERT',
    '{"proposal_number": "PROP-TI-2025-001", "total_value": 425000.00, "status": "under_review"}',
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001'
);

-- =====================================================
-- 12. ATUALIZAR SEQUÊNCIAS E ESTATÍSTICAS
-- =====================================================

-- Atualizar contadores de fornecedores
UPDATE suppliers SET 
    total_quotations = (
        SELECT COUNT(*) FROM quotation_invitations qi 
        WHERE qi.supplier_id = suppliers.id
    ),
    last_interaction = CURRENT_TIMESTAMP - INTERVAL '1 day'
WHERE organization_id IN (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002'
);

-- =====================================================
-- FINALIZAÇÃO
-- =====================================================

-- Verificar dados inseridos
SELECT 
    'Dados de exemplo inseridos com sucesso!' as status,
    (SELECT COUNT(*) FROM organizations) as total_organizations,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM suppliers) as total_suppliers,
    (SELECT COUNT(*) FROM quotations) as total_quotations,
    (SELECT COUNT(*) FROM supplier_proposals) as total_proposals,
    (SELECT COUNT(*) FROM notifications) as total_notifications;

-- Mensagem final
SELECT 'Sistema CotAi Edge configurado com dados B2B de exemplo!' as final_status;