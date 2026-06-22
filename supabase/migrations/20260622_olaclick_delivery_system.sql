-- MIGRATION: V46 - REAL-TIME DELIVERY DISPATCH & TRACKING ECOSYSTEM
BEGIN;

-- 1. Create delivery_dispatches table
CREATE TABLE IF NOT EXISTS public.delivery_dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES public.delivery_drivers(id) ON DELETE CASCADE,
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'timeout'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create driver_locations table for historical GPS tracking
CREATE TABLE IF NOT EXISTS public.driver_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES public.delivery_drivers(id) ON DELETE CASCADE,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    speed DECIMAL(5,2),
    heading DECIMAL(5,2),
    is_mocked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create delivery_messages table for internal chat
CREATE TABLE IF NOT EXISTS public.delivery_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    sender_id UUID,
    sender_type VARCHAR(30) NOT NULL, -- 'customer', 'driver', 'merchant', 'dispatcher'
    message TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create delivery_events table for tracking history logs
CREATE TABLE IF NOT EXISTS public.delivery_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'dispatch_started', 'accepted', 'collected', 'arrived', 'delivered', 'rejected'
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.delivery_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_events ENABLE ROW LEVEL SECURITY;

-- 6. Set access control policies (permit read/write for all authenticated & anonymous calls for simplicity in real-time)
DROP POLICY IF EXISTS "Allow public read write on dispatches" ON public.delivery_dispatches;
CREATE POLICY "Allow public read write on dispatches" ON public.delivery_dispatches
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read write on driver locations" ON public.driver_locations;
CREATE POLICY "Allow public read write on driver locations" ON public.driver_locations
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read write on delivery messages" ON public.delivery_messages;
CREATE POLICY "Allow public read write on delivery messages" ON public.delivery_messages
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read write on delivery events" ON public.delivery_events;
CREATE POLICY "Allow public read write on delivery events" ON public.delivery_events
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 7. Add Supabase Realtime replication for these tables
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'delivery_dispatches'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_dispatches;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'delivery_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_messages;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'driver_locations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'delivery_events'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_events;
    END IF;
END $$;

ALTER TABLE public.delivery_dispatches REPLICA IDENTITY FULL;
ALTER TABLE public.delivery_messages REPLICA IDENTITY FULL;
ALTER TABLE public.driver_locations REPLICA IDENTITY FULL;
ALTER TABLE public.delivery_events REPLICA IDENTITY FULL;

COMMIT;

-- Force reload schema
NOTIFY pgrst, 'reload schema';
