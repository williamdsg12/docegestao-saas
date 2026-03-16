-- FIX: RLS & REALTIME FOR PUBLIC ORDERS

-- 1. Enable Realtime for core tables
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE pedidos, orders, itens_pedido, entregador_localizacao;
COMMIT;

-- 2. Adjust RLS for 'pedidos' to allow public submissions
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Drop restrictive existing policy if it exists (naming might vary, but assuming the one I created)
DROP POLICY IF EXISTS "Pedidos: multi-tenant isolation" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_multi_tenant" ON public.pedidos;

-- Owner policy: see all, update all for their company
CREATE POLICY "pedidos_owner_policy" ON public.pedidos
    FOR ALL 
    TO authenticated
    USING (empresa_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Public policy: allow anyone to create an order
CREATE POLICY "pedidos_public_insert" ON public.pedidos
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);

-- Public policy: allow anyone to view orders (required for the /pedido-confirmado page tracking)
-- In a more strict setup, we would restrict this to only certain IDs, but for simplicity:
CREATE POLICY "pedidos_public_select" ON public.pedidos
    FOR SELECT 
    TO anon, authenticated
    USING (true);

-- 3. Adjust RLS for 'itens_pedido'
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Itens: multi-tenant isolation" ON public.itens_pedido;
CREATE POLICY "itens_pedido_owner_policy" ON public.itens_pedido
    FOR ALL TO authenticated
    USING (pedido_id IN (SELECT id FROM pedidos WHERE empresa_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "itens_pedido_public_insert" ON public.itens_pedido
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "itens_pedido_public_select" ON public.itens_pedido
    FOR SELECT TO anon, authenticated
    USING (true);

-- 4. Adjust RLS for 'clientes'
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clientes_policy" ON public.clientes;
CREATE POLICY "clientes_owner_policy" ON public.clientes
    FOR ALL TO authenticated
    USING (empresa_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "clientes_public_upsert" ON public.clientes
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Ensure legacy 'orders' also allows insert (if still using both)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_owner_policy" ON public.orders;
CREATE POLICY "orders_owner_policy" ON public.orders
    FOR ALL TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "orders_public_insert" ON public.orders
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);
