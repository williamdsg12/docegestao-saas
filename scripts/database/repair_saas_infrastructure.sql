-- REPAIR: Restore Missing SaaS Infrastructure (Plans, Subscriptions, Settings)
-- Standardized to 'tenant_id' to match migration_v5
BEGIN;

-- 1. Restore PLANS
CREATE TABLE IF NOT EXISTS public.plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    price numeric NOT NULL,
    interval text DEFAULT 'month',
    max_orders integer,
    max_products integer,
    max_clients integer,
    features jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Seed basic plans if empty
INSERT INTO public.plans (name, slug, price, max_orders, max_products, max_clients, features)
VALUES 
('Starter', 'starter', 19.90, 50, 20, 100, '["basic_reports", "dashboard"]'),
('Pro', 'pro', 49.90, 99999, 99999, 99999, '["unlimited_orders", "whatsapp_integration", "advanced_reports"]'),
('Business', 'business', 59.90, 99999, 99999, 99999, '["multi_user", "priority_support", "custom_branding"]')
ON CONFLICT (slug) DO NOTHING;

-- 2. Restore SUBSCRIPTIONS (using tenant_id)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    plan_id uuid REFERENCES public.plans(id),
    status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'overdue', 'canceled', 'past_due')),
    gateway text CHECK (gateway IN ('stripe', 'mercadopago', 'asaas')),
    gateway_subscription_id text,
    trial_start timestamp with time zone,
    trial_end timestamp with time zone,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Restore USER_SETTINGS
CREATE TABLE IF NOT EXISTS public.user_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    language text DEFAULT 'pt-BR',
    currency text DEFAULT 'BRL',
    timezone text DEFAULT 'America/Sao_Paulo',
    whatsapp_default text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. Compatibility View: COMPANIES -> TENANTS
-- This allows older frontend code to still work
CREATE OR REPLACE VIEW public.companies AS SELECT *, id AS company_id FROM public.tenants;

-- 5. Compatibility Column: company_id on profiles
-- Some hooks like useSubscription check for profile.company_id
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='company_id') THEN
        ALTER TABLE public.profiles ADD COLUMN company_id UUID;
    END IF;
END $$;

-- Trigger to keep company_id synced with tenant_id for legacy support
CREATE OR REPLACE FUNCTION sync_tenant_to_company() RETURNS trigger AS $$
BEGIN
    NEW.company_id := NEW.tenant_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_tenant_to_company ON public.profiles;
CREATE TRIGGER trg_sync_tenant_to_company
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE sync_tenant_to_company();

-- Sync existing profiles
UPDATE public.profiles SET company_id = tenant_id WHERE company_id IS NULL;

-- 6. RLS Setup for restored tables
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Plans are public" ON public.plans;
CREATE POLICY "Plans are public" ON public.plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Tenant Isolation Subscriptions" ON public.subscriptions;
CREATE POLICY "Tenant Isolation Subscriptions" ON public.subscriptions 
FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users manage own settings" ON public.user_settings;
CREATE POLICY "Users manage own settings" ON public.user_settings 
FOR ALL USING (user_id = auth.uid());

COMMIT;
