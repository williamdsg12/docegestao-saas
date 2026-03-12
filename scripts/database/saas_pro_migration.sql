-- MIGRAÇÃO SAAS PRO: Expansão de Dados de Usuário e Empresa
-- Execute este script no SQL Editor do Supabase para adicionar os novos campos profissionais.

DO $$ 
BEGIN 
    -- 1. Expansão da Tabela PROFILES
    -- Dados Pessoais e Profissionais
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='photo_url') THEN
        ALTER TABLE public.profiles ADD COLUMN photo_url text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='whatsapp') THEN
        ALTER TABLE public.profiles ADD COLUMN whatsapp text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='city') THEN
        ALTER TABLE public.profiles ADD COLUMN city text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='state') THEN
        ALTER TABLE public.profiles ADD COLUMN state text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='bio') THEN
        ALTER TABLE public.profiles ADD COLUMN bio text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='experience_years') THEN
        ALTER TABLE public.profiles ADD COLUMN experience_years text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='specialty') THEN
        ALTER TABLE public.profiles ADD COLUMN specialty text;
    END IF;

    -- 2. Expansão da Tabela COMPANIES
    -- Identidade e Branding
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='logo_url') THEN
        ALTER TABLE public.companies ADD COLUMN logo_url text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='instagram') THEN
        ALTER TABLE public.companies ADD COLUMN instagram text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='website') THEN
        ALTER TABLE public.companies ADD COLUMN website text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='description') THEN
        ALTER TABLE public.companies ADD COLUMN description text;
    END IF;

    -- Localização Detalhada (Endereço Comercial)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='address_street') THEN
        ALTER TABLE public.companies ADD COLUMN address_street text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='address_number') THEN
        ALTER TABLE public.companies ADD COLUMN address_number text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='address_complement') THEN
        ALTER TABLE public.companies ADD COLUMN address_complement text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='address_neighborhood') THEN
        ALTER TABLE public.companies ADD COLUMN address_neighborhood text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='address_city') THEN
        ALTER TABLE public.companies ADD COLUMN address_city text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='address_state') THEN
        ALTER TABLE public.companies ADD COLUMN address_state text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='address_zip') THEN
        ALTER TABLE public.companies ADD COLUMN address_zip text;
    END IF;

    -- Informações Comerciais e Entrega
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='delivery_radius') THEN
        ALTER TABLE public.companies ADD COLUMN delivery_radius numeric;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='delivery_fee') THEN
        ALTER TABLE public.companies ADD COLUMN delivery_fee numeric;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='min_order_value') THEN
        ALTER TABLE public.companies ADD COLUMN min_order_value numeric;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='accept_pix') THEN
        ALTER TABLE public.companies ADD COLUMN accept_pix boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='accept_card') THEN
        ALTER TABLE public.companies ADD COLUMN accept_card boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='accept_cash') THEN
        ALTER TABLE public.companies ADD COLUMN accept_cash boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='opening_hours') THEN
        ALTER TABLE public.companies ADD COLUMN opening_hours jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='production_time') THEN
        ALTER TABLE public.companies ADD COLUMN production_time text;
    END IF;

    -- 3. Expansão para Cardápio Digital e WhatsApp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='menu_slug') THEN
        ALTER TABLE public.companies ADD COLUMN menu_slug text UNIQUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='menu_banner_text') THEN
        ALTER TABLE public.companies ADD COLUMN menu_banner_text text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='menu_enabled_features') THEN
        ALTER TABLE public.companies ADD COLUMN menu_enabled_features jsonb DEFAULT '["whatsapp", "delivery", "pix"]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='whatsapp_connected') THEN
        ALTER TABLE public.companies ADD COLUMN whatsapp_connected boolean DEFAULT false;
    END IF;

END $$;
