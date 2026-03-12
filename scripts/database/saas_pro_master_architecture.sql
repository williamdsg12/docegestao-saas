-- DOCESGESTÃO SAAS PRO - MASTER ARCHITECTURE MIGRATION
-- Senior Architect: Multi-tenant, Scalable & Monetized

-- ==========================================
-- 1. EXTENSIONS & SCHEMA SETUP
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. CORE PLATFORM TABLES
-- ==========================================

-- Plans Table
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

-- Companies (Businesses)
-- Note: 'companies' table already exists in project, we expand it.
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='slug') THEN
        ALTER TABLE public.companies ADD COLUMN slug text UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='status') THEN
        ALTER TABLE public.companies ADD COLUMN status text DEFAULT 'active';
    END IF;
END $$;

-- Subscriptions
-- Subscriptions
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='subscriptions' AND table_schema='public') THEN
        CREATE TABLE public.subscriptions (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
            company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
            plan_id uuid REFERENCES public.plans(id),
            status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'overdue', 'canceled', 'past_due')),
            gateway text CHECK (gateway IN ('stripe', 'mercadopago')),
            gateway_subscription_id text,
            trial_start timestamp with time zone,
            trial_end timestamp with time zone,
            current_period_start timestamp with time zone,
            current_period_end timestamp with time zone,
            created_at timestamp with time zone DEFAULT now()
        );
    ELSE
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='company_id') THEN
            ALTER TABLE public.subscriptions ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Invoices
-- Invoices
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='invoices' AND table_schema='public') THEN
        CREATE TABLE public.invoices (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
            subscription_id uuid REFERENCES public.subscriptions(id),
            amount numeric NOT NULL,
            status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'canceled')),
            due_date timestamp with time zone,
            paid_at timestamp with time zone,
            gateway_invoice_id text,
            created_at timestamp with time zone DEFAULT now()
        );
    ELSE
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='company_id') THEN
            ALTER TABLE public.invoices ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- ==========================================
-- 3. CRM & MANAGEMENT
-- ==========================================

-- Clients
-- Expansion of existing clients table
CREATE TABLE IF NOT EXISTS public.client_addresses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    street text,
    number text,
    neighborhood text,
    city text,
    state text,
    zip text,
    is_main boolean DEFAULT true
);

-- ==========================================
-- 4. PRODUCTS & PRODUCTION
-- ==========================================

-- Categories
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='categories' AND table_schema='public') THEN
        CREATE TABLE public.categories (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
            name text NOT NULL,
            created_at timestamp with time zone DEFAULT now()
        );
    ELSE
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='company_id') THEN
            ALTER TABLE public.categories ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Recipe Ingredients (N:N Relationship)
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE,
    ingredient_id uuid REFERENCES public.ingredientes(id) ON DELETE CASCADE,
    quantity numeric NOT NULL,
    unit text
);

-- Product Images
CREATE TABLE IF NOT EXISTS public.product_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    url text NOT NULL,
    is_main boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- 5. ORDERS & FINANCE
-- ==========================================

-- Order Item History (Tracking status changes)
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    status text NOT NULL,
    notes text,
    changed_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now()
);

-- Expenses & Revenue (Modular Finance)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='expenses' AND table_schema='public') THEN
        CREATE TABLE public.expenses (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
            category text,
            amount numeric NOT NULL,
            description text,
            expense_date date NOT NULL,
            created_at timestamp with time zone DEFAULT now()
        );
    ELSE
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='company_id') THEN
            ALTER TABLE public.expenses ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- ==========================================
-- 6. NOTIFICATIONS & ANALYTICS
-- ==========================================

-- Notifications
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='notifications' AND table_schema='public') THEN
        CREATE TABLE public.notifications (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
            company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
            type text NOT NULL,
            title text,
            message text NOT NULL,
            read boolean DEFAULT false,
            created_at timestamp with time zone DEFAULT now()
        );
    ELSE
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='company_id') THEN
            ALTER TABLE public.notifications ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Analytics & Cached Stats (For scalability)
CREATE TABLE IF NOT EXISTS public.dashboard_stats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    metric_name text NOT NULL,
    metric_value numeric DEFAULT 0,
    reference_date date NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(company_id, metric_name, reference_date)
);

-- ==========================================
-- 7. SCALABILITY: INDICES & RLS
-- ==========================================

-- Global Multi-tenant Indices
CREATE INDEX IF NOT EXISTS idx_ingredientes_company ON public.ingredientes(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_company ON public.orders(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_company ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_company ON public.transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_stats_company ON public.dashboard_stats(company_id);

-- Date Indices for Reports
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);

-- Enable RLS on all new/modified tables
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_stats ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('plans', 'subscriptions', 'invoices', 'categories', 'expenses', 'notifications', 'dashboard_stats')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_%I" ON public.%I', t, t);
        IF t = 'plans' THEN
            EXECUTE format('CREATE POLICY "tenant_isolation_%I" ON public.%I FOR SELECT USING (true)', t, t); -- Plans are public
        ELSE
            EXECUTE format('CREATE POLICY "tenant_isolation_%I" ON public.%I FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))', t, t);
        END IF;
    END LOOP;
END $$;

-- ==========================================
-- 8. INITIAL DATA: DEFAULT PLANS
-- ==========================================
INSERT INTO public.plans (name, slug, price, max_orders, max_products, max_clients, features)
VALUES 
('Starter', 'starter', 19.90, 50, 20, 100, '["basic_reports", "dashboard"]'),
('Pro', 'pro', 49.90, 99999, 99999, 99999, '["unlimited_orders", "whatsapp_integration", "advanced_reports"]'),
('Business', 'business', 59.90, 99999, 99999, 99999, '["multi_user", "priority_support", "custom_branding"]')
ON CONFLICT (slug) DO NOTHING;
