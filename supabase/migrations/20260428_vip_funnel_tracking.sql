-- MIGRATION: 20260428_vip_funnel_tracking.sql
-- Description: Creates the vip_interest_logs table and tracking machinery.

BEGIN;

CREATE TABLE IF NOT EXISTS public.vip_interest_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID, -- For easy join with companies/tenants
    current_plan_slug TEXT,
    click_count INT DEFAULT 1,
    page_origin TEXT,
    status TEXT DEFAULT 'pending_contact', -- pending_contact, contacted, converted, ignored
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    -- Um tenant/user não deveria ter multiplas linhas ativas, apenas incrementamos se tentarem o mesmo plan_slug.
    UNIQUE(user_id, status) 
);

-- Enable RLS
ALTER TABLE public.vip_interest_logs ENABLE ROW LEVEL SECURITY;

-- Polices
DROP POLICY IF EXISTS "Users can insert their own intent" ON public.vip_interest_logs;
CREATE POLICY "Users can insert their own intent" ON public.vip_interest_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own intent" ON public.vip_interest_logs;
CREATE POLICY "Users can view their own intent" ON public.vip_interest_logs
    FOR SELECT USING (auth.uid() = user_id);

-- RPC for incrementing clicks smartly without causing duplicate constraint failures
CREATE OR REPLACE FUNCTION upsert_vip_interest(
    p_user_id UUID, 
    p_tenant_id UUID, 
    p_current_plan_slug TEXT, 
    p_page_origin TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.vip_interest_logs (
        user_id, 
        tenant_id, 
        current_plan_slug, 
        click_count, 
        page_origin, 
        status
    )
    VALUES (
        p_user_id, 
        p_tenant_id, 
        p_current_plan_slug, 
        1, 
        p_page_origin, 
        'pending_contact'
    )
    ON CONFLICT (user_id, status)
    DO UPDATE SET 
        click_count = public.vip_interest_logs.click_count + 1,
        updated_at = now(),
        current_plan_slug = EXCLUDED.current_plan_slug;
END;
$$;

COMMIT;
