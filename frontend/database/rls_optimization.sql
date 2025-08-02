-- =====================================================
-- CotAi Edge - Otimização RLS para Performance
-- =====================================================

-- PROBLEMA: Políticas RLS com subconsultas custosas executando a mesma query repetidas vezes
-- SOLUÇÃO: Função otimizada e políticas mais eficientes

-- 1. Função rápida para obter user context (com cache)
CREATE OR REPLACE FUNCTION get_user_context()
RETURNS TABLE(user_id UUID, organization_id UUID) 
LANGUAGE plpgsql
STABLE -- Importante: função estável para cache dentro da transação
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.organization_id
    FROM users u 
    WHERE u.supabase_uid = auth.uid()
    LIMIT 1;
END;
$$;

-- Grant de acesso
GRANT EXECUTE ON FUNCTION get_user_context() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_context() TO service_role;

-- 2. Dropar políticas antigas custosas
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Users can view users from same organization" ON users;
DROP POLICY IF EXISTS "Users can view suppliers from their organization" ON suppliers;
DROP POLICY IF EXISTS "Users can view quotations from their organization" ON quotations;
DROP POLICY IF EXISTS "Users can view quotation items from their organization" ON quotation_items;
DROP POLICY IF EXISTS "Users can view proposals from their organization" ON supplier_proposals;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view audit logs from their organization" ON audit_logs;

-- 3. Criar políticas otimizadas usando a função de cache
CREATE POLICY "Fast organization access" ON organizations
    FOR SELECT USING (
        id = (SELECT organization_id FROM get_user_context())
    );

CREATE POLICY "Fast users access" ON users
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM get_user_context())
    );

CREATE POLICY "Fast suppliers access" ON suppliers
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM get_user_context())
    );

CREATE POLICY "Fast quotations access" ON quotations
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM get_user_context())
    );

CREATE POLICY "Fast notifications access" ON notifications
    FOR SELECT USING (
        user_id = (SELECT user_id FROM get_user_context())
    );

CREATE POLICY "Fast audit logs access" ON audit_logs
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM get_user_context())
    );

-- 4. Políticas simples para tabelas relacionadas (sem subconsultas complexas)
CREATE POLICY "Simple quotation items access" ON quotation_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quotations q 
            WHERE q.id = quotation_items.quotation_id 
            AND q.organization_id = (SELECT organization_id FROM get_user_context())
        )
    );

CREATE POLICY "Simple proposals access" ON supplier_proposals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quotations q 
            WHERE q.id = supplier_proposals.quotation_id 
            AND q.organization_id = (SELECT organization_id FROM get_user_context())
        )
    );

-- 5. Política aberta para PNCP (dados públicos)
CREATE POLICY "Public PNCP access" ON pncp_opportunities
    FOR SELECT USING (true);

-- 6. Atualizar estatísticas para otimização de consultas
ANALYZE organizations;
ANALYZE users;
ANALYZE suppliers;
ANALYZE quotations;
ANALYZE notifications;
ANALYZE audit_logs;

-- 7. Verificar se as políticas foram aplicadas
SELECT 
    'RLS Otimizado aplicado!' as status,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public' 
AND policyname LIKE 'Fast%';

-- Comentário sobre a otimização
COMMENT ON FUNCTION get_user_context() IS 'Função otimizada para cache de contexto do usuário em políticas RLS';