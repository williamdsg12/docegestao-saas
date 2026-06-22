-- Update orders_type_check to include 'retirada'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_type_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_type_check 
    CHECK (order_type IN ('balcao', 'delivery', 'salao', 'retirada'));

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
