-- REPAIR: Fix Infinite Recursion in Profiles RLS (v3 - FINAL CHECKLIST)
-- Following user's 5-step instructions

BEGIN;

-- 1. Remover policy da tabela profiles que utiliza função get_my_tenant_id
-- We drop the policy by name if known, but since we suspect multiple candidates:
DROP POLICY IF EXISTS "Tenant Isolation Profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_tenant_isolation" ON public.profiles;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_access" ON public.profiles;

-- 2. Criar policy simples: USING (id = auth.uid())
CREATE POLICY "profiles_self_access" ON public.profiles
    FOR ALL TO authenticated
    USING (id = auth.uid());

-- 3. Atualizar função get_my_tenant_id:
-- adicionar SECURITY DEFINER, evitar bloqueio por RLS
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS uuid AS $$
BEGIN
  -- We query the profiles table directly. 
  -- SECURITY DEFINER ensures this SELECT bypasses RLS on the profiles table.
  RETURN (
    SELECT tenant_id FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Garantir segurança:
-- REVOKE ALL FROM PUBLIC
REVOKE ALL ON FUNCTION public.get_my_tenant_id() FROM PUBLIC;
-- GRANT EXECUTE TO authenticated
GRANT EXECUTE ON FUNCTION public.get_my_tenant_id() TO authenticated;
-- Grant execute to service_role (standard practice)
GRANT EXECUTE ON FUNCTION public.get_my_tenant_id() TO service_role;

COMMIT;

-- 5. Validar:
-- profiles acessa sem erro -> Test: SELECT * FROM profiles LIMIT 1;
-- função retorna tenant_id corretamente -> Test: SELECT get_my_tenant_id();
