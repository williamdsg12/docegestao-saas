-- FIX: SCHEMA & RLS FOR PUBLIC ORDERS (V3 - FIXING FK COMPANIES)

-- 1. Ensure columns exist in 'pedidos' table
-- We map everything to the existing 'companies' table
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.companies(id);
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS cliente_id UUID;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS cliente_nome TEXT;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS cliente_telefone TEXT;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS tipo_pedido TEXT DEFAULT 'delivery';
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'novo';
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS valor_total NUMERIC DEFAULT 0;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS taxa_entrega NUMERIC DEFAULT 0;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS endereco_entrega TEXT;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 2. Ensure all columns exist in 'itens_pedido'
ALTER TABLE public.itens_pedido ADD COLUMN IF NOT EXISTS pedido_id UUID REFERENCES public.pedidos(id) ON DELETE CASCADE;
ALTER TABLE public.itens_pedido ADD COLUMN IF NOT EXISTS produto_id UUID;
ALTER TABLE public.itens_pedido ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE public.itens_pedido ADD COLUMN IF NOT EXISTS quantidade INT DEFAULT 1;
ALTER TABLE public.itens_pedido ADD COLUMN IF NOT EXISTS preco NUMERIC DEFAULT 0;

-- 3. Fix existing FKs in Logistics (if they were pointing to 'empresas')
-- Check if the columns exist and have wrong FKs
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pedidos_empresa_id_fkey') THEN
        ALTER TABLE public.pedidos DROP CONSTRAINT pedidos_empresa_id_fkey;
    END IF;
END $$;
ALTER TABLE public.pedidos ADD CONSTRAINT pedidos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.companies(id);

-- 4. Enable Realtime for core tables
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE pedidos, orders, itens_pedido, entregador_localizacao;
COMMIT;

-- 5. Adjust RLS for 'pedidos'
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pedidos_owner_policy" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_public_insert" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_public_select" ON public.pedidos;

CREATE POLICY "pedidos_owner_policy" ON public.pedidos
    FOR ALL TO authenticated
    USING (empresa_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "pedidos_public_insert" ON public.pedidos
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "pedidos_public_select" ON public.pedidos
    FOR SELECT TO anon, authenticated
    USING (true);

-- 6. Adjust RLS for 'itens_pedido'
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

-- 7. Ensure Logistics tables also point to 'companies'
ALTER TABLE public.entregadores DROP CONSTRAINT IF EXISTS entregadores_empresa_id_fkey;
ALTER TABLE public.entregadores ADD CONSTRAINT entregadores_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.rotas_entrega DROP CONSTRAINT IF EXISTS rotas_entrega_empresa_id_fkey;
ALTER TABLE public.rotas_entrega ADD CONSTRAINT rotas_entrega_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- 8. Clientes RLS
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
