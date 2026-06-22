-- MIGRATION: V21 - REALTIME DELIVERY GPS TRACKING SYSTEM

BEGIN;

-- 1. Create delivery_tracking table
CREATE TABLE IF NOT EXISTS public.delivery_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_person_id UUID REFERENCES public.entregadores(id) ON DELETE CASCADE,
    order_id UUID UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;

-- 3. Define Public RLS Policies for Anon and Authenticated Users
DROP POLICY IF EXISTS "Allow public select on delivery_tracking" ON public.delivery_tracking;
CREATE POLICY "Allow public select on delivery_tracking" ON public.delivery_tracking
    FOR SELECT 
    TO anon, authenticated 
    USING (true);

DROP POLICY IF EXISTS "Allow public insert on delivery_tracking" ON public.delivery_tracking;
CREATE POLICY "Allow public insert on delivery_tracking" ON public.delivery_tracking
    FOR INSERT 
    TO anon, authenticated 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on delivery_tracking" ON public.delivery_tracking;
CREATE POLICY "Allow public update on delivery_tracking" ON public.delivery_tracking
    FOR UPDATE 
    TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

-- 4. Enable Supabase Realtime replication on delivery_tracking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'delivery_tracking'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_tracking;
    END IF;
END $$;

ALTER TABLE public.delivery_tracking REPLICA IDENTITY FULL;

COMMIT;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
