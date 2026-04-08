-- 1. Garantir que a coluna Tente Identificador exista (Caso não tenha sido formalizada antes)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON public.orders(tenant_id);

-- 2. Ativar ROW LEVEL SECURITY (Obrigatório para arquitetura Multi-Tenant)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 3. Limpar políticas antigas se existirem para evitar conflitos
DROP POLICY IF EXISTS "Tenants see only their own orders" ON public.orders;
DROP POLICY IF EXISTS "Tenants can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Tenants can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Tenants can delete own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;

-- 4. Criar Política Unificada de Acesso (SELECT, INSERT, UPDATE, DELETE)
-- Usamos "tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())"
-- Dessa forma, o dono da loja só lê e edita o que pertence ao espaço dele.
CREATE POLICY "Tenants full access to own orders" 
ON public.orders 
FOR ALL 
USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- Opcional (Depende da arquitetura): Se o cliente precisa ler o seu próprio pedido sem estar logado 
-- na loja usando anon_key, podemos precisar de uma policy específica para autenticação de clientes,
-- mas por padrao pedidos viajam apenas de API ou app restrito. No webhook/api server side usamos service_role (que bypassa RLS).

-- Permitir inserts públicos (Cardápio Digital não tem usuário logado)
-- É vital permitir inserções baseadas no tenant_id providenciado pelo Public Cardápio.
CREATE POLICY "Allow public insert to orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true); -- Controle feito via API Route /api/orders/create com service_role

-- Obs: O Backend via `/api/orders/create` usa `supabaseAdmin` (service_role), 
-- então ele consegue fazer inserções ignorando check blocks restritivos de sessão. 
-- Mas em chamadas frontend via anon key, essa policy protege vazamento.
