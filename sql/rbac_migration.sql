-- Migration: Adicionar suporte a roles e is_admin na tabela de perfis
-- Objetivo: Garantir que o sistema de RBAC tenha os campos necessários no banco.

-- 1. Adicionar colunas is_admin e role se não existirem
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
        ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'cliente';
    END IF;
END $$;

-- 2. Atualizar o comentário da tabela para documentação
COMMENT ON COLUMN public.profiles.role IS 'Função do usuário no sistema: admin, operador, cliente';

-- 3. Garantir que o super usuário William seja admin (opcional, conforme lib/access-control.ts)
UPDATE public.profiles 
SET is_admin = true, role = 'admin' 
WHERE email = 'williamdev36@gmail.com';

-- 4. Notar que as políticas de RLS devem ser configuradas no painel do Supabase 
-- para garantir que apenas admins leiam dados sensíveis de outros usuários.
