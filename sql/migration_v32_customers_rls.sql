-- Migration V32: Fix Customers Table RLS Policies

BEGIN;

-- 1. Certifica que Row Level Security está ativo
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 2. Limpa políticas antigas/conflitantes
DROP POLICY IF EXISTS "Public Customers Access" ON public.customers;
DROP POLICY IF EXISTS "Tenant Isolation Customers" ON public.customers;
DROP POLICY IF EXISTS "tenant_customers" ON public.customers;
DROP POLICY IF EXISTS "Tenant isolation customers" ON public.customers;
DROP POLICY IF EXISTS "Allow public select on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow public insert on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow public update on customers" ON public.customers;
DROP POLICY IF EXISTS "customers_tenant_isolation" ON public.customers;
DROP POLICY IF EXISTS "customers_anonymous_insert" ON public.customers;
DROP POLICY IF EXISTS "customers_anonymous_select" ON public.customers;
DROP POLICY IF EXISTS "customers_anonymous_update" ON public.customers;

-- 3. Cria política unificada para usuários autenticados (Dashboard / Logados)
-- Permite que usuários leiam, criem, atualizem e deletem clientes do seu próprio tenant
CREATE POLICY "customers_tenant_isolation" ON public.customers
    FOR ALL
    TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- 4. Cria políticas para o fluxo de checkout e webhook anônimo (role anon)
-- Permite inserção anônima de novos registros
CREATE POLICY "customers_anon_insert" ON public.customers
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Permite leitura anônima de registros para validações no checkout e busca de cadastros existentes
CREATE POLICY "customers_anon_select" ON public.customers
    FOR SELECT
    TO anon
    USING (true);

-- Permite atualização anônima de registros existentes (ex: atualizar dados no checkout)
CREATE POLICY "customers_anon_update" ON public.customers
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

COMMIT;

-- Força a recarga do cache do PostgREST
NOTIFY pgrst, 'reload schema';
