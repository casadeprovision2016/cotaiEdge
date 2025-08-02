-- Estrutura inicial das tabelas principais para CotAi Edge
-- Baseado em db.md - versão simplificada para MVP

-- ============================================
-- 1. ORGANIZAÇÕES E USUÁRIOS
-- ============================================

-- Organizações/Empresas
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address JSONB,
    subscription_plan VARCHAR(50) DEFAULT 'trial',
    plan_limits JSONB DEFAULT '{
        "quotations_per_month": 20,
        "suppliers_limit": 50,
        "storage_gb": 1
    }',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- Usuários do Sistema (integração com Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    supabase_uid UUID UNIQUE NOT NULL, -- Referência ao Supabase Auth
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user',
    permissions JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    last_login TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. FORNECEDORES
-- ============================================

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    cpf VARCHAR(14),
    type VARCHAR(10) NOT NULL, -- 'pj', 'pf', 'mei'
    email VARCHAR(255),
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    address JSONB,
    
    -- Performance e Histórico
    performance_score DECIMAL(3,2) DEFAULT 0.00,
    total_quotations INTEGER DEFAULT 0,
    response_rate DECIMAL(5,2) DEFAULT 0.00,
    avg_response_time_hours INTEGER DEFAULT 0,
    last_interaction TIMESTAMP WITH TIME ZONE,
    
    -- Categorias de Produtos/Serviços
    categories JSONB DEFAULT '[]',
    
    -- Status e Validações
    status VARCHAR(20) DEFAULT 'active',
    documents JSONB DEFAULT '{}',
    certifications JSONB DEFAULT '[]',
    
    -- Auditoria
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- ============================================
-- 3. PRODUTOS/SERVIÇOS
-- ============================================

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    
    -- Identificação
    code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    unit VARCHAR(20), -- 'unidade', 'kg', 'litro', etc.
    
    -- Preços de Referência
    reference_price DECIMAL(12,2),
    min_price DECIMAL(12,2),
    max_price DECIMAL(12,2),
    
    -- Especificações
    specifications JSONB DEFAULT '{}',
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    
    -- Auditoria
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. COTAÇÕES
-- ============================================

CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    
    -- Identificação
    number VARCHAR(50) UNIQUE NOT NULL, -- COT-2025-001
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Integração PNCP
    pncp_id VARCHAR(100), -- Ex: 08999690000146-1-000026/2025
    pncp_data JSONB,
    
    -- Informações da Licitação
    orgao VARCHAR(255),
    modalidade VARCHAR(100),
    local VARCHAR(255),
    
    -- Prazos
    opening_date TIMESTAMP WITH TIME ZONE,
    closing_date TIMESTAMP WITH TIME ZONE,
    response_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Valores
    estimated_value DECIMAL(12,2),
    max_value DECIMAL(12,2),
    
    -- Status e Controle
    status VARCHAR(30) DEFAULT 'abertas', -- abertas, em_andamento, respondidas, finalizadas, canceladas
    priority VARCHAR(10) DEFAULT 'media', -- alta, media, baixa
    
    -- Responsável
    responsible_user_id UUID REFERENCES users(id),
    
    -- Configurações
    auto_invite BOOLEAN DEFAULT false,
    require_documents BOOLEAN DEFAULT true,
    
    -- Auditoria
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- ============================================
-- 5. ITENS DAS COTAÇÕES
-- ============================================

CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    
    -- Detalhes do Item
    item_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    
    -- Especificações
    specifications TEXT,
    brand_required BOOLEAN DEFAULT false,
    technical_requirements JSONB DEFAULT '{}',
    
    -- Preços de Referência
    reference_price DECIMAL(12,2),
    max_price DECIMAL(12,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. CONVITES E PROPOSTAS
-- ============================================

CREATE TABLE IF NOT EXISTS quotation_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id),
    
    -- Controle de Envio
    invitation_method VARCHAR(20) DEFAULT 'email', -- email, whatsapp, phone
    sent_at TIMESTAMP WITH TIME ZONE,
    sent_by UUID REFERENCES users(id),
    
    -- Status do Convite
    status VARCHAR(20) DEFAULT 'sent', -- sent, viewed, responded, declined
    viewed_at TIMESTAMP WITH TIME ZONE,
    response_received_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
    quotation_invitation_id UUID REFERENCES quotation_invitations(id),
    supplier_id UUID REFERENCES suppliers(id),
    
    -- Dados da Proposta
    proposal_number VARCHAR(50),
    total_value DECIMAL(12,2) NOT NULL,
    delivery_time_days INTEGER,
    payment_terms TEXT,
    validity_days INTEGER DEFAULT 30,
    
    -- Observações e Condições
    observations TEXT,
    technical_compliance JSONB DEFAULT '{}',
    
    -- Status
    status VARCHAR(20) DEFAULT 'submitted', -- submitted, under_review, accepted, rejected
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proposal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES supplier_proposals(id) ON DELETE CASCADE,
    quotation_item_id UUID REFERENCES quotation_items(id),
    
    -- Preços e Quantidades
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    
    -- Especificações do Fornecedor
    brand VARCHAR(100),
    model VARCHAR(100),
    technical_specs JSONB DEFAULT '{}',
    
    -- Observações
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. NOTIFICAÇÕES E MENSAGENS
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    
    -- Conteúdo
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL, -- 'info', 'warning', 'success', 'error'
    
    -- Relacionamento (polimórfico)
    related_entity_type VARCHAR(50), -- 'quotation', 'proposal', 'supplier'
    related_entity_id UUID,
    
    -- Controles
    read_at TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN DEFAULT false,
    
    -- Canais de Entrega
    channels JSONB DEFAULT '["web"]', -- web, email, whatsapp, push
    sent_email BOOLEAN DEFAULT false,
    sent_whatsapp BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. HISTÓRICO E AUDITORIA
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Entidade Afetada
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    
    -- Ação Executada
    action VARCHAR(50) NOT NULL, -- create, update, delete, status_change, etc.
    old_values JSONB,
    new_values JSONB,
    changes JSONB,
    
    -- Contexto
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 9. OPORTUNIDADES PNCP
-- ============================================

