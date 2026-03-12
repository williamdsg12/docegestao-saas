-- EXECUTAR NO SQL EDITOR DO SUPABASE PARA UNIFICAR O CADASTRO

-- 1. Garantir que a tabela profiles tenha a coluna email
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email text;
    END IF;
END $$;

-- 2. Remover gatilhos antigos para evitar conflitos
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Função de Cadastro Unificada
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_company_id uuid;
    iniciante_plan_id uuid;
    is_admin_user boolean;
BEGIN
    -- Verificar se é um dos e-mails de admin
    is_admin_user := (new.email IN ('williamosadia94@gmail.com', 'williamdev36@gmail.com'));

    -- 1. Criar Perfil (Profiles)
    INSERT INTO public.profiles (
        id,
        owner_name,
        business_name,
        email, -- Se a coluna existir, se não, remova
        plan,
        trial_ends_at,
        is_admin
    )
    VALUES (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', 'Usuário'),
        coalesce(new.raw_user_meta_data->>'store_name', 'Minha Confeitaria'),
        new.email,
        CASE WHEN is_admin_user THEN 'premium' ELSE 'basico' END,
        now() + interval '14 days',
        is_admin_user
    );

    -- 2. Criar Empresa (Companies)
    INSERT INTO public.companies (name, owner_id)
    VALUES (
        coalesce(new.raw_user_meta_data->>'store_name', 'Minha Confeitaria'),
        new.id
    )
    RETURNING id INTO new_company_id;

    -- 3. Criar Assinatura (Subscriptions) - Trial de 14 dias
    -- Buscar ID do plano iniciante
    SELECT id INTO iniciante_plan_id FROM public.plans WHERE slug = 'iniciante' LIMIT 1;

    INSERT INTO public.subscriptions (
        user_id,
        company_id,
        plan_id,
        status,
        trial_start,
        trial_end
    )
    VALUES (
        new.id,
        new_company_id,
        iniciante_plan_id,
        'trial',
        now(),
        now() + interval '14 days'
    );

    RETURN new;
END;
$$;

-- 3. Re-criar o Gatilho Mestre
CREATE TRIGGER on_auth_user_created_master
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
