-- FINAL RADIANT FIX: ELIMINATE ALL 'empresa_id' GHOSTS
-- This script ensures complete synchronization of all tables, policies, and triggers.

BEGIN;

-- 0. CLEANUP PROBLEM POLICIES ON 'pedidos' FIRST
-- These are the most likely cause of the "schema cache" error
DROP POLICY IF EXISTS "Pedidos: multi-tenant isolation" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_owner_policy" ON public.pedidos;
DROP POLICY IF EXISTS "Enable all for same company" ON public.pedidos;

-- 1. RENAME COLUMNS (IDEMPOTENT & RESILIENT)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name = 'empresa_id'
    ) LOOP
        -- Check if 'company_id' already exists in the same table
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = r.table_name 
            AND column_name = 'company_id'
        ) THEN
            -- If both exist, sync data from the old one before dropping it
            EXECUTE format('UPDATE public.%I SET company_id = empresa_id WHERE company_id IS NULL', r.table_name);
            EXECUTE format('ALTER TABLE public.%I DROP COLUMN empresa_id CASCADE', r.table_name);
        ELSE
            -- Rename normally
            EXECUTE format('ALTER TABLE public.%I RENAME COLUMN empresa_id TO company_id', r.table_name);
        END IF;
    END LOOP;
END $$;

-- 2. RE-ENABLE RLS AND APPLY UNIVERSAL POLICIES
-- We define a standard policy pattern for all tables with company_id
DO $$ 
DECLARE
    t_name TEXT;
BEGIN
    FOR t_name IN (
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name = 'company_id'
    ) LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t_name);
        
        -- Drop pattern-based policies if they exist (to avoid collisions)
        EXECUTE format('DROP POLICY IF EXISTS "multi_tenant_isolation_policy" ON public.%I', t_name);
        EXECUTE format('DROP POLICY IF EXISTS "Enable all for same company" ON public.%I', t_name);
        
        -- Create the universal policy
        EXECUTE format('CREATE POLICY "multi_tenant_isolation_policy" ON public.%I FOR ALL USING (company_id::text = (auth.jwt() -> ''user_metadata'' ->> ''company_id''))', t_name);
    END LOOP;
END $$;

-- 3. FIX SPECIFIC TABLE POLICIES (That need manual logic)

-- Itens Pedido (Isolated by its parent pedido_id)
DROP POLICY IF EXISTS "itens_pedido_owner_policy" ON public.itens_pedido;
CREATE POLICY "itens_pedido_owner_policy" ON public.itens_pedido
    FOR ALL USING (pedido_id IN (SELECT id FROM pedidos)); -- Simple check since pedidos is already filtered

-- GPS Tracking (Isolated by its parent entregador_id)
DROP POLICY IF EXISTS "GPS: multi-tenant isolation" ON public.entregador_localizacao;
CREATE POLICY "GPS: multi-tenant isolation" ON public.entregador_localizacao
    FOR ALL USING (entregador_id IN (SELECT id FROM entregadores));

-- 4. UPDATE FUNCTIONS & TRIGGERS

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
    IF NEW.status = 'entregue' AND (OLD.status IS NULL OR OLD.status != 'entregue') THEN
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

COMMIT;

-- FINAL STEP: Inform Supabase to reload cache
NOTIFY pgrst, 'reload schema';
