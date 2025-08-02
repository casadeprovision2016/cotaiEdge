-- =====================================================
-- CotAi Edge - Configuração Supabase Realtime
-- Sistema B2B para Empresas
-- =====================================================

-- =====================================================
-- 1. HABILITAR REALTIME PARA TABELAS PRINCIPAIS
-- =====================================================

-- Habilitar publicação realtime para todas as tabelas que precisam de atualizações em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE organizations;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE suppliers;
ALTER PUBLICATION supabase_realtime ADD TABLE quotations;
ALTER PUBLICATION supabase_realtime ADD TABLE quotation_items;
ALTER PUBLICATION supabase_realtime ADD TABLE quotation_invitations;
ALTER PUBLICATION supabase_realtime ADD TABLE supplier_proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE proposal_items;
ALTER PUBLICATION supabase_realtime ADD TABLE pncp_opportunities;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;

-- =====================================================
-- 2. CONFIGURAR FILTROS RLS PARA REALTIME
-- =====================================================

-- Organizations: Realtime limitado à organização do usuário
CREATE POLICY "Realtime organizations access" ON organizations
    FOR SELECT USING (
        id = (
            SELECT organization_id FROM users WHERE supabase_uid = auth.uid()
        )
    );

-- Users: Realtime para usuários da mesma organização
CREATE POLICY "Realtime users access" ON users
    FOR SELECT USING (
        organization_id = (
            SELECT organization_id FROM users WHERE supabase_uid = auth.uid()
        )
    );

-- Suppliers: Realtime para fornecedores da organização
CREATE POLICY "Realtime suppliers access" ON suppliers
    FOR SELECT USING (
        organization_id = (
            SELECT organization_id FROM users WHERE supabase_uid = auth.uid()
        )
    );

-- Quotations: Realtime para cotações da organização
CREATE POLICY "Realtime quotations access" ON quotations
    FOR SELECT USING (
        organization_id = (
            SELECT organization_id FROM users WHERE supabase_uid = auth.uid()
        )
    );

-- Quotation Items: Realtime baseado na organização da cotação
CREATE POLICY "Realtime quotation_items access" ON quotation_items
    FOR SELECT USING (
        quotation_id IN (
            SELECT id FROM quotations WHERE organization_id = (
                SELECT organization_id FROM users WHERE supabase_uid = auth.uid()
            )
        )
    );

-- Quotation Invitations: Realtime baseado na organização
CREATE POLICY "Realtime quotation_invitations access" ON quotation_invitations
    FOR SELECT USING (
        quotation_id IN (
            SELECT id FROM quotations WHERE organization_id = (
                SELECT organization_id FROM users WHERE supabase_uid = auth.uid()
            )
        )
    );

-- Supplier Proposals: Realtime baseado na organização
CREATE POLICY "Realtime supplier_proposals access" ON supplier_proposals
    FOR SELECT USING (
        quotation_id IN (
            SELECT id FROM quotations WHERE organization_id = (
                SELECT organization_id FROM users WHERE supabase_uid = auth.uid()
            )
        )
    );

-- Proposal Items: Realtime baseado na organização
CREATE POLICY "Realtime proposal_items access" ON proposal_items
    FOR SELECT USING (
        proposal_id IN (
            SELECT id FROM supplier_proposals sp 
            JOIN quotations q ON sp.quotation_id = q.id 
            WHERE q.organization_id = (
                SELECT organization_id FROM users WHERE supabase_uid = auth.uid()
            )
        )
    );

-- PNCP Opportunities: Acesso público para todas as empresas
CREATE POLICY "Realtime pncp_opportunities access" ON pncp_opportunities
    FOR SELECT USING (true);

-- Notifications: Realtime para notificações do usuário
CREATE POLICY "Realtime notifications access" ON notifications
    FOR SELECT USING (
        user_id = (
            SELECT id FROM users WHERE supabase_uid = auth.uid()
        ) OR organization_id = (
            SELECT organization_id FROM users WHERE supabase_uid = auth.uid()
        )
    );

-- Audit Logs: Realtime para logs da organização
CREATE POLICY "Realtime audit_logs access" ON audit_logs
    FOR SELECT USING (
        organization_id = (
            SELECT organization_id FROM users WHERE supabase_uid = auth.uid()
        )
    );

-- =====================================================
-- 3. TRIGGERS PARA NOTIFICAÇÕES REALTIME AUTOMÁTICAS
-- =====================================================

-- Função para enviar notificação realtime customizada
CREATE OR REPLACE FUNCTION notify_realtime_change()
RETURNS TRIGGER AS $$
DECLARE
    payload JSON;
    user_org_id UUID;
