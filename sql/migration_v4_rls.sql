-- RLS CONSOLIDATION & SAAS INFRASTRUCTURE (Doce Gestão v4)

-- 1. Ensure all tables have company_id
DO $$ 
BEGIN 
    -- Empresas (Main tenant table)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='empresas' AND column_name='id') THEN
        -- Table created in migration_saas_logistics.sql, but we ensure structure here
        NULL;
    END IF;

    -- Pedidos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pedidos' AND column_name='company_id') THEN
        ALTER TABLE public.pedidos RENAME COLUMN empresa_id TO company_id;
    END IF;

    -- Produtos (Assuming they might be in 'produtos' or 'products')
    -- Based on research, we have 'produtos' (empty) and likely 'products' or 'menu_products'
    -- We will ensure 'produtos' is the standard
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='produtos') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='produtos' AND column_name='company_id') THEN
            ALTER TABLE public.produtos ADD COLUMN company_id UUID REFERENCES public.empresas(id);
        END IF;
    END IF;

    -- Clientes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='clientes') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='company_id') THEN
            ALTER TABLE public.clientes ADD COLUMN company_id UUID REFERENCES public.empresas(id);
        END IF;
    END IF;

    -- Entregadores
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='entregadores') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='entregadores' AND column_name='empresa_id') THEN
            ALTER TABLE public.entregadores RENAME COLUMN empresa_id TO company_id;
        END IF;
    END IF;

    -- Itens Pedido
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='itens_pedido') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='itens_pedido' AND column_name='company_id') THEN
            ALTER TABLE public.itens_pedido ADD COLUMN company_id UUID REFERENCES public.empresas(id);
        END IF;
    END IF;
END $$;

-- 2. Enable RLS on all tables
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;

-- 3. Create Multi-Tenant Isolation Policies
-- Rule: Access only if company_id matches the one in user's profile

DROP POLICY IF EXISTS "Empresas: multi-tenant isolation" ON public.empresas;
CREATE POLICY "Empresas: multi-tenant isolation" ON public.empresas
    FOR ALL USING (id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Pedidos: multi-tenant isolation" ON public.pedidos;
CREATE POLICY "Pedidos: multi-tenant isolation" ON public.pedidos
    FOR ALL USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Produtos: multi-tenant isolation" ON public.produtos;
CREATE POLICY "Produtos: multi-tenant isolation" ON public.produtos
    FOR ALL USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Clientes: multi-tenant isolation" ON public.clientes;
CREATE POLICY "Clientes: multi-tenant isolation" ON public.clientes
    FOR ALL USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Entregadores: multi-tenant isolation" ON public.entregadores;
CREATE POLICY "Entregadores: multi-tenant isolation" ON public.entregadores
    FOR ALL USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Itens Pedido: multi-tenant isolation" ON public.itens_pedido;
CREATE POLICY "Itens Pedido: multi-tenant isolation" ON public.itens_pedido
    FOR ALL USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- 4. View for convenience (Optional but helpful for debugging)
CREATE OR REPLACE VIEW public.vw_tenant_stats AS
SELECT 
    e.nome as empresa,
    (SELECT count(*) FROM pedidos p WHERE p.company_id = e.id) as total_pedidos,
    (SELECT count(*) FROM produtos pr WHERE pr.company_id = e.id) as total_produtos
FROM empresas e
WHERE e.id IN (SELECT company_id FROM profiles WHERE id = auth.uid());
