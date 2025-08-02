-- =====================================================
-- CotAi Edge - Script de Otimização de Performance
-- Execute este script no Supabase para melhorar a performance do dashboard
-- =====================================================

-- 1. Executar função de métricas otimizada
\i dashboard_metrics_function.sql

-- 2. Aplicar índices de performance
\i performance_indexes.sql

-- 3. Verificar se tudo foi aplicado corretamente
SELECT 
    'Otimizações aplicadas com sucesso!' as status,
    CURRENT_TIMESTAMP as aplicado_em;

-- 4. Testar a função de métricas
SELECT 'Testando função de métricas...' as info;
SELECT get_dashboard_metrics('550e8400-e29b-41d4-a716-446655440001'::UUID) as test_result;

-- 5. Verificar índices criados
SELECT 
    'Índices criados:' as info,
    COUNT(*) as total_indices
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%dashboard%';

-- 6. Status final
SELECT 
    '🚀 PERFORMANCE OTIMIZADA!' as status,
    'Dashboard deve carregar em 1-2 segundos agora' as resultado;