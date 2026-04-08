-- Fix RLS for public menu orders
-- Allows anonymous users (anon) to insert orders while keeping them isolated for the owners.

BEGIN;

-- 1. Pedidos
DROP POLICY IF EXISTS "Allow anonymous insert on pedidos" ON public.pedidos;
CREATE POLICY "Allow anonymous insert on pedidos" ON public.pedidos
    FOR INSERT 
    WITH CHECK (true);

-- 2. Itens Pedido
DROP POLICY IF EXISTS "Allow anonymous insert on itens_pedido" ON public.itens_pedido;
CREATE POLICY "Allow anonymous insert on itens_pedido" ON public.itens_pedido
    FOR INSERT 
    WITH CHECK (true);

-- 3. Clientes
DROP POLICY IF EXISTS "Allow anonymous insert on clientes" ON public.clientes;
CREATE POLICY "Allow anonymous insert on clientes" ON public.clientes
    FOR INSERT 
    WITH CHECK (true);

-- 4. Menu Orders (Just in case)
ALTER TABLE public.menu_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anonymous insert on menu_orders" ON public.menu_orders;
CREATE POLICY "Allow anonymous insert on menu_orders" ON public.menu_orders
    FOR INSERT 
    WITH CHECK (true);

COMMIT;

NOTIFY pgrst, 'reload schema';
