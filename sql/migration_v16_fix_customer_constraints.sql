-- ==========================================
-- MIGRATION V16: FIX CUSTOMER UNIQUE CONSTRAINTS
-- ==========================================
-- This script fixes the "no unique or exclusion constraint" error
-- by adding an explicit UNIQUE CONSTRAINT to the customers table.

BEGIN;

-- 1. Ensure columns exist and have correct types
DO $$ 
BEGIN 
    -- tenant_id (ensure it's UUID)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='tenant_id') THEN
        ALTER TABLE public.customers ADD COLUMN tenant_id UUID;
    ELSE
        -- Ensure it's UUID type
        BEGIN
            ALTER TABLE public.customers ALTER COLUMN tenant_id SET DATA TYPE UUID USING tenant_id::UUID;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not cast tenant_id to UUID';
        END;
    END IF;

    -- phone (ensure it's TEXT)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='phone') THEN
        ALTER TABLE public.customers ADD COLUMN phone TEXT;
    ELSE
        ALTER TABLE public.customers ALTER COLUMN phone SET DATA TYPE TEXT;
    END IF;
END $$;

-- 2. Clean up duplicates before adding unique constraint
-- This keeps the most recently updated/created record
DELETE FROM public.customers a
WHERE EXISTS (
  SELECT 1 FROM public.customers b
  WHERE a.tenant_id = b.tenant_id 
    AND a.phone = b.phone 
    AND (a.created_at < b.created_at OR (a.created_at = b.created_at AND a.id < b.id))
);

-- 3. Add the UNIQUE constraint
-- Drop existing index if it exists to avoid conflicts with the new constraint
DROP INDEX IF EXISTS idx_customers_tenant_phone;

-- Drop existing constraint if it exists
ALTER TABLE public.customers 
DROP CONSTRAINT IF EXISTS customers_tenant_id_phone_key;

ALTER TABLE public.customers 
DROP CONSTRAINT IF EXISTS customers_tenant_phone_key;

-- Add the definitive unique constraint
ALTER TABLE public.customers 
ADD CONSTRAINT customers_tenant_phone_key UNIQUE (tenant_id, phone);

COMMIT;

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
