-- MIGRATION: V44 - OPERATIONAL DASHBOARD CORE EXTRA SCHEMAS
BEGIN;

-- 1. Add closing amount to cash_registers if not exists
ALTER TABLE public.cash_registers ADD COLUMN IF NOT EXISTS "closedAmount" DECIMAL(12,2) DEFAULT 0.00;

-- 2. Create cash_transactions table to log Sangria / Suprimento / Cash sales
CREATE TABLE IF NOT EXISTS public.cash_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    register_id UUID NOT NULL REFERENCES public.cash_registers(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL, -- 'suprimento', 'sangria', 'venda'
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on cash_transactions
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow tenant read on cash_transactions" ON public.cash_transactions;
CREATE POLICY "Allow tenant read on cash_transactions" ON public.cash_transactions
    FOR SELECT
    TO authenticated
    USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Allow tenant write on cash_transactions" ON public.cash_transactions;
CREATE POLICY "Allow tenant write on cash_transactions" ON public.cash_transactions
    FOR ALL
    TO authenticated
    USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 3. Add dinein_enabled column to store_settings table
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS dinein_enabled BOOLEAN DEFAULT true;

-- 4. Create restaurant_environments table for table management
CREATE TABLE IF NOT EXISTS public.restaurant_environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on restaurant_environments
ALTER TABLE public.restaurant_environments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow tenant read on restaurant_environments" ON public.restaurant_environments;
CREATE POLICY "Allow tenant read on restaurant_environments" ON public.restaurant_environments
    FOR SELECT
    USING (true); -- Public read (for menu table selectors/validations)

DROP POLICY IF EXISTS "Allow tenant write on restaurant_environments" ON public.restaurant_environments;
CREATE POLICY "Allow tenant write on restaurant_environments" ON public.restaurant_environments
    FOR ALL
    TO authenticated
    USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 5. Create restaurant_tables table for table cards
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    environment_id UUID NOT NULL REFERENCES public.restaurant_environments(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    table_number VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'free', -- 'free', 'occupied', 'closing_pending'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on restaurant_tables
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow tenant read on restaurant_tables" ON public.restaurant_tables;
CREATE POLICY "Allow tenant read on restaurant_tables" ON public.restaurant_tables
    FOR SELECT
    USING (true); -- Public read (for QR code checking/routing)

DROP POLICY IF EXISTS "Allow tenant write on restaurant_tables" ON public.restaurant_tables;
CREATE POLICY "Allow tenant write on restaurant_tables" ON public.restaurant_tables
    FOR ALL
    TO authenticated
    USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

COMMIT;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
