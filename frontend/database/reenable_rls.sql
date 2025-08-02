-- =====================================================
-- CotAi Edge - Reabilitar RLS após testes
-- =====================================================

-- Reabilitar RLS em todas as tabelas
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

-- Aplicar otimizações RLS
\i rls_optimization.sql

SELECT 
    '✅ RLS REABILITADO COM OTIMIZAÇÕES!' as status,
    'Segurança restaurada com melhor performance' as result;