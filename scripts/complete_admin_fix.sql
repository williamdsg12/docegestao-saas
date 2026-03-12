-- EXECUTAR NO SQL EDITOR DO SUPABASE

-- 1. Garantir que a chave estrangeira existe entre subscriptions e plans
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_plan_id_fkey') THEN
        ALTER TABLE public.subscriptions 
        ADD CONSTRAINT subscriptions_plan_id_fkey 
        FOREIGN KEY (plan_id) REFERENCES public.plans(id);
    END IF;
END $$;

-- 2. Função para verificar admin sem recursão (SECURITY DEFINER ignora RLS)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Garantir permissões de leitura para Administradores na tabela profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin(auth.uid()));

-- 4. Garantir que administradores podem ver todas as assinaturas
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions
FOR SELECT
USING (public.is_admin(auth.uid()));

-- 5. Garantir que administradores podem ver todas as empresas
DROP POLICY IF EXISTS "Admins can view all companies" ON public.companies;
CREATE POLICY "Admins can view all companies"
ON public.companies
FOR SELECT
USING (public.is_admin(auth.uid()));

-- 5. Função RPC para métricas (Versão consolidada SaaS Pro)
CREATE OR REPLACE FUNCTION public.get_saas_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT count(*) FROM public.profiles WHERE is_admin = false),
        'total_companies', (SELECT count(*) FROM public.companies),
        'active_subscriptions', (SELECT count(*) FROM public.subscriptions WHERE status = 'active'),
        'trial_subscriptions', (SELECT count(*) FROM public.subscriptions WHERE status = 'trial'),
        'open_tickets', (SELECT count(*) FROM public.support_tickets WHERE status = 'open'),
        'new_users_today', (SELECT count(*) FROM public.profiles WHERE created_at >= date_trunc('day', now())),
        'mrr', (
            SELECT coalesce(sum(p.price), 0) 
            FROM public.subscriptions s 
            JOIN public.plans p ON s.plan_id = p.id 
            WHERE s.status = 'active'
        ),
        'total_revenue', (SELECT coalesce(sum(amount), 0) FROM public.payments WHERE status = 'paid' OR status = 'confirmed')
    ) INTO result;
    RETURN result;
END;
$$;
-- 6. Garantir que o usuário williamdev36@gmail.com seja Administrador
-- Este bloco garante que o perfil exista e tenha a flag is_admin = true
DO $$ 
DECLARE 
    user_id_found uuid;
BEGIN 
    SELECT id INTO user_id_found FROM auth.users WHERE email = 'williamdev36@gmail.com';
    
    IF user_id_found IS NOT NULL THEN
        -- Tenta atualizar ou inserir se não existir
        INSERT INTO public.profiles (id, is_admin, plan, owner_name)
        VALUES (user_id_found, true, 'premium', 'William Souza')
        ON CONFLICT (id) DO UPDATE 
        SET is_admin = true, plan = 'premium';
        
        RAISE NOTICE 'Usuário williamdev36@gmail.com promovido a Admin com sucesso.';
    ELSE
        RAISE NOTICE 'Usuário williamdev36@gmail.com não encontrado no auth.users.';
    END IF;
END $$;

-- Se o email não estiver na tabela profiles (apenas no auth.users),
-- o trigger handle_new_user_profile ou a sincronização manual pode ser necessária.
-- Caso queira garantir pelo ID (mais seguro se souber o UUID):
-- UPDATE public.profiles SET is_admin = true WHERE id = 'ID-DO-USUARIO';
