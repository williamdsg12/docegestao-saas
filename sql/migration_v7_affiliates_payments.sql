-- ==========================================
-- MIGRATION V7: AFFILIATES, PAYMENTS & WHITE-LABEL
-- ==========================================

BEGIN;

-- 1. EXTEND TENANTS WITH BRANDING
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS domain TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#ec4899'; -- default pink
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#1e293b'; -- default slate

-- 2. PAYMENTS TABLE (English standard)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, cancelled
  payment_method TEXT, -- pix, card
  qr_code TEXT, -- PIX copy-paste code
  qr_code_base64 TEXT, -- PIX image
  external_id TEXT, -- Mercado Pago ID
  ticket_url TEXT, -- Mercado Pago payment link
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. AFFILIATES
CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  commission_percentage NUMERIC DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. AFFILIATE SALES
CREATE TABLE IF NOT EXISTS public.affiliate_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE, -- The new tenant registered via ref
  amount NUMERIC NOT NULL,
  commission NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. UPDATE PROFILES FOR AFFILIATE TRACKING
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL;

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_sales ENABLE ROW LEVEL SECURITY;

-- Payments Policies
DROP POLICY IF EXISTS "Tenant Isolation Payments" ON public.payments;
CREATE POLICY "Tenant Isolation Payments" ON public.payments 
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Public Create Payments" ON public.payments;
CREATE POLICY "Public Create Payments" ON public.payments 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Payments" ON public.payments;
CREATE POLICY "Public Read Payments" ON public.payments 
  FOR SELECT USING (true); -- Customers need to read their payment status

-- Affiliates Policies
DROP POLICY IF EXISTS "Affiliate View Own" ON public.affiliates;
CREATE POLICY "Affiliate View Own" ON public.affiliates 
  FOR SELECT USING (user_id = auth.uid());

-- Affiliate Sales Policies
DROP POLICY IF EXISTS "Affiliate View Own Sales" ON public.affiliate_sales;
CREATE POLICY "Affiliate View Own Sales" ON public.affiliate_sales 
  FOR SELECT USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

-- 7. ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;

COMMIT;
