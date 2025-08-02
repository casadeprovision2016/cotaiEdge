-- =====================================================
-- CotAi Edge - Índices Adicionais para Performance
-- =====================================================

-- Índices otimizados para dashboard
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotations_dashboard_metrics 
ON quotations (organization_id, status) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_suppliers_dashboard_metrics 
ON suppliers (organization_id, status) 
WHERE deleted_at IS NULL AND status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_supplier_proposals_dashboard 
ON supplier_proposals (quotation_id, status);

-- Índice composto para ordenação de cotações
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotations_org_created_order 
ON quotations (organization_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- Índice composto para ordenação de fornecedores
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_suppliers_org_performance_order 
ON suppliers (organization_id, performance_score DESC) 
WHERE deleted_at IS NULL AND status = 'active';

-- Índice para atividades recentes (audit_logs)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_dashboard 
ON audit_logs (organization_id, created_at DESC);

-- Índice para PNCP opportunities ativas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pncp_opportunities_active_closing 
ON pncp_opportunities (is_active, closing_date) 
WHERE is_active = true;

-- Índice para notificações não lidas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread 
ON notifications (user_id, is_read, created_at DESC) 
WHERE is_read = false;

-- Estatísticas atualizadas para melhor plano de execução
ANALYZE quotations;
ANALYZE suppliers;
ANALYZE supplier_proposals;
ANALYZE audit_logs;
ANALYZE pncp_opportunities;
ANALYZE notifications;

-- Comentários sobre os índices
COMMENT ON INDEX idx_quotations_dashboard_metrics IS 'Índice otimizado para métricas do dashboard';
COMMENT ON INDEX idx_suppliers_dashboard_metrics IS 'Índice otimizado para contagem de fornecedores ativos';
COMMENT ON INDEX idx_quotations_org_created_order IS 'Índice para ordenação de cotações por data de criação';
COMMENT ON INDEX idx_suppliers_org_performance_order IS 'Índice para ordenação de fornecedores por performance';
COMMENT ON INDEX idx_audit_logs_dashboard IS 'Índice para busca de atividades recentes no dashboard';