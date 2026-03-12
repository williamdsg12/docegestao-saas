-- SCRIPT DE ESTABILIDADE E AUDITORIA ADMIN
-- OBJETIVO: Resolver erros de RLS, garantir função is_admin e promover usuário principal.

-- 1. Redefinir a função is_admin com SECURITY DEFINER para evitar recursão infinita no RLS
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Resetar e Simplificar Políticas de RLS para Administradores
-- Perfil
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));

-- Empresas
DROP POLICY IF EXISTS "Admins can view all companies" ON public.companies;
CREATE POLICY "Admins can view all companies" ON public.companies FOR SELECT USING (public.is_admin(auth.uid()));

-- Assinaturas
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions FOR SELECT USING (public.is_admin(auth.uid()));

-- Pagamentos
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT USING (public.is_admin(auth.uid()));

-- Tickets de Suporte (Caso a tabela exista)
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'support_tickets') THEN
        DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
        CREATE POLICY "Admins can view all tickets" ON public.support_tickets FOR SELECT USING (public.is_admin(auth.uid()));
    END IF;
END $$;

-- Logs de Sistema (Caso a tabela exista)
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_logs') THEN
        DROP POLICY IF EXISTS "Admins can view all logs" ON public.system_logs;
        CREATE POLICY "Admins can view all logs" ON public.system_logs FOR SELECT USING (public.is_admin(auth.uid()));
    END IF;
END $$;

-- 3. Garantir que o email williamdev36@gmail.com seja Admin
DO $$ 
DECLARE 
    target_user_id uuid;
BEGIN 
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'williamdev36@gmail.com';
    
    IF target_user_id IS NOT NULL THEN
        UPDATE public.profiles SET is_admin = true WHERE id = target_user_id;
        RAISE NOTICE 'Usuário williamdev36@gmail.com promovido a Admin.';
    END IF;
END $$;
