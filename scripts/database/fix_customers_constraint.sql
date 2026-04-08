-- REPAIR: Add Unique Constraint to Customers for Upsert
-- This is required by the .upsert(..., { onConflict: 'tenant_id,phone' }) in app/checkout/page.tsx
BEGIN;

-- 1. Ensure columns exist (in case migration_v5 was skipped or failed)
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Clean up any duplicates that would prevent constraint creation
-- (Keep only the most recent record for each tenant_id/phone pair)
DELETE FROM public.customers a
USING public.customers b
WHERE a.id < b.id 
  AND a.tenant_id = b.tenant_id 
  AND a.phone = b.phone;

-- 3. Add the unique constraint
-- First drop if it exists with a different name or to be clean
DROP CONSTRAINT IF EXISTS customers_tenant_id_phone_key;

ALTER TABLE public.customers 
ADD CONSTRAINT customers_tenant_id_phone_key UNIQUE (tenant_id, phone);

COMMIT;

-- Verification:
-- SELECT conname, pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid WHERE t.relname = 'customers';
