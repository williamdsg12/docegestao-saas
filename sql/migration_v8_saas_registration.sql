-- ==========================================
-- MIGRATION V8: UNIFIED SAAS REGISTRATION TRIGGER
-- ==========================================
-- This trigger handles:
-- 1. Tenant creation (SaaS)
-- 2. Profile creation with Affiliate linking
-- 3. Initial trial subscription
-- ==========================================

BEGIN;

-- 1. Drop existing trigger to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created_master ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- 2. Modernized Registration Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_tenant_id uuid;
    iniciante_plan_id uuid;
    is_admin_user boolean;
    ref_id uuid;
BEGIN
    -- Determine if the user is a system admin (optional list)
    is_admin_user := (new.email IN ('williamosadia94@gmail.com', 'williamdev36@gmail.com'));
    
    -- Extract referral_id from metadata
    ref_id := (new.raw_user_meta_data->>'referral_id')::uuid;

    -- 1. Create Tenant (SaaS Store)
    INSERT INTO public.tenants (
        name,
        slug,
        owner_id
    )
    VALUES (
        coalesce(new.raw_user_meta_data->>'store_name', 'Minha Vitrine'),
        lower(regexp_replace(coalesce(new.raw_user_meta_data->>'store_name', 'loja-' || substr(new.id::text, 1, 8)), '[^a-zA-Z0-9]+', '-', 'g')),
        new.id
    )
    RETURNING id INTO new_tenant_id;

    -- 2. Create/Update Profile
    -- Since Supabase might have already created a profile depending on existing triggers,
    -- we use UPSERT or ensure we handle it.
    INSERT INTO public.profiles (
        id,
        tenant_id,
        name,
        role,
        affiliate_id,
        created_at
    )
    VALUES (
        new.id,
        new_tenant_id,
        coalesce(new.raw_user_meta_data->>'full_name', 'Usuário'),
        CASE WHEN is_admin_user THEN 'admin' ELSE 'user' END,
        ref_id,
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        tenant_id = EXCLUDED.tenant_id,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        affiliate_id = EXCLUDED.affiliate_id;

    -- 3. Create Initial Trial Subscription
    -- Seek plan ID (fallback to first plan if 'iniciante' doesn't exist)
    SELECT id INTO iniciante_plan_id FROM public.plans WHERE slug = 'iniciante' LIMIT 1;
    IF iniciante_plan_id IS NULL THEN
        SELECT id INTO iniciante_plan_id FROM public.plans LIMIT 1;
    END IF;

    -- Only attempt if plans table exists and has data
    IF iniciante_plan_id IS NOT NULL THEN
        INSERT INTO public.subscriptions (
            user_id,
            tenant_id,
            plan_id,
            status,
            trial_start,
            trial_end
        )
        VALUES (
            new.id,
            new_tenant_id,
            iniciante_plan_id,
            'trial',
            now(),
            now() + interval '14 days'
        );
    END IF;

    RETURN new;
END;
$$;

-- 3. Re-create the Trigger
CREATE TRIGGER on_auth_user_created_master
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

COMMIT;
