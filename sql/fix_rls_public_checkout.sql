-- FIX RLS FOR PUBLIC CHECKOUT (Doce Gestão v4)
-- This script allows anonymous customers to insert data during checkout.

BEGIN;

-- 1. CUSTOMERS Table (Permitir que novos clientes se cadastrem via checkout)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert on customers" ON public.customers;
CREATE POLICY "Allow public insert on customers" ON public.customers
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on customers" ON public.customers;
CREATE POLICY "Allow public select on customers" ON public.customers
    FOR SELECT 
    TO anon, authenticated
    USING (true);

-- 2. ADDRESSES Table (Permitir que clientes salvem endereços de entrega)
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert on addresses" ON public.addresses;
CREATE POLICY "Allow public insert on addresses" ON public.addresses
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);

-- 3. ORDERS Table (Permitir criação de pedidos via checkout)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert on orders" ON public.orders;
CREATE POLICY "Allow public insert on orders" ON public.orders
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);

-- 4. ORDER_ITEMS Table (Permitir inserção de itens do pedido)
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert on order_items" ON public.order_items;
CREATE POLICY "Allow public insert on order_items" ON public.order_items
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);

-- 5. CLIENTS Table (Legacy compatibility)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert on clients" ON public.clients;
CREATE POLICY "Allow public insert on clients" ON public.clients
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);

COMMIT;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
