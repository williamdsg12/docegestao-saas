-- MASTER FIX: DISMANTLE LEGACY 'empresa_id' REFERENCES
-- This script replaces all occurrences of 'empresa_id' with 'company_id' in triggers, functions, and policies.

BEGIN;

-- 1. FIX TABLE: pedidos (Renaming if not already done)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pedidos' AND column_name='empresa_id') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pedidos' AND column_name='company_id') THEN
        ALTER TABLE public.pedidos RENAME COLUMN empresa_id TO company_id;
    END IF;
END $$;

-- 2. FIX TABLE: entregadores (Standardization)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='entregadores' AND column_name='empresa_id') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='entregadores' AND column_name='company_id') THEN
        ALTER TABLE public.entregadores RENAME COLUMN empresa_id TO company_id;
    END IF;
END $$;

-- 3. FIX TABLE: rotas_entrega (Standardization)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rotas_entrega' AND column_name='empresa_id') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rotas_entrega' AND column_name='company_id') THEN
        ALTER TABLE public.rotas_entrega RENAME COLUMN empresa_id TO company_id;
    END IF;
END $$;

-- 4. UPDATE FUNCTIONS (Replacing empresa_id with company_id)

-- Auto-queue printing
CREATE OR REPLACE FUNCTION public.trigger_auto_print_queue()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.fila_impressao (company_id, pedido_id)
    VALUES (NEW.company_id, NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-credit loyalty points
CREATE OR REPLACE FUNCTION public.trigger_credit_loyalty_points()
RETURNS trigger AS $$
DECLARE
    points_to_add integer;
BEGIN
    IF NEW.status = 'entregue' AND OLD.status != 'entregue' THEN
        points_to_add := FLOOR(NEW.valor_total);
        IF points_to_add > 0 THEN
            INSERT INTO public.fidelidade_clientes (company_id, cliente_id, pontos)
            VALUES (NEW.company_id, NEW.cliente_id, points_to_add)
            ON CONFLICT (company_id, cliente_id) 
            DO UPDATE SET pontos = public.fidelidade_clientes.pontos + EXCLUDED.pontos;
            
            INSERT INTO public.historico_pontos (cliente_id, pontos, tipo, pedido_id)
            VALUES (NEW.cliente_id, points_to_add, 'ganho', NEW.id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. RE-APPLY RLS POLICIES (Cleaning up any remaining empresa_id filters)

-- Pedidos RLS
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pedidos_owner_policy" ON public.pedidos;
DROP POLICY IF EXISTS "Enable all for same company" ON public.pedidos;
CREATE POLICY "pedidos_owner_policy" ON public.pedidos
    FOR ALL TO authenticated
    USING (company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id'))
    WITH CHECK (company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id'));

-- Itens Pedido RLS
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "itens_pedido_owner_policy" ON public.itens_pedido;
CREATE POLICY "itens_pedido_owner_policy" ON public.itens_pedido
    FOR ALL TO authenticated
    USING (pedido_id IN (SELECT id FROM pedidos WHERE company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id')));

-- Entregadores RLS
ALTER TABLE public.entregadores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Logistics owner policy" ON public.entregadores;
CREATE POLICY "Logistics owner policy" ON public.entregadores
    FOR ALL TO authenticated
    USING (company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id'));

-- Rotas Entrega RLS
ALTER TABLE public.rotas_entrega ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Routes owner policy" ON public.rotas_entrega;
CREATE POLICY "Routes owner policy" ON public.rotas_entrega
    FOR ALL TO authenticated
    USING (company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id'));

-- 6. INDEXES (Replacing old ones if necessary)
DROP INDEX IF EXISTS idx_pedidos_empresa;
CREATE INDEX IF NOT EXISTS idx_pedidos_company ON public.pedidos(company_id);

COMMIT;
