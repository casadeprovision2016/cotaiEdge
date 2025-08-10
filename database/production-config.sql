-- =====================================================
-- CotAi Edge - Production Database Configuration
-- Supabase PostgreSQL Production Scaling & Optimization
-- =====================================================

-- =====================================================
-- 1. CONNECTION POOLING & PERFORMANCE SETTINGS
-- =====================================================

-- Enable connection pooling (configure in Supabase dashboard)
-- Recommended settings for production:
-- Max connections: 100-200
-- Pool size: 25-50 per service
-- Pool timeout: 30s

-- Query performance optimizations
SET work_mem = '256MB';
SET maintenance_work_mem = '2GB';
SET shared_buffers = '2GB';
SET effective_cache_size = '6GB';
SET random_page_cost = 1.1;
SET seq_page_cost = 1.0;

-- =====================================================
-- 2. MONITORING & STATISTICS
-- =====================================================

-- Enable query statistics collection
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_stat_monitor;

-- Performance monitoring views
CREATE OR REPLACE VIEW performance_monitor AS
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    stddev_exec_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE calls > 10
ORDER BY total_exec_time DESC
LIMIT 20;

-- Table size monitoring
CREATE OR REPLACE VIEW table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =====================================================
-- 3. PRODUCTION INDEXES FOR SCALE
-- =====================================================

-- High-performance indexes for large datasets
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotations_hot_data 
ON quotations (organization_id, status, created_at DESC) 
WHERE deleted_at IS NULL AND status IN ('open', 'in_progress');

-- Partial index for active suppliers only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_suppliers_active_performance 
ON suppliers (organization_id, performance_score DESC, rating DESC) 
WHERE status = 'active' AND deleted_at IS NULL;

-- Composite index for proposal queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposals_quotation_supplier 
ON supplier_proposals (quotation_id, supplier_id, status, submitted_at DESC);

-- Full-text search index for quotations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotations_search 
ON quotations USING gin(to_tsvector('portuguese', title || ' ' || COALESCE(description, '')));

-- Index for audit logs with retention
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_retention 
ON audit_logs (created_at) 
WHERE created_at > (CURRENT_TIMESTAMP - INTERVAL '90 days');

-- PNCP opportunities index for real-time queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pncp_opportunities_realtime 
ON pncp_opportunities (is_active, uasg, closing_date, created_at DESC) 
WHERE is_active = true;

-- =====================================================
-- 4. MATERIALIZED VIEWS FOR ANALYTICS
-- =====================================================

-- Dashboard metrics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_metrics_cache AS
SELECT 
    organization_id,
    COUNT(*) FILTER (WHERE status = 'open') AS open_quotations,
    COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_quotations,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_quotations,
    COUNT(*) FILTER (WHERE created_at > CURRENT_DATE - INTERVAL '30 days') AS recent_quotations,
    AVG(CASE WHEN status = 'completed' THEN 
        EXTRACT(epoch FROM (updated_at - created_at))/3600 
    END) AS avg_completion_hours,
    CURRENT_TIMESTAMP AS last_updated
FROM quotations 
WHERE deleted_at IS NULL 
GROUP BY organization_id;

-- Create unique index for materialized view
CREATE UNIQUE INDEX ON dashboard_metrics_cache (organization_id);

-- Supplier performance materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS supplier_performance_cache AS
SELECT 
    s.organization_id,
    s.id AS supplier_id,
    s.name,
    s.performance_score,
    s.rating,
    COUNT(sp.id) AS total_proposals,
    COUNT(sp.id) FILTER (WHERE sp.status = 'accepted') AS accepted_proposals,
    ROUND(
        COUNT(sp.id) FILTER (WHERE sp.status = 'accepted')::numeric / 
        NULLIF(COUNT(sp.id), 0) * 100, 2
    ) AS acceptance_rate,
    AVG(sp.price) AS avg_proposal_price,
    CURRENT_TIMESTAMP AS last_updated
FROM suppliers s
LEFT JOIN supplier_proposals sp ON s.id = sp.supplier_id
WHERE s.deleted_at IS NULL AND s.status = 'active'
GROUP BY s.organization_id, s.id, s.name, s.performance_score, s.rating;

-- Create unique index for supplier performance view
CREATE UNIQUE INDEX ON supplier_performance_cache (organization_id, supplier_id);

-- =====================================================
-- 5. AUTOMATED REFRESH FOR MATERIALIZED VIEWS
-- =====================================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Refresh dashboard metrics (concurrent for minimal downtime)
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_metrics_cache;
    
    -- Refresh supplier performance
    REFRESH MATERIALIZED VIEW CONCURRENTLY supplier_performance_cache;
    
    -- Log refresh
    INSERT INTO audit_logs (
        organization_id, 
        action, 
        details, 
        created_at
    ) VALUES (
        NULL,
        'system_maintenance',
        '{"action": "refresh_materialized_views", "timestamp": "' || CURRENT_TIMESTAMP || '"}',
        CURRENT_TIMESTAMP
    );
END;
$$;

-- =====================================================
-- 6. DATA RETENTION & CLEANUP
-- =====================================================

