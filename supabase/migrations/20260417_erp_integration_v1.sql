-- ==========================================
-- DOCE GESTÃO - ERP INTEGRATION V1
-- ==========================================

BEGIN;

-- 1. Tabela de Produções
CREATE TABLE IF NOT EXISTS public.producoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    company_id UUID, -- para compatibilidade multi-tenant
    receita_id UUID REFERENCES public.receitas(id) ON DELETE SET NULL,
    quantidade DECIMAL NOT NULL,
    custo_total DECIMAL NOT NULL DEFAULT 0,
    data_producao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usuario_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Vendas
CREATE TABLE IF NOT EXISTS public.vendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    company_id UUID,
    receita_id UUID REFERENCES public.receitas(id) ON DELETE SET NULL, -- Produto da venda é uma receita/item
    quantidade DECIMAL NOT NULL DEFAULT 1,
    valor_unitario DECIMAL NOT NULL DEFAULT 0,
    valor_total DECIMAL NOT NULL DEFAULT 0,
    custo_total DECIMAL NOT NULL DEFAULT 0, -- CMV (Custo de Mercadoria Vendida)
    lucro_total DECIMAL NOT NULL DEFAULT 0,
    cliente TEXT,
    data_venda TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usuario_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS
ALTER TABLE public.producoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de RLS
DROP POLICY IF EXISTS "Enable all for tenant productions" ON public.producoes;
CREATE POLICY "Enable all for tenant productions" ON public.producoes
    FOR ALL USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

DROP POLICY IF EXISTS "Enable all for tenant sales" ON public.vendas;
CREATE POLICY "Enable all for tenant sales" ON public.vendas
    FOR ALL USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

COMMIT;
