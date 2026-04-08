-- DOCESGESTÃO - CONSOLIDATED DATABASE REPAIR V2
-- This script fixes missing tables, standardizes names, and ensures RLS is correct.

BEGIN;

-- 0. PROFILES & AUTH SYNC
-- Ensure profiles table exists and is correctly structured
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_name text,
    business_name text,
    email text,
    plan text DEFAULT 'free',
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
    company_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
    role text DEFAULT 'user',
    is_admin boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Fix missing columns if table already existed
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='tenant_id') THEN
        ALTER TABLE public.profiles ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='company_id') THEN
        ALTER TABLE public.profiles ADD COLUMN company_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='owner_name') THEN
        ALTER TABLE public.profiles ADD COLUMN owner_name text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='business_name') THEN
        ALTER TABLE public.profiles ADD COLUMN business_name text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='plan') THEN
        ALTER TABLE public.profiles ADD COLUMN plan text DEFAULT 'free';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_admin') THEN
        ALTER TABLE public.profiles ADD COLUMN is_admin boolean DEFAULT false;
    END IF;
END $$;



-- Ensure a default tenant exists for orphans
INSERT INTO public.tenants (id, nome, slug)
VALUES ('00000000-0000-0000-0000-000000000000', 'Loja Padrão', 'loja-padrao')
ON CONFLICT (id) DO NOTHING;

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, owner_name, tenant_id, company_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill missing profiles for existing users
INSERT INTO public.profiles (id, email, owner_name, tenant_id, company_id)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', email),
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 1. RECEITAS (Recipes)
-- SAFELY DROP VIEW ONLY IF IT EXISTS AND IS A VIEW
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name = 'receitas'
    ) THEN
        DROP VIEW public.receitas CASCADE;
    END IF;
END $$;

-- Ensure 'receitas' table has all required columns
CREATE TABLE IF NOT EXISTS public.receitas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    nome text NOT NULL,
    descricao text,
    tempo_preparo text,
    rendimento text,
    foto_url text,
    modo_preparo text,
    ingredientes jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- Fix missing columns if table already existed
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='receitas' AND column_name='ingredientes') THEN
        ALTER TABLE public.receitas ADD COLUMN ingredientes jsonb DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='receitas' AND column_name='tenant_id') THEN
        ALTER TABLE public.receitas ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. COMPANY TEAM (Equipe)
-- Create if missing
CREATE TABLE IF NOT EXISTS public.company_team (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    role text NOT NULL DEFAULT 'cozinha' CHECK (role IN ('admin', 'cozinha', 'entregador', 'manager')),
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at timestamptz DEFAULT now()
);

-- 3. TRANSACTIONS (Financeiro)
-- Create if missing
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    description text NOT NULL,
    amount numeric NOT NULL DEFAULT 0,
    type text NOT NULL CHECK (type IN ('entrada', 'saida')),
    category text,
    transaction_date date DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now()
);

-- Fix missing columns if table already existed
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='user_id') THEN
        ALTER TABLE public.transactions ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='tenant_id') THEN
        ALTER TABLE public.transactions ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. AFFILIATES
CREATE TABLE IF NOT EXISTS public.affiliates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    code text UNIQUE NOT NULL,
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE CASCADE,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    commission numeric NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    created_at timestamptz DEFAULT now()
);

-- 5. RLS POLICIES
-- Enable RLS
ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_sales ENABLE ROW LEVEL SECURITY;

-- Helper function for tenant isolation (if not exists)
CREATE OR REPLACE FUNCTION public.get_user_company() 
RETURNS uuid AS $$
  -- We prioritize tenant_id since companies is a view
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Re-apply policies
DROP POLICY IF EXISTS "tenant_isolation_receitas" ON public.receitas;
CREATE POLICY "tenant_isolation_receitas" ON public.receitas FOR ALL USING (company_id = public.get_user_company());

DROP POLICY IF EXISTS "tenant_isolation_team" ON public.company_team;
CREATE POLICY "tenant_isolation_team" ON public.company_team FOR ALL USING (company_id = public.get_user_company());

DROP POLICY IF EXISTS "tenant_isolation_transactions" ON public.transactions;
CREATE POLICY "tenant_isolation_transactions" ON public.transactions FOR ALL USING (company_id = public.get_user_company());

DROP POLICY IF EXISTS "affiliate_user_access" ON public.affiliates;
CREATE POLICY "affiliate_user_access" ON public.affiliates FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "affiliate_sales_access" ON public.affiliate_sales;
CREATE POLICY "affiliate_sales_access" ON public.affiliate_sales FOR SELECT USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

COMMIT;
