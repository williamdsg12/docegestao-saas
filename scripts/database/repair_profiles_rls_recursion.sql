-- REPAIR: Fix Infinite Recursion in Profiles RLS (V2 - SaaS Schema Corrected)
BEGIN;

-- 1. Robust is_admin function (Security Definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- We query the profiles table using the actual columns found: id and role
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Clean up recursive policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_access" ON public.profiles;

-- 3. Create non-recursive policies for 'profiles'
-- Users can see their own profile
CREATE POLICY "profiles_self_access" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- Admins can see all profiles
-- Using JWT metadata to avoid recursion
CREATE POLICY "profiles_admin_access" ON public.profiles
    FOR SELECT USING (
        coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) = true
        OR 
        coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
    );

-- 4. Sync Profile Admin Status to Auth Metadata
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT id, role FROM public.profiles WHERE role = 'admin') LOOP
        UPDATE auth.users 
        SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('is_admin', true, 'role', 'admin')
        WHERE id = r.id;
    END LOOP;
END $$;

COMMIT;
