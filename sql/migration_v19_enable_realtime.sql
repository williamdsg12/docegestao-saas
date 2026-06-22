-- ENABLE REALTIME FOR ORDERS
-- This is critical for the dashboard to show orders instantly
BEGIN;

-- 1. Ensure the publication exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- 2. Add tables to the publication
-- We use 'public.orders' to be explicit
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;

-- 3. Set REPLICA IDENTITY to FULL for these tables 
-- This ensures all columns are available in the realtime payload
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;

COMMIT;
