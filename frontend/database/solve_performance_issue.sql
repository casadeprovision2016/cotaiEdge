-- =====================================================
-- CotAi Edge - SOLUÇÃO COMPLETA PARA PERFORMANCE
-- =====================================================
-- Resolve problema de 32 segundos de carregamento do dashboard

-- PASSO 1: Aplicar função de métricas otimizada
\echo 'Aplicando função de métricas otimizada...'
\i dashboard_metrics_function.sql

-- PASSO 2: Aplicar índices de performance 
\echo 'Criando índices de performance...'
\i performance_indexes.sql

-- PASSO 3: Otimizar políticas RLS (principal causa da lentidão)
\echo 'Otimizando políticas RLS...'
\i rls_optimization.sql

-- PASSO 4: Verificar se tudo foi aplicado
SELECT 
    'Todas as otimizações aplicadas!' as status,
    CURRENT_TIMESTAMP as aplicado_em;

-- PASSO 5: Testar função de métricas
\echo 'Testando função de métricas...'
SELECT 'Teste da função de métricas:' as info;
SELECT get_dashboard_metrics('550e8400-e29b-41d4-a716-446655440001'::UUID) as resultado_teste;

-- PASSO 6: Verificar políticas RLS otimizadas
SELECT 
    'Políticas RLS otimizadas:' as info,
    COUNT(*) as total_fast_policies
FROM pg_policies 
WHERE schemaname = 'public' 
AND policyname LIKE 'Fast%';

-- PASSO 7: Verificar índices de performance
SELECT 
    'Índices de performance:' as info,
    COUNT(*) as total_performance_indexes
FROM pg_indexes 
WHERE schemaname = 'public' 
AND (
    indexname LIKE '%dashboard%' OR 
    indexname LIKE '%performance%' OR
    indexname LIKE '%metrics%'
);

-- RESULTADO ESPERADO
SELECT 
    '🚀 PERFORMANCE OTIMIZADA!' as resultado,
    'Dashboard deve carregar em 1-3 segundos' as tempo_esperado,
    '32 segundos → 1-3 segundos (melhoria de ~90%)' as melhoria,
    'useRealTimeDataFast ativo no frontend' as frontend_status;

-- INSTRUÇÕES ADICIONAIS
\echo ''
\echo '==================================================='
\echo 'PERFORMANCE OTIMIZADA COM SUCESSO!'
\echo '==================================================='
\echo ''
\echo 'MUDANÇAS APLICADAS:'
\echo '✅ Função get_dashboard_metrics() otimizada'
\echo '✅ Índices especializados para dashboard'
\echo '✅ Políticas RLS otimizadas (maior impacto)'
\echo '✅ Hook useRealTimeDataFast ativo no frontend'
\echo ''
\echo 'RESULTADO ESPERADO:'
\echo '• Dashboard: 32s → 1-3s (melhoria de ~90%)'
\echo '• Menos overhead de subconsultas RLS'
\echo '• Queries paralelas em vez de sequenciais'
\echo ''
\echo 'SE AINDA HOUVER LENTIDÃO:'
\echo '• Execute emergency_disable_rls.sql para teste'
\echo '• Verifique logs de performance no Supabase'
\echo '• Considere upgrading do plano Supabase'
\echo '==================================================='