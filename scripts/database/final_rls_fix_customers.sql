-- REPAIR: Final RLS Fix (v4 - Guests + Admins + Recursion)
-- Resolves the "new row violates row-level security policy" for guest checkouts
BEGIN;

-- 1. Security Definer Function (Bypass recursion)
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS uuid AS $$ 
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 2. Clean up Policies on Customers
DROP POLICY IF EXISTS "Public Create Customers" ON public.customers;
DROP POLICY IF EXISTS "Tenant Isolation Customers" ON public.customers;
DROP POLICY IF EXISTS "tenant_customers" ON public.customers;
DROP POLICY IF EXISTS "Tenant isolation customers" ON public.customers;

-- 3. GUEST & MEMBER POLICIES: Allow UPSERT (INSERT+UPDATE) and SELECT
-- We use FOR ALL to support .upsert() which requires finding the row first
CREATE POLICY "Public Customers Access" ON public.customers FOR ALL USING (true) WITH CHECK (tenant_id IS NOT NULL);

-- Use FOR ALL or at least INSERT for addresses/orders
CREATE POLICY "Public Addresses Access" ON public.addresses FOR ALL USING (true) WITH CHECK (tenant_id IS NOT NULL);
CREATE POLICY "Public Orders Access" ON public.orders FOR ALL USING (true) WITH CHECK (tenant_id IS NOT NULL);
CREATE POLICY "Public Order Items Access" ON public.order_items FOR ALL USING (true);

-- 5. Ensure constraint exists for upsert
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_tenant_id_phone_key;
ALTER TABLE public.customers ADD CONSTRAINT customers_tenant_id_phone_key UNIQUE (tenant_id, phone);

COMMIT;
