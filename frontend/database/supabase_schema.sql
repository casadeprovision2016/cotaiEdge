-- =====================================================
-- CotAi Edge - Schema Supabase PostgreSQL Completo
-- Sistema Inteligente de Gestão de Cotações
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =====================================================
-- 1. TABELAS PRINCIPAIS (Core Entities)
-- =====================================================

-- 1.1 Organizations (Empresas/Organizações)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address JSONB DEFAULT '{}',
    
    -- Planos e Limites
    subscription_plan VARCHAR(50) DEFAULT 'trial',
    plan_limits JSONB DEFAULT '{
        "quotations_per_month": 10,
        "suppliers_limit": 50,
        "storage_gb": 1,
        "users_limit": 3
    }',
    
    -- Status e Controle
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
    trial_end_date TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para organizations
CREATE INDEX idx_organizations_cnpj ON organizations(cnpj);
CREATE INDEX idx_organizations_status ON organizations(status);

-- 1.2 Users (Usuários com integração Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    supabase_uid UUID UNIQUE NOT NULL, -- Referência ao auth.users
    
    -- Dados pessoais
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    
    -- Permissões e Controle
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    permissions JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    
    -- Status e Atividade
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    trial_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'trial_expired')),
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para users
CREATE INDEX idx_users_supabase_uid ON users(supabase_uid);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);

-- 1.3 Suppliers (Fornecedores)
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Identificação
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    cpf VARCHAR(14),
    type VARCHAR(10) NOT NULL CHECK (type IN ('pj', 'pf', 'mei')),
    
    -- Contato
    email VARCHAR(255),
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    address JSONB DEFAULT '{}',
    
    -- Métricas de Performance
    performance_score DECIMAL(3,2) DEFAULT 0.00 CHECK (performance_score >= 0 AND performance_score <= 10),
    total_quotations INTEGER DEFAULT 0,
    response_rate DECIMAL(5,2) DEFAULT 0.00,
    avg_response_time_hours INTEGER DEFAULT 0,
    last_interaction TIMESTAMP,
    
    -- Classificação
    categories JSONB DEFAULT '[]',
    documents JSONB DEFAULT '{}',
    certifications JSONB DEFAULT '[]',
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para suppliers
CREATE INDEX idx_suppliers_organization ON suppliers(organization_id);
CREATE INDEX idx_suppliers_cnpj ON suppliers(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX idx_suppliers_type ON suppliers(type);
CREATE INDEX idx_suppliers_performance ON suppliers(performance_score DESC);

-- =====================================================
-- 2. SISTEMA DE COTAÇÕES
-- =====================================================

-- 2.1 Quotations (Cotações Principais)
CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Identificação e Numeração
    number VARCHAR(50) UNIQUE NOT NULL, -- COT-2025-001
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Integração PNCP
    pncp_id VARCHAR(100),
    pncp_data JSONB DEFAULT '{}',
    
    -- Dados da Licitação
    orgao VARCHAR(255),
    modalidade VARCHAR(100),
    local VARCHAR(255),
    
    -- Prazos
    opening_date TIMESTAMP,
    closing_date TIMESTAMP,
    response_deadline TIMESTAMP,
    
    -- Valores
    estimated_value DECIMAL(12,2),
    max_value DECIMAL(12,2),
    
    -- Status Kanban
    status VARCHAR(30) DEFAULT 'abertas' CHECK (
        status IN ('abertas', 'em_andamento', 'respondidas', 'finalizadas', 'canceladas')
    ),
    priority VARCHAR(10) DEFAULT 'media' CHECK (priority IN ('alta', 'media', 'baixa')),
    
    -- Configurações
    auto_invite BOOLEAN DEFAULT false,
    require_documents BOOLEAN DEFAULT false,
    
    -- Controle
    responsible_user_id UUID REFERENCES users(id),
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para quotations
CREATE INDEX idx_quotations_organization ON quotations(organization_id);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_number ON quotations(number);
CREATE INDEX idx_quotations_deadline ON quotations(response_deadline);
CREATE INDEX idx_quotations_pncp ON quotations(pncp_id) WHERE pncp_id IS NOT NULL;

-- 2.2 Quotation Items (Itens das Cotações)
CREATE TABLE quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    
    -- Identificação do Item
    item_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    
    -- Especificações Técnicas
    specifications TEXT,
    brand_required BOOLEAN DEFAULT false,
    technical_requirements JSONB DEFAULT '{}',
    
    -- Preços de Referência
    reference_price DECIMAL(12,2),
    max_price DECIMAL(12,2),
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(quotation_id, item_number)
);

