-- ==========================================
-- MIGRATION V15: ALIGN WITH USER REQUESTED ARCHITECTURE
-- ==========================================
-- This script ensures the database columns match the names used in 
-- the user's requested createOrder function.

BEGIN;

-- 1. ORDERS TABLE
DO $$ 
BEGIN 
    -- Ensure order_status exists (aliased to status)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='order_status') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='status') THEN
            ALTER TABLE public.orders RENAME COLUMN status TO order_status;
        ELSE
            ALTER TABLE public.orders ADD COLUMN order_status TEXT DEFAULT 'pending';
        END IF;
    END IF;

    -- Ensure payment_status exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_status') THEN
        ALTER TABLE public.orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
    END IF;

    -- Ensure subtotal exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='subtotal') THEN
        ALTER TABLE public.orders ADD COLUMN subtotal NUMERIC DEFAULT 0;
    END IF;

    -- Ensure delivery_fee exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_fee') THEN
        ALTER TABLE public.orders ADD COLUMN delivery_fee NUMERIC DEFAULT 0;
    END IF;

END $$;

-- 2. ORDER_ITEMS TABLE
DO $$ 
BEGIN 
    -- Ensure total_price exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='total_price') THEN
        ALTER TABLE public.order_items ADD COLUMN total_price NUMERIC DEFAULT 0;
    END IF;
    
    -- Ensure unit_price exists (User uses unit_price)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='unit_price') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='preco') THEN
            ALTER TABLE public.order_items RENAME COLUMN preco TO unit_price;
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='price') THEN
            ALTER TABLE public.order_items RENAME COLUMN price TO unit_price;
        ELSE
            ALTER TABLE public.order_items ADD COLUMN unit_price NUMERIC DEFAULT 0;
        END IF;
    END IF;

    -- Ensure quantity exists (User uses quantity)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='quantity') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='quantidade') THEN
            ALTER TABLE public.order_items RENAME COLUMN quantidade TO quantity;
        ELSE
            ALTER TABLE public.order_items ADD COLUMN quantity INTEGER DEFAULT 1;
        END IF;
    END IF;

END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
