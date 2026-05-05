-- 1. Fix Ownership for Delicias Marcucci
-- This links the profile to the company to fix RLS permissions
UPDATE public.companies 
SET owner_id = 'a4af95a2-0def-419a-afdf-bc845bdf9d23'
WHERE id = '00000000-0000-0000-0000-000000000000';

-- 2. Ensure Realtime is enabled for the orders table
-- This enables live updates in the dashboard
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'order_items'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
    END IF;
END $$;
