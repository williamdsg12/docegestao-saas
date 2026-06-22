-- =====================================================================
-- MIGRATION V37: FIX CUSTOMERS UNIQUE CONSTRAINT FOR POSTGREST UPSERT
-- =====================================================================

BEGIN;

-- 1. Drop the partial index that PostgREST cannot use for onConflict specs
DROP INDEX IF EXISTS public.idx_customers_tenant_phone_normalized;

-- 2. Drop any legacy/conflicting unique constraints on the same columns
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS unique_tenant_phone_normalized;
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_tenant_id_phone_key;
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_tenant_id_telefone_normalizado_key;

-- 3. Create a standard (non-partial) unique constraint on (tenant_id, telefone_normalizado)
-- This allows PostgREST's upsert matching on target 'tenant_id, telefone_normalizado' to succeed
ALTER TABLE public.customers 
ADD CONSTRAINT unique_tenant_phone_normalized 
UNIQUE (tenant_id, telefone_normalizado);

COMMIT;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
