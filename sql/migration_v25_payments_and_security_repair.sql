-- =================================================================
-- MIGRATION V25: PAYMENTS AND TRANSACTION RLS SECURITY REPAIR
-- =================================================================

BEGIN;

-- 1. RE-CREATE RLS POLICIES FOR public.transactions
-- Ensure both company_id and tenant_id are compared to prevent access gaps
DROP POLICY IF EXISTS "Tenant Isolation Transactions" ON public.transactions;

CREATE POLICY "Tenant Isolation Transactions"
ON public.transactions
FOR ALL
TO authenticated
USING (
  tenant_id::text IN (
    SELECT tenant_id::text FROM public.profiles WHERE id = auth.uid()
    UNION
    SELECT company_id::text FROM public.profiles WHERE id = auth.uid()
  )
  OR
  company_id::text IN (
    SELECT tenant_id::text FROM public.profiles WHERE id = auth.uid()
    UNION
    SELECT company_id::text FROM public.profiles WHERE id = auth.uid()
  )
);


-- 2. RE-CREATE RLS POLICIES FOR public.financial_transactions
-- Standardize staff & merchant access to prevent zeroed UUID company_id issues
DROP POLICY IF EXISTS "Tenants can manage their own transactions" ON public.financial_transactions;

CREATE POLICY "Tenants can manage their own transactions"
ON public.financial_transactions
FOR ALL
TO authenticated
USING (
  tenant_id::text IN (
    SELECT tenant_id::text FROM public.profiles WHERE id = auth.uid()
    UNION
    SELECT company_id::text FROM public.profiles WHERE id = auth.uid()
  )
);

COMMIT;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
