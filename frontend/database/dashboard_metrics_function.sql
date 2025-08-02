-- =====================================================
-- CotAi Edge - Função Otimizada para Métricas do Dashboard
-- =====================================================

CREATE OR REPLACE FUNCTION get_dashboard_metrics(org_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalQuotations', quotations_metrics.total_quotations,
        'activeQuotations', quotations_metrics.active_quotations,
        'finalizedQuotations', quotations_metrics.finalized_quotations,
        'totalSuppliers', suppliers_metrics.total_suppliers,
        'avgResponseTime', suppliers_metrics.avg_response_time,
        'responseRate', suppliers_metrics.response_rate,
        'economyGenerated', quotations_metrics.economy_generated,
        'pendingProposals', proposals_metrics.pending_proposals,
        'pncpOpportunities', pncp_metrics.opportunities_count
    ) INTO result
    FROM (
        -- Métricas de Cotações
        SELECT 
            COUNT(*)::INT as total_quotations,
            COUNT(*) FILTER (WHERE status IN ('abertas', 'em_andamento'))::INT as active_quotations,
            COUNT(*) FILTER (WHERE status = 'finalizadas')::INT as finalized_quotations,
            ROUND((COALESCE(SUM(estimated_value) FILTER (WHERE estimated_value IS NOT NULL), 0) * 0.12) / 1000)::INT as economy_generated
        FROM quotations 
        WHERE organization_id = org_id 
        AND deleted_at IS NULL
    ) as quotations_metrics,
    (
        -- Métricas de Fornecedores
        SELECT 
            COUNT(*)::INT as total_suppliers,
            ROUND(AVG(avg_response_time_hours), 1) as avg_response_time,
            ROUND(AVG(response_rate), 1) as response_rate
        FROM suppliers 
        WHERE organization_id = org_id 
        AND status = 'active' 
        AND deleted_at IS NULL
    ) as suppliers_metrics,
    (
        -- Propostas Pendentes
        SELECT 
            COUNT(*)::INT as pending_proposals
        FROM supplier_proposals sp
        INNER JOIN quotations q ON sp.quotation_id = q.id
        WHERE q.organization_id = org_id 
        AND sp.status = 'submitted'
    ) as proposals_metrics,
    (
        -- Oportunidades PNCP Ativas
        SELECT 
            COUNT(*)::INT as opportunities_count
        FROM pncp_opportunities 
        WHERE is_active = true 
        AND closing_date >= CURRENT_TIMESTAMP
    ) as pncp_metrics;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função
COMMENT ON FUNCTION get_dashboard_metrics(UUID) IS 'Retorna métricas consolidadas do dashboard em uma única query otimizada';

-- Grant de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(UUID) TO service_role;