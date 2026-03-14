-- AUTOMATIC SLUG GENERATION FOR COMPANIES
-- This script updates the registration trigger to automatically generate a menu_slug from the store name.

-- 1. Helper Function to Slugify
CREATE OR REPLACE FUNCTION public.slugify(value TEXT)
RETURNS TEXT AS $$
DECLARE
    slug TEXT;
BEGIN
    -- 1. Convert to lowercase
    slug := lower(value);
    -- 2. Remove special characters (accents are tricky without unaccent extension, so we handle common ones)
    slug := translate(slug, 'áàâãäåèéêëìíîïòóôõöùúûüñç', 'aaaaaaeeeeiiiiooooouuuunc');
    -- 3. Replace non-alphanumeric with space
    slug := regexp_replace(slug, '[^a-z0-9]', ' ', 'g');
    -- 4. Trim leading/trailing spaces
    slug := trim(slug);
    -- 5. Replace spaces with hyphens
    slug := regexp_replace(slug, '\s+', '-', 'g');
    
    RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- 2. Update existing handle_new_user function
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
    store_name text;
    generated_slug text;
BEGIN
    -- Determinar se é Admin
    is_admin_user := (new.email IN ('williamosadia94@gmail.com', 'williamdev36@gmail.com'));
    store_name := coalesce(new.raw_user_meta_data->>'store_name', 'Minha Confeitaria');
    generated_slug := public.slugify(store_name);

    -- BLOCO 1: Criar Empresa
    BEGIN
        INSERT INTO public.companies (name, owner_id, menu_slug, slug)
        VALUES (
            store_name,
            new.id,
            generated_slug,
            generated_slug -- For backward compatibility
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
            is_admin,
            company_id
        )
        VALUES (
            new.id,
            coalesce(new.raw_user_meta_data->>'full_name', 'Usuário'),
            store_name,
            new.email,
            CASE WHEN is_admin_user THEN 'premium' ELSE 'basico' END,
            now() + interval '14 days',
            is_admin_user,
            new_company_id
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Falha ao criar perfil para o usuário %: %', new.id, SQLERRM;
    END;

    -- BLOCO 3: Criar Assinatura (Trial)
    BEGIN
        SELECT id INTO found_plan_id FROM public.plans WHERE slug = 'iniciante' LIMIT 1;
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
