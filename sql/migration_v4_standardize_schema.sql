-- Standardize all tables to use 'company_id' instead of 'empresa_id'
-- This ensures consistency across the multi-tenant SaaS platform.

DO $$ 
BEGIN
    -- 1. Clientes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='empresa_id') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='company_id') THEN
        ALTER TABLE public.clientes RENAME COLUMN empresa_id TO company_id;
    END IF;

    -- 2. Configuracoes Delivery
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='configuracoes_delivery' AND column_name='empresa_id') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='configuracoes_delivery' AND column_name='company_id') THEN
        ALTER TABLE public.configuracoes_delivery RENAME COLUMN empresa_id TO company_id;
    END IF;

    -- 3. Impressoras
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='impressoras' AND column_name='empresa_id') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='impressoras' AND column_name='company_id') THEN
        ALTER TABLE public.impressoras RENAME COLUMN empresa_id TO company_id;
    END IF;

    -- 4. Fila Impressao
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fila_impressao' AND column_name='empresa_id') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fila_impressao' AND column_name='company_id') THEN
        ALTER TABLE public.fila_impressao RENAME COLUMN empresa_id TO company_id;
    END IF;

    -- 5. Cupons
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cupons' AND column_name='empresa_id') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cupons' AND column_name='company_id') THEN
        ALTER TABLE public.cupons RENAME COLUMN empresa_id TO company_id;
    END IF;

    -- 6. Recompensas
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recompensas' AND column_name='empresa_id') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recompensas' AND column_name='company_id') THEN
        ALTER TABLE public.recompensas RENAME COLUMN empresa_id TO company_id;
    END IF;

    -- 7. Uso Cupons
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='uso_cupons' AND column_name='empresa_id') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='uso_cupons' AND column_name='company_id') THEN
        ALTER TABLE public.uso_cupons RENAME COLUMN empresa_id TO company_id;
    END IF;

    -- 8. Historico Pontos (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='historico_pontos' AND column_name='empresa_id') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='historico_pontos' AND column_name='company_id') THEN
        ALTER TABLE public.historico_pontos RENAME COLUMN empresa_id TO company_id;
    END IF;

    -- 9. Fidelidade Clientes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fidelidade_clientes' AND column_name='empresa_id') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fidelidade_clientes' AND column_name='company_id') THEN
        ALTER TABLE public.fidelidade_clientes RENAME COLUMN empresa_id TO company_id;
    END IF;
END $$;

-- Update RLS Policies to use the new company_id column consistently
-- Note: Policies on 'pedidos' and 'entregadores' were already handled in migration_v4_rls.sql

-- Clientes RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for same company" ON public.clientes;
CREATE POLICY "Enable all for same company" ON public.clientes
    USING (company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id'))
    WITH CHECK (company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id'));

-- Cupons RLS
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for same company" ON public.cupons;
DROP POLICY IF EXISTS "cupons_owner_policy" ON public.cupons;
CREATE POLICY "cupons_owner_policy" ON public.cupons
    FOR ALL TO authenticated
    USING (company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id'))
    WITH CHECK (company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id'));

-- Recompensas RLS
ALTER TABLE public.recompensas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for same company" ON public.recompensas;
CREATE POLICY "Enable all for same company" ON public.recompensas
    FOR ALL TO authenticated
    USING (company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id'))
    WITH CHECK (company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id'));

-- Fidelidade RLS
ALTER TABLE public.fidelidade_clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for same company" ON public.fidelidade_clientes;
CREATE POLICY "Enable all for same company" ON public.fidelidade_clientes
    FOR ALL TO authenticated
    USING (company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id'))
    WITH CHECK (company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id'));