-- Índices para quotation_items
CREATE INDEX idx_quotation_items_quotation ON quotation_items(quotation_id);

-- 2.3 Quotation Invitations (Convites para Fornecedores)
CREATE TABLE quotation_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    
    -- Controle de Envio
    invitation_method VARCHAR(20) CHECK (invitation_method IN ('email', 'whatsapp', 'phone')),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_by UUID REFERENCES users(id),
    
    -- Status do Convite
    status VARCHAR(20) DEFAULT 'sent' CHECK (
        status IN ('sent', 'viewed', 'responded', 'declined')
    ),
    viewed_at TIMESTAMP,
    response_received_at TIMESTAMP,
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(quotation_id, supplier_id)
);

-- Índices para quotation_invitations
CREATE INDEX idx_quotation_invitations_quotation ON quotation_invitations(quotation_id);
CREATE INDEX idx_quotation_invitations_supplier ON quotation_invitations(supplier_id);
CREATE INDEX idx_quotation_invitations_status ON quotation_invitations(status);

-- =====================================================
-- 3. SISTEMA DE PROPOSTAS
-- =====================================================

-- 3.1 Supplier Proposals (Propostas dos Fornecedores)
CREATE TABLE supplier_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    quotation_invitation_id UUID REFERENCES quotation_invitations(id),
    
    -- Dados da Proposta
    proposal_number VARCHAR(50),
    total_value DECIMAL(12,2) NOT NULL,
    validity_days INTEGER DEFAULT 30,
    delivery_time_days INTEGER,
    payment_terms TEXT,
    observations TEXT,
    
    -- Avaliação Técnica
    technical_compliance JSONB DEFAULT '{}',
    
    -- Status
    status VARCHAR(20) DEFAULT 'submitted' CHECK (
        status IN ('submitted', 'under_review', 'accepted', 'rejected')
    ),
    
    -- Controle
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(quotation_id, supplier_id)
);

-- Índices para supplier_proposals
CREATE INDEX idx_supplier_proposals_quotation ON supplier_proposals(quotation_id);
CREATE INDEX idx_supplier_proposals_supplier ON supplier_proposals(supplier_id);
CREATE INDEX idx_supplier_proposals_status ON supplier_proposals(status);

-- 3.2 Proposal Items (Itens das Propostas)
CREATE TABLE proposal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES supplier_proposals(id) ON DELETE CASCADE,
    quotation_item_id UUID NOT NULL REFERENCES quotation_items(id) ON DELETE CASCADE,
    
    -- Preços e Quantidades
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    
    -- Especificações do Fornecedor
    brand VARCHAR(100),
    model VARCHAR(100),
    technical_specs JSONB DEFAULT '{}',
    notes TEXT,
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(proposal_id, quotation_item_id)
);

-- Índices para proposal_items
CREATE INDEX idx_proposal_items_proposal ON proposal_items(proposal_id);
CREATE INDEX idx_proposal_items_quotation_item ON proposal_items(quotation_item_id);

-- =====================================================
-- 4. INTEGRAÇÃO PNCP
-- =====================================================

-- 4.1 PNCP Opportunities (Oportunidades do Portal Nacional)
CREATE TABLE pncp_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação PNCP
    pncp_contracting_id VARCHAR(50) UNIQUE NOT NULL,
    notice_number VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    
    -- Dados do Órgão
    organ_code VARCHAR(20),
    organ_name VARCHAR(255),
    uf VARCHAR(2),
    municipality VARCHAR(100),
    
    -- Informações da Licitação
    modality_id INTEGER,
    modality_name VARCHAR(100),
    procurement_object TEXT,
    additional_info TEXT,
    
    -- Valores
    estimated_total_value DECIMAL(15,2),
    awarded_total_value DECIMAL(15,2),
    
    -- Prazos
    proposal_opening_date TIMESTAMP,
    proposal_closing_date TIMESTAMP,
    publication_date TIMESTAMP,
    
    -- Status
    situation VARCHAR(50),
    
    -- Dados Completos da API
    raw_data JSONB,
    
    -- Sincronização
    last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_imported BOOLEAN DEFAULT false,
    imported_quotation_id UUID REFERENCES quotations(id),
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para pncp_opportunities
CREATE INDEX idx_pncp_opportunities_contracting_id ON pncp_opportunities(pncp_contracting_id);
CREATE INDEX idx_pncp_opportunities_uf ON pncp_opportunities(uf);
CREATE INDEX idx_pncp_opportunities_situation ON pncp_opportunities(situation);
CREATE INDEX idx_pncp_opportunities_sync ON pncp_opportunities(last_sync_at);
CREATE INDEX idx_pncp_opportunities_imported ON pncp_opportunities(is_imported);

