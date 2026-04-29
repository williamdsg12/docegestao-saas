-- MIGRATION: 20260428_affiliate_pro_system.sql
-- Description: Advanced Affiliate Tracking and Conversions Engine

BEGIN;

-- 1. Extend Affiliates for Custom Slugs
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Backfill existing slugs with their referral code
UPDATE public.affiliates SET slug = code WHERE slug IS NULL;

-- 2. Affiliate Clicks Tracking
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  ip_address TEXT,
  city TEXT,
  country TEXT,
  browser TEXT,
  device TEXT,
  origin_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Detailed Commissions Ledger
CREATE TABLE IF NOT EXISTS public.affiliate_commissions_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES public.affiliate_sales(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, available, paid, cancelled
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Enable Row Level Security
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions_ledger ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies
DROP POLICY IF EXISTS "Public Create Clicks" ON public.affiliate_clicks;
CREATE POLICY "Public Create Clicks" ON public.affiliate_clicks
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Affiliates view own clicks" ON public.affiliate_clicks;
CREATE POLICY "Affiliates view own clicks" ON public.affiliate_clicks
  FOR SELECT USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Affiliates view own ledger" ON public.affiliate_commissions_ledger;
CREATE POLICY "Affiliates view own ledger" ON public.affiliate_commissions_ledger
  FOR SELECT USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

-- Realtime tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_clicks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_commissions_ledger;

COMMIT;
