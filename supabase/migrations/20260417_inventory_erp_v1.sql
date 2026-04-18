-- ==========================================
-- DOCE GESTÃO - ERP INVENTORY & PRODUCTION
-- ==========================================

BEGIN;

-- 1. Standardization of 'ingredientes' (formerly 'ingredients')
-- We check if 'ingredients' exists AND 'ingredientes' does NOT exist
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'ingredients') 
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'ingredientes') THEN
        ALTER TABLE public.ingredients RENAME TO ingredientes;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.ingredientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    company_id UUID,
    nome TEXT NOT NULL,
    categoria TEXT,
    unidade_base TEXT NOT NULL DEFAULT 'g', -- g, ml, un
    estoque_atual NUMERIC(15,3) DEFAULT 0,
    estoque_minimo NUMERIC(15,3) DEFAULT 0,
    custo_medio NUMERIC(15,4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already existed under the new name
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ingredientes' AND column_name='tenant_id') THEN
        ALTER TABLE public.ingredientes ADD COLUMN tenant_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ingredientes' AND column_name='company_id') THEN
        ALTER TABLE public.ingredientes ADD COLUMN company_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ingredientes' AND column_name='unidade_base') THEN
        ALTER TABLE public.ingredientes ADD COLUMN unidade_base TEXT DEFAULT 'g';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ingredientes' AND column_name='estoque_atual') THEN
        ALTER TABLE public.ingredientes ADD COLUMN estoque_atual NUMERIC(15,3) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ingredientes' AND column_name='estoque_minimo') THEN
        ALTER TABLE public.ingredientes ADD COLUMN estoque_minimo NUMERIC(15,3) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ingredientes' AND column_name='custo_medio') THEN
        ALTER TABLE public.ingredientes ADD COLUMN custo_medio NUMERIC(15,4) DEFAULT 0;
    END IF;
END $$;

-- 2. Enhance 'receitas' table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='receitas' AND column_name='tenant_id') THEN
        ALTER TABLE public.receitas ADD COLUMN tenant_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='receitas' AND column_name='company_id') THEN
        ALTER TABLE public.receitas ADD COLUMN company_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='receitas' AND column_name='tempo_preparo') THEN
        ALTER TABLE public.receitas ADD COLUMN tempo_preparo TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='receitas' AND column_name='rendimento') THEN
        ALTER TABLE public.receitas ADD COLUMN rendimento NUMERIC(15,2) DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='receitas' AND column_name='image_url') THEN
        ALTER TABLE public.receitas ADD COLUMN image_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='receitas' AND column_name='modo_preparo') THEN
        ALTER TABLE public.receitas ADD COLUMN modo_preparo TEXT;
    END IF;
END $$;

-- 3. Normalized 'receita_ingredientes'
CREATE TABLE IF NOT EXISTS public.receita_ingredientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receita_id UUID REFERENCES public.receitas(id) ON DELETE CASCADE NOT NULL,
    ingrediente_id UUID REFERENCES public.ingredientes(id) ON DELETE CASCADE NOT NULL,
    quantidade NUMERIC(15,3) NOT NULL,
    unidade TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 'estoque_movimentacoes' (Audit History)
CREATE TABLE IF NOT EXISTS public.estoque_movimentacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    company_id UUID,
    ingrediente_id UUID REFERENCES public.ingredientes(id) ON DELETE CASCADE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste')),
    quantidade NUMERIC(15,3) NOT NULL,
    unidade TEXT NOT NULL,
    origem TEXT NOT NULL, -- compra, producao, ajuste_manual
    referencia_id UUID, -- recipe_id or order_id
    usuario_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable RLS
ALTER TABLE public.ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receita_ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_movimentacoes ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Using company_id or tenant_id (we handle both for compatibility)
DROP POLICY IF EXISTS "Insumos Isolation" ON public.ingredientes;
CREATE POLICY "Insumos Isolation" ON public.ingredientes 
    FOR ALL USING (
        COALESCE(tenant_id, company_id) = (SELECT COALESCE(tenant_id, company_id) FROM public.profiles WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Receitas Isolation" ON public.receitas;
CREATE POLICY "Receitas Isolation" ON public.receitas 
    FOR ALL USING (
        COALESCE(tenant_id, company_id) = (SELECT COALESCE(tenant_id, company_id) FROM public.profiles WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Receita Ingredientes Isolation" ON public.receita_ingredientes;
CREATE POLICY "Receita Ingredientes Isolation" ON public.receita_ingredientes 
    FOR ALL USING (
        receita_id IN (SELECT id FROM public.receitas WHERE COALESCE(tenant_id, company_id) = (SELECT COALESCE(tenant_id, company_id) FROM public.profiles WHERE id = auth.uid()))
    );

DROP POLICY IF EXISTS "Movimentacoes Isolation" ON public.estoque_movimentacoes;
CREATE POLICY "Movimentacoes Isolation" ON public.estoque_movimentacoes 
    FOR ALL USING (
        COALESCE(tenant_id, company_id) = (SELECT COALESCE(tenant_id, company_id) FROM public.profiles WHERE id = auth.uid())
    );

COMMIT;