-- =====================================================
-- 5. SISTEMA DE NOTIFICAÇÕES
-- =====================================================

-- 5.1 Notifications (Notificações Multi-canal)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Conteúdo
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    
    -- Relacionamento Polimórfico
    related_entity_type VARCHAR(50), -- 'quotation', 'proposal', 'supplier'
    related_entity_id UUID,
    
    -- Controle de Leitura
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    
    -- Canais de Entrega
    channels JSONB DEFAULT '["web"]', -- ['web', 'email', 'whatsapp', 'push']
    sent_email BOOLEAN DEFAULT false,
    sent_whatsapp BOOLEAN DEFAULT false,
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_organization ON notifications(organization_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_related ON notifications(related_entity_type, related_entity_id);

-- =====================================================
-- 6. SISTEMA DE AUDITORIA
-- =====================================================

-- 6.1 Audit Logs (Logs de Auditoria Imutável)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Entidade Afetada
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE
    
    -- Dados da Mudança
    old_values JSONB,
    new_values JSONB,
    changes JSONB, -- Campos específicos que mudaram
    
    -- Contexto da Ação
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    ip_address INET,
    user_agent TEXT,
    
    -- Auditoria (Imutável)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para audit_logs
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- 7. API CLIENTS (Clientes de API Externa)
-- =====================================================

-- 7.1 API Clients (Clientes de API com autenticação por chave)
CREATE TABLE api_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Identificação
    name VARCHAR(255) NOT NULL,
    api_key VARCHAR(64) UNIQUE NOT NULL,
    
    -- Configurações
    permissions JSONB DEFAULT '{}',
    rate_limit_per_minute INTEGER DEFAULT 60,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    
    -- Auditoria
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para api_clients
CREATE INDEX idx_api_clients_api_key ON api_clients(api_key);
CREATE INDEX idx_api_clients_organization ON api_clients(organization_id);

-- =====================================================
-- 8. FUNÇÕES AUXILIARES
-- =====================================================

-- 8.1 Função para gerar número sequencial de cotação
CREATE OR REPLACE FUNCTION generate_quotation_number(org_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    current_year INTEGER;
    sequence_number INTEGER;
    quotation_number VARCHAR(50);
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Buscar o próximo número sequencial para o ano atual
    SELECT COALESCE(MAX(
        CAST(
            SPLIT_PART(
                SPLIT_PART(number, '-', 3), 
                '', 1
            ) AS INTEGER
        )
    ), 0) + 1
    INTO sequence_number
    FROM quotations 
    WHERE organization_id = org_id 
    AND number LIKE 'COT-' || current_year || '-%';
    
    -- Formar o número da cotação
    quotation_number := 'COT-' || current_year || '-' || LPAD(sequence_number::TEXT, 3, '0');
    
    RETURN quotation_number;
END;
$$ LANGUAGE plpgsql;

-- 8.2 Função para atualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. TRIGGERS
-- =====================================================

-- 9.1 Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at 
    BEFORE UPDATE ON suppliers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotations_updated_at 
    BEFORE UPDATE ON quotations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotation_items_updated_at 
    BEFORE UPDATE ON quotation_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_proposals_updated_at 
    BEFORE UPDATE ON supplier_proposals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposal_items_updated_at 
    BEFORE UPDATE ON proposal_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pncp_opportunities_updated_at 
    BEFORE UPDATE ON pncp_opportunities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_clients_updated_at 
    BEFORE UPDATE ON api_clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9.2 Trigger para gerar número de cotação automaticamente
CREATE OR REPLACE FUNCTION auto_generate_quotation_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.number IS NULL OR NEW.number = '' THEN
        NEW.number := generate_quotation_number(NEW.organization_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_quotation_number 
    BEFORE INSERT ON quotations 
    FOR EACH ROW EXECUTE FUNCTION auto_generate_quotation_number();

-- 9.3 Trigger para audit log automático
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    user_id_val UUID;
    org_id_val UUID;
BEGIN
    -- Tentar extrair user_id e organization_id do contexto
    user_id_val := COALESCE(
        NULLIF(current_setting('app.current_user_id', true), ''),
        COALESCE(NEW.created_by, NEW.updated_by, OLD.updated_by)
    )::UUID;
    
    org_id_val := COALESCE(
        NULLIF(current_setting('app.current_org_id', true), ''),
        COALESCE(NEW.organization_id, OLD.organization_id)
    )::UUID;
    
    INSERT INTO audit_logs (
        entity_type,
        entity_id,
        action,
        old_values,
        new_values,
        user_id,
        organization_id,
        ip_address,
        user_agent
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
        user_id_val,
        org_id_val,
        NULLIF(current_setting('app.client_ip', true), '')::INET,
        NULLIF(current_setting('app.user_agent', true), '')
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar audit log às tabelas principais
CREATE TRIGGER audit_organizations
    AFTER INSERT OR UPDATE OR DELETE ON organizations
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_suppliers
    AFTER INSERT OR UPDATE OR DELETE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_quotations
    AFTER INSERT OR UPDATE OR DELETE ON quotations
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_supplier_proposals
    AFTER INSERT OR UPDATE OR DELETE ON supplier_proposals
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- =====================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pncp_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_clients ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários autenticados
-- Organizations: usuários só veem sua própria organização
CREATE POLICY "Users can view their own organization" ON organizations
    FOR SELECT USING (
        id = (
            SELECT organization_id FROM users WHERE supabase_uid = auth.uid()
        )
    );

-- Users: usuários só veem usuários da mesma organização
CREATE POLICY "Users can view users from same organization" ON users
    FOR SELECT USING (
        organization_id = (
            SELECT organization_id FROM users WHERE supabase_uid = auth.uid()
        )
    );

-- Suppliers: usuários só veem fornecedores da sua organização
CREATE POLICY "Users can view suppliers from their organization" ON suppliers
    FOR SELECT USING (
        organization_id = (
            SELECT organization_id FROM users WHERE supabase_uid = auth.uid()
        )
    );

-- Quotations: usuários só veem cotações da sua organização
CREATE POLICY "Users can view quotations from their organization" ON quotations
    FOR SELECT USING (
        organization_id = (
            SELECT organization_id FROM users WHERE supabase_uid = auth.uid()
        )
    );

-- Quotation Items: baseado na organização da cotação
CREATE POLICY "Users can view quotation items from their organization" ON quotation_items
    FOR SELECT USING (
        quotation_id IN (
            SELECT id FROM quotations WHERE organization_id = (
                SELECT organization_id FROM users WHERE supabase_uid = auth.uid()
            )
        )
    );

-- Supplier Proposals: baseado na organização da cotação
CREATE POLICY "Users can view proposals from their organization" ON supplier_proposals
    FOR SELECT USING (
        quotation_id IN (
            SELECT id FROM quotations WHERE organization_id = (
                SELECT organization_id FROM users WHERE supabase_uid = auth.uid()
            )
        )
    );

-- Notifications: usuários só veem suas próprias notificações
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (
        user_id = (
            SELECT id FROM users WHERE supabase_uid = auth.uid()
        )
    );

-- Audit Logs: usuários só veem logs da sua organização
CREATE POLICY "Users can view audit logs from their organization" ON audit_logs
    FOR SELECT USING (
        organization_id = (
            SELECT organization_id FROM users WHERE supabase_uid = auth.uid()
        )
    );

-- =====================================================
-- 11. DADOS INICIAIS (SEEDS)
-- =====================================================

-- Inserir organização de exemplo para desenvolvimento
INSERT INTO organizations (
    id,
    name,
    cnpj,
    email,
    subscription_plan,
    status
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Empresa Demo - CotAi Edge',
    '12.345.678/0001-90',
    'demo@cotai-edge.com',
    'premium',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 12. COMENTÁRIOS DE DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE organizations IS 'Organizações/empresas que utilizam o sistema';
COMMENT ON TABLE users IS 'Usuários do sistema integrados com Supabase Auth';
COMMENT ON TABLE suppliers IS 'Fornecedores cadastrados pelas organizações';
COMMENT ON TABLE quotations IS 'Cotações/licitações gerenciadas no sistema';
COMMENT ON TABLE quotation_items IS 'Itens específicos de cada cotação';
COMMENT ON TABLE quotation_invitations IS 'Convites enviados aos fornecedores';
COMMENT ON TABLE supplier_proposals IS 'Propostas enviadas pelos fornecedores';
COMMENT ON TABLE proposal_items IS 'Itens das propostas dos fornecedores';
COMMENT ON TABLE pncp_opportunities IS 'Oportunidades sincronizadas do Portal Nacional de Contratações Públicas';
COMMENT ON TABLE notifications IS 'Sistema de notificações multi-canal';
COMMENT ON TABLE audit_logs IS 'Logs de auditoria imutável para compliance';
COMMENT ON TABLE api_clients IS 'Clientes de API externa com autenticação por chave';

-- =====================================================
-- FIM DO SCHEMA
-- =====================================================

-- Mensagem de confirmação
SELECT 'CotAi Edge Database Schema criado com sucesso!' as status;