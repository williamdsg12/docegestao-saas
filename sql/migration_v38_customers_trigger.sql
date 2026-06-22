-- =====================================================================
-- MIGRATION V38: AUTOMATIC CUSTOMERS TELEFONE_NORMALIZADO TRIGGER
-- =====================================================================

BEGIN;

-- 1. Create trigger function to normalize phone number BEFORE INSERT OR UPDATE
CREATE OR REPLACE FUNCTION public.trg_populate_telefone_normalizado()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize NEW.phone using the immutable public.normalize_phone function
  NEW.telefone_normalizado := public.normalize_phone(NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Drop trigger if it exists
DROP TRIGGER IF EXISTS trg_customers_normalize_phone ON public.customers;

-- 3. Bind trigger to public.customers table for BEFORE INSERT OR UPDATE
CREATE TRIGGER trg_customers_normalize_phone
BEFORE INSERT OR UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.trg_populate_telefone_normalizado();

-- 4. Perform historical cleanup/sync for any out of sync records
UPDATE public.customers 
SET telefone_normalizado = public.normalize_phone(phone)
WHERE telefone_normalizado IS NULL OR telefone_normalizado <> public.normalize_phone(phone);

COMMIT;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
