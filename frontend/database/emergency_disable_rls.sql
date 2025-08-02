-- =====================================================
-- CotAi Edge - MODO EMERGÊNCIA: Desabilitar RLS temporariamente
-- =====================================================
-- ⚠️ ATENÇÃO: Use apenas para debugging de performance!
-- ⚠️ NÃO USE EM PRODUÇÃO - remove segurança de dados!

-- Desabilitar RLS temporariamente para todas as tabelas
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotations DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_proposals DISABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE pncp_opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE api_clients DISABLE ROW LEVEL SECURITY;

SELECT 
    '⚠️ RLS DESABILITADO - MODO EMERGÊNCIA!' as warning,
    'Use apenas para testes de performance' as instruction,
    'Execute renable_rls.sql depois dos testes' as next_step;

-- Para reabilitar depois, execute:
-- \i reenable_rls.sql