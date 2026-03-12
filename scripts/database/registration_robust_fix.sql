-- SOLUÇÃO DEFINITIVA PARA ERRO DE CADASTRO (Database error saving new user)
-- Execute este script no SQL Editor do Supabase para unificar e estabilizar o processo de registro.

-- 1. Garantir que as tabelas base existem com as colunas corretas
DO $$ 
BEGIN 
    -- Tabela Profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        CREATE TABLE public.profiles (
            id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            owner_name text,
            business_name text,
            email text,
            plan text DEFAULT 'basico',
            trial_ends_at timestamp with time zone,
            is_admin boolean DEFAULT false,
            created_at timestamp with time zone DEFAULT now()
        );
    END IF;

    -- Tabela Companies
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies') THEN
        CREATE TABLE public.companies (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            name text NOT NULL,
            owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at timestamp with time zone DEFAULT now()
        );
    END IF;

    -- Coluna slug em companies (necessária para cardápio digital)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='slug') THEN
        ALTER TABLE public.companies ADD COLUMN slug text UNIQUE;
    END IF;

    -- Tabela Plans
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'plans') THEN
        CREATE TABLE public.plans (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            name text NOT NULL,
            slug text UNIQUE NOT NULL,
            price numeric DEFAULT 0,
            created_at timestamp with time zone DEFAULT now()
        );
    END IF;

    -- Tabela Subscriptions
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
        CREATE TABLE public.subscriptions (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
            company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
            plan_id uuid REFERENCES public.plans(id),
            status text DEFAULT 'trial',
            trial_start timestamp with time zone DEFAULT now(),
            trial_end timestamp with time zone,
            created_at timestamp with time zone DEFAULT now()
        );
    END IF;

    -- Garantir que a restrição UNIQUE existe na coluna SLUG de PLANS (para evitar erro 42P10)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'plans') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'plans_slug_key' OR contype = 'u' 
            AND conrelid = 'public.plans'::regclass 
            AND (SELECT array_agg(attname)::text[] FROM pg_attribute WHERE attrelid = conrelid AND attnum = ANY(conkey)) @> ARRAY['slug']::text[]
        ) THEN
            -- Tenta remover duplicatas antes de aplicar a restrição (limpeza preventiva)
            DELETE FROM public.plans a USING public.plans b WHERE a.id < b.id AND a.slug = b.slug;
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plans_slug_key' AND conrelid = 'public.plans'::regclass) THEN
                ALTER TABLE public.plans ADD CONSTRAINT plans_slug_key UNIQUE (slug);
            END IF;
        END IF;
    END IF;

    -- Garantir que a restrição UNIQUE/PK existe na coluna ID de PROFILES
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE i.indrelid = 'public.profiles'::regclass AND i.indisunique AND a.attname = 'id') THEN
            ALTER TABLE public.profiles ADD PRIMARY KEY (id);
        END IF;
    END IF;
END $$;

-- 2. Inserir planos padrão se não existirem (Essencial para evitar falha no trigger)
INSERT INTO public.plans (name, slug, price)
VALUES 
    ('Iniciante', 'iniciante', 0),
    ('Profissional', 'profissional', 49.90),
    ('Premium', 'premium', 89.90)
ON CONFLICT (slug) DO NOTHING;

-- 3. Função de Cadastro ULTRA ROBUSTA
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_company_id uuid;
    found_plan_id uuid;
    is_admin_user boolean;
BEGIN
    -- Determinar se é Admin (Hardcoded p/ segurança inicial)
    is_admin_user := (new.email IN ('williamosadia94@gmail.com', 'williamdev36@gmail.com'));

    -- BLOCO 1: Criar Empresa
    BEGIN
        INSERT INTO public.companies (name, owner_id)
        VALUES (
            coalesce(new.raw_user_meta_data->>'store_name', 'Minha Confeitaria'),
            new.id
        )
        RETURNING id INTO new_company_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Falha ao criar empresa para o usuário %: %', new.id, SQLERRM;
    END;

    -- BLOCO 2: Criar Perfil
    BEGIN
        INSERT INTO public.profiles (
            id,
            owner_name,
            business_name,
            email,
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
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Falha ao criar perfil para o usuário %: %', new.id, SQLERRM;
    END;

    -- BLOCO 3: Criar Assinatura (Trial)
    BEGIN
        -- Tenta buscar o plano iniciante
        SELECT id INTO found_plan_id FROM public.plans WHERE slug = 'iniciante' LIMIT 1;
        
        -- Se não achou 'iniciante', tenta qualquer plano
        IF found_plan_id IS NULL THEN
            SELECT id INTO found_plan_id FROM public.plans LIMIT 1;
        END IF;

        IF found_plan_id IS NOT NULL AND new_company_id IS NOT NULL THEN
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
                found_plan_id,
                'trial',
                now(),
                now() + interval '14 days'
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Falha ao criar assinatura para o usuário %: %', new.id, SQLERRM;
    END;

    RETURN new;
END;
$$;

-- 4. Limpeza e Aplicação do Trigger Estável
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_master ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_stable ON auth.users;

CREATE TRIGGER on_auth_user_created_stable
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 5. Garantir que o admin atual está registrado (Segurança)
INSERT INTO public.profiles (id, owner_name, email, is_admin, plan)
SELECT id, 'William Souza', email, true, 'premium'
FROM auth.users 
WHERE email = 'williamdev36@gmail.com'
ON CONFLICT (id) DO UPDATE SET is_admin = true, plan = 'premium';