CREATE TABLE IF NOT EXISTS pncp_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação PNCP
    pncp_contracting_id VARCHAR(50) UNIQUE NOT NULL,
    notice_number VARCHAR(50) NOT NULL,
    notice_type VARCHAR(50),
    
    -- Dados Básicos
    title VARCHAR(500) NOT NULL,
    description TEXT,
    modality VARCHAR(100),
    status VARCHAR(50),
    
    -- Orgão
    organ_name VARCHAR(255),
    organ_cnpj VARCHAR(18),
    organ_city VARCHAR(100),
    organ_state VARCHAR(2),
    
    -- Valores e Prazos
    estimated_value DECIMAL(15,2),
    opening_date TIMESTAMP WITH TIME ZONE,
    closing_date TIMESTAMP WITH TIME ZONE,
    
    -- Dados Completos (JSON)
    raw_data JSONB,
    
    -- Controle
    last_sync TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. ÍNDICES PRINCIPAIS
-- ============================================

-- Usuários
CREATE INDEX IF NOT EXISTS idx_users_supabase_uid ON users(supabase_uid);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Fornecedores
CREATE INDEX IF NOT EXISTS idx_suppliers_organization ON suppliers(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_suppliers_performance ON suppliers(performance_score DESC);

-- Cotações
CREATE INDEX IF NOT EXISTS idx_quotations_organization ON quotations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status, closing_date);
CREATE INDEX IF NOT EXISTS idx_quotations_pncp ON quotations(pncp_id);
CREATE INDEX IF NOT EXISTS idx_quotations_responsible ON quotations(responsible_user_id);

-- Propostas
CREATE INDEX IF NOT EXISTS idx_proposals_quotation ON supplier_proposals(quotation_id, status);
CREATE INDEX IF NOT EXISTS idx_proposals_supplier ON supplier_proposals(supplier_id, status);

-- Notificações
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_organization ON notifications(organization_id, created_at DESC);

-- Auditoria
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);

-- PNCP
CREATE INDEX IF NOT EXISTS idx_pncp_opportunities_active ON pncp_opportunities(is_active, closing_date DESC);
CREATE INDEX IF NOT EXISTS idx_pncp_opportunities_sync ON pncp_opportunities(last_sync);

-- ============================================
-- 11. TRIGGERS PARA UPDATED_AT
-- ============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers nas tabelas principais
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotation_items_updated_at BEFORE UPDATE ON quotation_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supplier_proposals_updated_at BEFORE UPDATE ON supplier_proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pncp_opportunities_updated_at BEFORE UPDATE ON pncp_opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 12. DADOS INICIAIS (SEEDS)
-- ============================================

-- Inserir organização de exemplo
INSERT INTO organizations (id, name, cnpj, email, subscription_plan, plan_limits) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Empresa Demo - CotAi Edge',
    '12.345.678/0001-90',
    'demo@cotaiedge.com',
    'trial',
    '{"quotations_per_month": 20, "suppliers_limit": 50, "storage_gb": 1}'
) ON CONFLICT (cnpj) DO NOTHING;

-- Função para gerar número sequencial de cotação
CREATE OR REPLACE FUNCTION generate_quotation_number(org_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    year_part VARCHAR(4);
    count_part INTEGER;
    formatted_count VARCHAR(3);
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    SELECT COALESCE(MAX(CAST(SPLIT_PART(number, '-', 3) AS INTEGER)), 0) + 1
    INTO count_part
    FROM quotations 
    WHERE organization_id = org_id 
    AND number LIKE 'COT-' || year_part || '-%';
    
    formatted_count := LPAD(count_part::VARCHAR, 3, '0');
    
    RETURN 'COT-' || year_part || '-' || formatted_count;
END;
$$ LANGUAGE plpgsql;

-- Comentários nas tabelas
COMMENT ON TABLE organizations IS 'Empresas/organizações que usam o sistema';
COMMENT ON TABLE users IS 'Usuários do sistema integrados com Supabase Auth';
COMMENT ON TABLE suppliers IS 'Fornecedores cadastrados pelas organizações';
COMMENT ON TABLE quotations IS 'Cotações/licitações gerenciadas pelo sistema';
COMMENT ON TABLE quotation_items IS 'Itens específicos de cada cotação';
COMMENT ON TABLE supplier_proposals IS 'Propostas enviadas pelos fornecedores';
COMMENT ON TABLE notifications IS 'Sistema de notificações multi-canal';
COMMENT ON TABLE audit_logs IS 'Log de auditoria de todas as ações do sistema';
COMMENT ON TABLE pncp_opportunities IS 'Oportunidades sincronizadas do Portal PNCP';