BEGIN
    -- Determinar organização afetada
    user_org_id := COALESCE(NEW.organization_id, OLD.organization_id);
    
    -- Criar payload da notificação
    payload := json_build_object(
        'table', TG_TABLE_NAME,
        'action', TG_OP,
        'organization_id', user_org_id,
        'record_id', COALESCE(NEW.id, OLD.id),
        'timestamp', EXTRACT(EPOCH FROM NOW())
    );
    
    -- Enviar notificação no canal específico da organização
    PERFORM pg_notify(
        'cotai_realtime_' || user_org_id::text,
        payload::text
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers para notificações realtime nas tabelas principais
CREATE TRIGGER notify_quotations_changes
    AFTER INSERT OR UPDATE OR DELETE ON quotations
    FOR EACH ROW EXECUTE FUNCTION notify_realtime_change();

CREATE TRIGGER notify_proposals_changes
    AFTER INSERT OR UPDATE OR DELETE ON supplier_proposals
    FOR EACH ROW EXECUTE FUNCTION notify_realtime_change();

CREATE TRIGGER notify_invitations_changes
    AFTER INSERT OR UPDATE OR DELETE ON quotation_invitations
    FOR EACH ROW EXECUTE FUNCTION notify_realtime_change();

CREATE TRIGGER notify_suppliers_changes
    AFTER INSERT OR UPDATE OR DELETE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION notify_realtime_change();

-- =====================================================
-- 4. FUNÇÕES PARA REALTIME STATUS DO KANBAN
-- =====================================================

-- Função específica para mudanças de status no Kanban
CREATE OR REPLACE FUNCTION notify_kanban_status_change()
RETURNS TRIGGER AS $$
DECLARE
    payload JSON;
BEGIN
    -- Só disparar se o status mudou
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        payload := json_build_object(
            'event', 'kanban_status_change',
            'quotation_id', NEW.id,
            'old_status', OLD.status,
            'new_status', NEW.status,
            'organization_id', NEW.organization_id,
            'updated_by', NULLIF(current_setting('app.current_user_id', true), ''),
            'timestamp', EXTRACT(EPOCH FROM NOW())
        );
        
        -- Notificar no canal específico do Kanban
        PERFORM pg_notify(
            'kanban_' || NEW.organization_id::text,
            payload::text
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger específico para mudanças de status do Kanban
CREATE TRIGGER notify_kanban_status_changes
    AFTER UPDATE ON quotations
    FOR EACH ROW EXECUTE FUNCTION notify_kanban_status_change();

-- =====================================================
-- 5. VIEWS PARA REALTIME DASHBOARD
-- =====================================================

-- View para métricas do dashboard em tempo real
CREATE OR REPLACE VIEW realtime_dashboard_metrics AS
SELECT 
    q.organization_id,
    COUNT(*) as total_quotations,
    COUNT(CASE WHEN q.status = 'abertas' THEN 1 END) as open_quotations,
    COUNT(CASE WHEN q.status = 'em_andamento' THEN 1 END) as in_progress_quotations,
    COUNT(CASE WHEN q.status = 'respondidas' THEN 1 END) as responded_quotations,
    COUNT(CASE WHEN q.status = 'finalizadas' THEN 1 END) as finalized_quotations,
    COUNT(CASE WHEN q.status = 'canceladas' THEN 1 END) as cancelled_quotations,
    COALESCE(SUM(q.estimated_value), 0) as total_estimated_value,
    COUNT(DISTINCT s.id) as total_suppliers,
    COUNT(DISTINCT sp.id) as total_proposals,
    AVG(s.performance_score) as avg_supplier_performance
FROM quotations q
LEFT JOIN suppliers s ON s.organization_id = q.organization_id
LEFT JOIN supplier_proposals sp ON sp.quotation_id = q.id
WHERE q.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY q.organization_id;

-- Habilitar realtime para a view
ALTER PUBLICATION supabase_realtime ADD TABLE realtime_dashboard_metrics;

-- =====================================================
-- 6. FUNÇÕES ESPECÍFICAS PARA INTEGRAÇÃO FRONTEND
-- =====================================================

-- Função para buscar cotações com status para o Kanban
CREATE OR REPLACE FUNCTION get_kanban_quotations(org_id UUID)
RETURNS TABLE (
    id UUID,
    number VARCHAR,
    title VARCHAR,
    status VARCHAR,
    priority VARCHAR,
    estimated_value DECIMAL,
    response_deadline TIMESTAMP,
    supplier_count BIGINT,
    proposal_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.number,
        q.title,
        q.status,
        q.priority,
        q.estimated_value,
        q.response_deadline,
        COUNT(DISTINCT qi.supplier_id) as supplier_count,
        COUNT(DISTINCT sp.id) as proposal_count
    FROM quotations q
    LEFT JOIN quotation_invitations qi ON qi.quotation_id = q.id
    LEFT JOIN supplier_proposals sp ON sp.quotation_id = q.id
    WHERE q.organization_id = org_id
    AND q.status != 'canceladas'
    GROUP BY q.id, q.number, q.title, q.status, q.priority, q.estimated_value, q.response_deadline
    ORDER BY q.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar notificações não lidas
CREATE OR REPLACE FUNCTION get_unread_notifications(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    message TEXT,
    type VARCHAR,
    related_entity_type VARCHAR,
    related_entity_id UUID,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.title,
        n.message,
        n.type,
        n.related_entity_type,
        n.related_entity_id,
        n.created_at
    FROM notifications n
    JOIN users u ON u.id = n.user_id
    WHERE u.supabase_uid = user_uuid
    AND n.is_read = false
    ORDER BY n.created_at DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. CONFIGURAÇÕES DE SEGURANÇA PARA REALTIME
-- =====================================================

-- Política para permitir apenas usuários autenticados
CREATE POLICY "Authenticated users only" ON organizations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users only" ON users
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users only" ON suppliers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users only" ON quotations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users only" ON notifications
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 8. CANAIS DE NOTIFICAÇÃO PERSONALIZADOS
-- =====================================================

-- Função para configurar canais dinâmicos por organização
CREATE OR REPLACE FUNCTION setup_organization_channels()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar canal específico para a organização quando criada
    PERFORM pg_notify(
        'organization_created',
        json_build_object(
            'organization_id', NEW.id,
            'name', NEW.name,
            'channel', 'cotai_realtime_' || NEW.id::text
        )::text
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para configurar canais automaticamente
CREATE TRIGGER setup_org_channels
    AFTER INSERT ON organizations
    FOR EACH ROW EXECUTE FUNCTION setup_organization_channels();

-- =====================================================
-- 9. LIMPEZA AUTOMÁTICA DE DADOS ANTIGOS
-- =====================================================

-- Função para limpeza automática de logs antigos (manter últimos 6 meses)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM audit_logs 
    WHERE created_at < CURRENT_DATE - INTERVAL '6 months';
    
    -- Log da limpeza
    INSERT INTO audit_logs (
        entity_type,
        entity_id,
        action,
        new_values
    ) VALUES (
        'system',
        gen_random_uuid(),
        'CLEANUP',
        json_build_object('cleaned_at', CURRENT_TIMESTAMP, 'type', 'audit_logs')
    );
END;
$$ LANGUAGE plpgsql;

-- Agendar limpeza automática (executar mensalmente via cron job externo)
-- 0 2 1 * * psql -d database -c "SELECT cleanup_old_audit_logs();"

-- =====================================================
-- 10. VERIFICAÇÕES DE SAÚDE DO SISTEMA
-- =====================================================

-- Função para verificar saúde do sistema realtime
CREATE OR REPLACE FUNCTION system_health_check()
RETURNS TABLE (
    component VARCHAR,
    status VARCHAR,
    details JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'database'::VARCHAR as component,
        'healthy'::VARCHAR as status,
        json_build_object(
            'total_organizations', (SELECT COUNT(*) FROM organizations),
            'total_users', (SELECT COUNT(*) FROM users),
            'total_quotations', (SELECT COUNT(*) FROM quotations),
            'realtime_enabled', true,
            'last_check', CURRENT_TIMESTAMP
        )::JSONB as details
    
    UNION ALL
    
    SELECT 
        'quotations_flow'::VARCHAR as component,
        CASE 
            WHEN COUNT(*) > 0 THEN 'active'::VARCHAR
            ELSE 'idle'::VARCHAR
        END as status,
        json_build_object(
            'recent_quotations', COUNT(*),
            'avg_processing_time_hours', COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600), 0)
        )::JSONB as details
    FROM quotations 
    WHERE created_at >= CURRENT_DATE - INTERVAL '24 hours'
    
    UNION ALL
    
    SELECT 
        'suppliers_engagement'::VARCHAR as component,
        'healthy'::VARCHAR as status,
        json_build_object(
            'active_suppliers', COUNT(*),
            'avg_performance_score', COALESCE(AVG(performance_score), 0)
        )::JSONB as details
    FROM suppliers 
    WHERE status = 'active';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIM DA CONFIGURAÇÃO REALTIME
-- =====================================================

SELECT 'Configuração Supabase Realtime criada com sucesso!' as status;