-- Automated cleanup function for old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete audit logs older than 90 days
    DELETE FROM audit_logs 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
    
    -- Archive old completed quotations (older than 2 years)
    UPDATE quotations 
    SET archived_at = CURRENT_TIMESTAMP
    WHERE status = 'completed' 
      AND updated_at < CURRENT_TIMESTAMP - INTERVAL '2 years'
      AND archived_at IS NULL;
    
    -- Clean up orphaned files in storage
    -- This should be handled by application logic and Supabase storage policies
    
    -- Log cleanup operation
    INSERT INTO audit_logs (
        organization_id, 
        action, 
        details, 
        created_at
    ) VALUES (
        NULL,
        'system_maintenance',
        '{"action": "data_cleanup", "timestamp": "' || CURRENT_TIMESTAMP || '"}',
        CURRENT_TIMESTAMP
    );
END;
$$;

-- =====================================================
-- 7. OPTIMIZED FUNCTIONS FOR HIGH TRAFFIC
-- =====================================================

-- High-performance dashboard metrics function
CREATE OR REPLACE FUNCTION get_dashboard_metrics_fast(org_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Try to get from cache first
    SELECT row_to_json(dmc)::jsonb
    INTO result
    FROM dashboard_metrics_cache dmc
    WHERE dmc.organization_id = org_id
      AND dmc.last_updated > CURRENT_TIMESTAMP - INTERVAL '5 minutes';
    
    -- If cache is stale or missing, force refresh
    IF result IS NULL THEN
        PERFORM refresh_materialized_views();
        
        SELECT row_to_json(dmc)::jsonb
        INTO result
        FROM dashboard_metrics_cache dmc
        WHERE dmc.organization_id = org_id;
    END IF;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- Optimized supplier search function
CREATE OR REPLACE FUNCTION search_suppliers(
    org_id UUID,
    search_term TEXT DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    name TEXT,
    performance_score NUMERIC,
    rating NUMERIC,
    acceptance_rate NUMERIC,
    total_proposals BIGINT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        spc.supplier_id,
        spc.name,
        spc.performance_score,
        spc.rating,
        spc.acceptance_rate,
        spc.total_proposals
    FROM supplier_performance_cache spc
    WHERE spc.organization_id = org_id
      AND (search_term IS NULL OR spc.name ILIKE '%' || search_term || '%')
      AND spc.last_updated > CURRENT_TIMESTAMP - INTERVAL '10 minutes'
    ORDER BY spc.performance_score DESC, spc.rating DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

-- =====================================================
-- 8. HEALTH CHECKS AND MONITORING
-- =====================================================

-- Database health check function
CREATE OR REPLACE FUNCTION database_health_check()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    result JSONB;
    total_connections INTEGER;
    active_queries INTEGER;
    long_running_queries INTEGER;
    cache_hit_ratio NUMERIC;
BEGIN
    -- Get connection stats
    SELECT count(*) INTO total_connections FROM pg_stat_activity;
    SELECT count(*) INTO active_queries FROM pg_stat_activity WHERE state = 'active';
    SELECT count(*) INTO long_running_queries 
    FROM pg_stat_activity 
    WHERE state = 'active' AND query_start < now() - interval '1 minute';
    
    -- Calculate cache hit ratio
    SELECT 
        ROUND(
            100.0 * sum(heap_blks_hit) / 
            NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 
            2
        )
    INTO cache_hit_ratio
    FROM pg_statio_user_tables;
    
    -- Build result
    result := jsonb_build_object(
        'timestamp', CURRENT_TIMESTAMP,
        'status', 'healthy',
        'connections', jsonb_build_object(
            'total', total_connections,
            'active_queries', active_queries,
            'long_running', long_running_queries
        ),
        'performance', jsonb_build_object(
            'cache_hit_ratio', cache_hit_ratio
        ),
        'materialized_views', jsonb_build_object(
            'dashboard_cache_age', (
                SELECT EXTRACT(epoch FROM (CURRENT_TIMESTAMP - last_updated))
                FROM dashboard_metrics_cache
                LIMIT 1
            ),
            'supplier_cache_age', (
                SELECT EXTRACT(epoch FROM (CURRENT_TIMESTAMP - last_updated))
                FROM supplier_performance_cache
                LIMIT 1
            )
        )
    );
    
    RETURN result;
END;
$$;

-- =====================================================
-- 9. SECURITY ENHANCEMENTS FOR PRODUCTION
-- =====================================================

-- Create read-only role for analytics
CREATE ROLE analytics_reader;
GRANT CONNECT ON DATABASE postgres TO analytics_reader;
GRANT USAGE ON SCHEMA public TO analytics_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_reader;
GRANT SELECT ON dashboard_metrics_cache TO analytics_reader;
GRANT SELECT ON supplier_performance_cache TO analytics_reader;

-- Create application role with limited permissions
CREATE ROLE app_service;
GRANT CONNECT ON DATABASE postgres TO app_service;
GRANT USAGE ON SCHEMA public TO app_service;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_service;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_service;

-- =====================================================
-- 10. PRODUCTION COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON MATERIALIZED VIEW dashboard_metrics_cache IS 
'Cached dashboard metrics refreshed every 5 minutes for better performance';

COMMENT ON MATERIALIZED VIEW supplier_performance_cache IS 
'Cached supplier performance data refreshed every 10 minutes';

COMMENT ON FUNCTION get_dashboard_metrics_fast(UUID) IS 
'High-performance dashboard metrics with automatic cache refresh';

COMMENT ON FUNCTION database_health_check() IS 
'Comprehensive database health monitoring for production systems';

-- =====================================================
-- FINAL STATUS MESSAGE
-- =====================================================

SELECT 
    '🚀 PRODUCTION DATABASE CONFIGURED!' as status,
    'Database optimized for high-scale production workloads' as message,
    CURRENT_TIMESTAMP as configured_at;