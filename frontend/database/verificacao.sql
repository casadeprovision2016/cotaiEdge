-- =====================================================
-- CotAi Edge - Verificação do Sistema
-- =====================================================

-- 1. Verificar se todas as tabelas foram criadas
SELECT 
    'Tabelas criadas:' as status,
    COUNT(*) as total_tabelas
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'organizations', 'users', 'suppliers', 'quotations', 
    'quotation_items', 'quotation_invitations', 'supplier_proposals', 
    'proposal_items', 'pncp_opportunities', 'notifications', 
    'audit_logs', 'api_clients'
);

-- 2. Verificar dados de exemplo inseridos
SELECT 
    'Dados inseridos:' as status,
    (SELECT COUNT(*) FROM organizations) as organizations,
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM suppliers) as suppliers,
    (SELECT COUNT(*) FROM quotations) as quotations,
    (SELECT COUNT(*) FROM notifications) as notifications;

-- 3. Verificar Realtime habilitado
SELECT 
    'Realtime configurado:' as status,
    COUNT(*) as tabelas_realtime
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- 4. Verificar RLS ativo
SELECT 
    'RLS ativo:' as status,
    COUNT(*) as tabelas_com_rls
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- 5. Verificar triggers criados
SELECT 
    'Triggers criados:' as status,
    COUNT(*) as total_triggers
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- 6. Testar função de geração de números
SELECT 
    'Teste geração número:' as status,
    generate_quotation_number('550e8400-e29b-41d4-a716-446655440001'::UUID) as numero_gerado;

-- 7. Verificar usuário de exemplo existe
SELECT 
    'Usuário exemplo:' as status,
    u.name,
    u.email,
    o.name as organization
FROM users u
JOIN organizations o ON u.organization_id = o.id
WHERE u.email = 'admin@techcorp.com.br'
LIMIT 1;

-- 8. Status final do sistema
SELECT 
    '🎉 SISTEMA PRONTO!' as status,
    'Database configurado com sucesso para CotAi Edge' as message,
    CURRENT_TIMESTAMP as timestamp;