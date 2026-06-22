-- MIGRATION: V42 - CASH REGISTER CORE SETUP
BEGIN;

-- 1. Create cash_registers table
CREATE TABLE IF NOT EXISTS public.cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'closed', -- 'open', 'closed'
    "openedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "closedAt" TIMESTAMP WITH TIME ZONE,
    "initialAmount" DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS (Row Level Security)
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;

-- 3. Set RLS access control policies
DROP POLICY IF EXISTS "Allow tenant read on cash_registers" ON public.cash_registers;
CREATE POLICY "Allow tenant read on cash_registers" ON public.cash_registers
    FOR SELECT
    TO authenticated
    USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Allow tenant write on cash_registers" ON public.cash_registers;
CREATE POLICY "Allow tenant write on cash_registers" ON public.cash_registers
    FOR ALL
    TO authenticated
    USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

COMMIT;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
