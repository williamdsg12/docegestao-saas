-- Function to pre-calculate and cache dashboard statistics
-- This is essential for scalability as the number of orders grows (10,000+ users)

CREATE OR REPLACE FUNCTION public.refresh_dashboard_stats(p_company_id uuid)
RETURNS void AS $$
DECLARE
    v_revenue numeric;
    v_orders bigint;
    v_clients bigint;
    v_pending bigint;
    v_avg_ticket numeric;
BEGIN
    -- 1. Calculate Revenue (Sum of total_value for confirmed/completed orders this month)
    SELECT COALESCE(SUM(total_value), 0) INTO v_revenue
    FROM public.orders
    WHERE company_id = p_company_id 
    AND created_at >= date_trunc('month', now())
    AND status != 'orcamento';

    -- 2. Calculate Orders count (this month)
    SELECT COUNT(*) INTO v_orders
    FROM public.orders
    WHERE company_id = p_company_id
    AND created_at >= date_trunc('month', now());

    -- 3. Calculate Total Clients
    SELECT COUNT(*) INTO v_clients
    FROM public.clients
    WHERE company_id = p_company_id;

    -- 4. Calculate Pending Orders (Need action)
    SELECT COUNT(*) INTO v_pending
    FROM public.orders
    WHERE company_id = p_company_id
    AND status IN ('confirmado', 'producao');

    -- 5. Calculate Average Ticket
    IF v_orders > 0 THEN
        v_avg_ticket := v_revenue / v_orders;
    ELSE
        v_avg_ticket := 0;
    END IF;

    -- 6. Upsert into dashboard_stats cache
    -- Using a daily reference_date to allow historical snapshots if needed
    
    -- Revenue
    INSERT INTO public.dashboard_stats (company_id, metric_name, metric_value, reference_date, updated_at)
    VALUES (p_company_id, 'revenue_month', v_revenue, CURRENT_DATE, now())
    ON CONFLICT (company_id, metric_name, reference_date) 
    DO UPDATE SET metric_value = EXCLUDED.metric_value, updated_at = now();

    -- Orders Count
    INSERT INTO public.dashboard_stats (company_id, metric_name, metric_value, reference_date, updated_at)
    VALUES (p_company_id, 'orders_month', v_orders, CURRENT_DATE, now())
    ON CONFLICT (company_id, metric_name, reference_date) 
    DO UPDATE SET metric_value = EXCLUDED.metric_value, updated_at = now();

    -- Clients
    INSERT INTO public.dashboard_stats (company_id, metric_name, metric_value, reference_date, updated_at)
    VALUES (p_company_id, 'total_clients', v_clients, CURRENT_DATE, now())
    ON CONFLICT (company_id, metric_name, reference_date) 
    DO UPDATE SET metric_value = EXCLUDED.metric_value, updated_at = now();

    -- Pending
    INSERT INTO public.dashboard_stats (company_id, metric_name, metric_value, reference_date, updated_at)
    VALUES (p_company_id, 'pending_orders', v_pending, CURRENT_DATE, now())
    ON CONFLICT (company_id, metric_name, reference_date) 
    DO UPDATE SET metric_value = EXCLUDED.metric_value, updated_at = now();

    -- Avg Ticket
    INSERT INTO public.dashboard_stats (company_id, metric_name, metric_value, reference_date, updated_at)
    VALUES (p_company_id, 'avg_ticket', v_avg_ticket, CURRENT_DATE, now())
    ON CONFLICT (company_id, metric_name, reference_date) 
    DO UPDATE SET metric_value = EXCLUDED.metric_value, updated_at = now();

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to refresh stats automatically on order changes (optional, but good for real-time feel)
-- For high volume, we might prefer a scheduled job, but for now, let's use a trigger-aided approach
-- or just call it from the frontend when the dashboard loads.

COMMENT ON FUNCTION public.refresh_dashboard_stats IS 'Scalability: Pre-calculates and caches KPIs for the multi-tenant dashboard.';
