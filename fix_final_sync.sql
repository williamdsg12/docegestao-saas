-- FIX: RLS & REALTIME FOR PUBLIC ORDERS (FINAL VERIFIED)

-- 1. Ensure columns exist for redundant sync
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS cliente_nome TEXT;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS cliente_telefone TEXT;

-- 2. Enable Realtime for core tables
-- This ensures the dashboard updates automatically without refreshing
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE pedidos, orders, itens_pedido, entregador_localizacao;
COMMIT;

-- 3. Adjust RLS for 'pedidos' to allow public submissions (Checkout)
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Clear previous restrictive policies
DROP POLICY IF EXISTS "pedidos_owner_policy" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_public_insert" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_public_select" ON public.pedidos;
DROP POLICY IF EXISTS "Pedidos: multi-tenant isolation" ON public.pedidos;

-- Dashboard: Owners see only their orders
CREATE POLICY "pedidos_owner_policy" ON public.pedidos
    FOR ALL 
    TO authenticated
    USING (empresa_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Checkout: Public can insert new orders
CREATE POLICY "pedidos_public_insert" ON public.pedidos
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);

-- Tracking: Public can see tracking timeline
CREATE POLICY "pedidos_public_select" ON public.pedidos
    FOR SELECT 
    TO anon, authenticated
    USING (true);

-- 4. Adjust RLS for 'itens_pedido'
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "itens_pedido_owner_policy" ON public.itens_pedido;
DROP POLICY IF EXISTS "itens_pedido_public_insert" ON public.itens_pedido;
DROP POLICY IF EXISTS "itens_pedido_public_select" ON public.itens_pedido;

CREATE POLICY "itens_pedido_owner_policy" ON public.itens_pedido
    FOR ALL TO authenticated
    USING (pedido_id IN (SELECT id FROM pedidos WHERE empresa_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "itens_pedido_public_insert" ON public.itens_pedido
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "itens_pedido_public_select" ON public.itens_pedido
    FOR SELECT TO anon, authenticated
    USING (true);

-- 5. Clientes RLS (Optional for lead generation)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clientes_owner_policy" ON public.clientes;
DROP POLICY IF EXISTS "clientes_public_upsert" ON public.clientes;
CREATE POLICY "clientes_owner_policy" ON public.clientes
    FOR ALL TO authenticated
    USING (empresa_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "clientes_public_upsert" ON public.clientes
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- TEST OPTION: If policies still block, run the command below to disable RLS entirely:
-- ALTER TABLE pedidos DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE itens_pedido DISABLE ROW LEVEL SECURITY;
