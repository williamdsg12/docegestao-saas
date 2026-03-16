-- RLS FIX: Enable Public Insert for Ordering Pipeline
-- This script allows the digital menu (public users) to create orders and clients.

-- 1. menu_orders
ALTER TABLE public.menu_orders DISABLE ROW LEVEL SECURITY;
-- OR if you prefer to keep it enabled but allow inserts:
-- CREATE POLICY "Enabling public insert for menu_orders" ON public.menu_orders FOR INSERT TO anon WITH CHECK (true);

-- 2. menu_order_items
ALTER TABLE public.menu_order_items DISABLE ROW LEVEL SECURITY;

-- 3. pedidos (Professional V3)
ALTER TABLE public.pedidos DISABLE ROW LEVEL SECURITY;

-- 4. itens_pedido (Professional V3)
ALTER TABLE public.itens_pedido DISABLE ROW LEVEL SECURITY;

-- 5. clientes (Professional CRM)
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;

-- 6. clients (Legacy CRM)
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;

-- 7. orders (Legacy V2)
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- 8. cupons (Allow public selection for validation)
ALTER TABLE public.cupons DISABLE ROW LEVEL SECURITY;

-- 9. uso_cupons
ALTER TABLE public.uso_cupons DISABLE ROW LEVEL SECURITY;

-- NOTE: Disabling RLS is the fastest way to fix the "42501" error. 
-- For a more secure approach, create specific INSERT policies for 'anon' role.
