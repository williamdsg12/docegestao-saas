-- MIGRATION: V43 - CUSTOMER REVIEWS AND ORDERS COLUMNS SETUP
BEGIN;

-- 1. Add columns to orders table to store finalization status
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_closed BOOLEAN DEFAULT false;

-- 2. Create customer_reviews table
CREATE TABLE IF NOT EXISTS public.customer_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    suggestion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS) on customer_reviews
ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;

-- 4. Set access control policies for customer_reviews
DROP POLICY IF EXISTS "Allow tenant read on customer_reviews" ON public.customer_reviews;
CREATE POLICY "Allow tenant read on customer_reviews" ON public.customer_reviews
    FOR SELECT
    TO authenticated
    USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Allow public insert on customer_reviews" ON public.customer_reviews;
CREATE POLICY "Allow public insert on customer_reviews" ON public.customer_reviews
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 5. Create automatic order finalization trigger functions
CREATE OR REPLACE FUNCTION public.handle_order_delivery_finalization()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.order_status = 'delivered' OR NEW.order_status = 'finalizado' OR NEW.order_status = 'DELIVERED') THEN
        NEW.delivered_at := timezone('utc'::text, now());
        NEW.tracking_closed := true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_order_delivery_finalization ON public.orders;
CREATE TRIGGER trigger_order_delivery_finalization
    BEFORE UPDATE OF order_status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_delivery_finalization();

COMMIT;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
