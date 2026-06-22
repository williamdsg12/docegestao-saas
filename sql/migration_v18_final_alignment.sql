-- ==========================================
-- MIGRATION V18: FINAL SCHEMA ALIGNMENT
-- ==========================================
-- This script ensures all tables have the correct standardized columns
-- to support the create_complete_order RPC and the application logic.

BEGIN;

-- 1. Align Orders Table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='notes') THEN
        ALTER TABLE public.orders ADD COLUMN notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='order_status') THEN
        ALTER TABLE public.orders ADD COLUMN order_status TEXT DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='order_type') THEN
        ALTER TABLE public.orders ADD COLUMN order_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_fee') THEN
        ALTER TABLE public.orders ADD COLUMN delivery_fee NUMERIC(10,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='discount') THEN
        ALTER TABLE public.orders ADD COLUMN discount NUMERIC(10,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='subtotal') THEN
        ALTER TABLE public.orders ADD COLUMN subtotal NUMERIC(10,2) DEFAULT 0;
    END IF;
END $$;

-- 2. Align Order Items Table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='product_id') THEN
        ALTER TABLE public.order_items ADD COLUMN product_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='variation') THEN
        ALTER TABLE public.order_items ADD COLUMN variation JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='extras') THEN
        ALTER TABLE public.order_items ADD COLUMN extras JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='observation') THEN
        ALTER TABLE public.order_items ADD COLUMN observation TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='quantity') THEN
        ALTER TABLE public.order_items ADD COLUMN quantity INTEGER DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='unit_price') THEN
        ALTER TABLE public.order_items ADD COLUMN unit_price NUMERIC(10,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='total_price') THEN
        ALTER TABLE public.order_items ADD COLUMN total_price NUMERIC(10,2) DEFAULT 0;
    END IF;
END $$;

-- 3. Align Payments Table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='tenant_id') THEN
        ALTER TABLE public.payments ADD COLUMN tenant_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='method') THEN
        ALTER TABLE public.payments ADD COLUMN method TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='status') THEN
        ALTER TABLE public.payments ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='amount') THEN
        ALTER TABLE public.payments ADD COLUMN amount NUMERIC(10,2) DEFAULT 0;
    END IF;
END $$;

-- 4. Align Payment Cash Table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_cash' AND column_name='needs_change') THEN
        ALTER TABLE public.payment_cash ADD COLUMN needs_change BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_cash' AND column_name='change_for') THEN
        ALTER TABLE public.payment_cash ADD COLUMN change_for NUMERIC(10,2) DEFAULT 0;
    END IF;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
