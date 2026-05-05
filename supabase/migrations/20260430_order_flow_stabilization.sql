-- Stage 1: Database Schema Alignment for Pedidos Flow
-- This migration ensures the 'orders' table is compatible with the new standardized status and type values.

BEGIN;

-- 1. Ensure columns exist and have the correct names
DO $$ 
BEGIN 
    -- Rename order_status if it's named something else, or ensure it's there
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='order_status') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='status') THEN
            ALTER TABLE public.orders RENAME COLUMN status TO order_status;
        ELSE
            ALTER TABLE public.orders ADD COLUMN order_status TEXT DEFAULT 'novo';
        END IF;
    END IF;

    -- Ensure order_type exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='order_type') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='tipo_entrega') THEN
            ALTER TABLE public.orders RENAME COLUMN tipo_entrega TO order_type;
        ELSE
            ALTER TABLE public.orders ADD COLUMN order_type TEXT DEFAULT 'balcao';
        END IF;
    END IF;
END $$;

-- 2. Migrate existing data to the new status values if necessary
UPDATE public.orders SET order_status = 'novo' WHERE order_status IN ('pending', 'waiting');
UPDATE public.orders SET order_status = 'preparo' WHERE order_status = 'em_preparo';
UPDATE public.orders SET order_status = 'finalizado' WHERE order_status IN ('entregue', 'completed');

-- 3. Migrate existing data to the new type values if necessary
UPDATE public.orders SET order_type = 'delivery' WHERE order_type = 'entrega';
UPDATE public.orders SET order_type = 'balcao' WHERE order_type = 'retirada';
UPDATE public.orders SET order_type = 'salao' WHERE order_type = 'mesa';

-- 4. Add Constraints to prevent invalid data
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
    CHECK (order_status IN ('novo', 'preparo', 'pronto', 'finalizado', 'cancelado'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_type_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_type_check 
    CHECK (order_type IN ('balcao', 'delivery', 'salao'));

COMMIT;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
