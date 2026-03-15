-- DOCESGESTÃO - DIGITAL MENU BUILDER INFRASTRUCTURE
-- Tables for settings, templates, and analytics

DO $$ 
BEGIN 
    -- 1. digital_menu_settings
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'digital_menu_settings') THEN
        CREATE TABLE public.digital_menu_settings (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
            store_name text,
            store_description text,
            menu_cover text,
            menu_logo text,
            primary_color text DEFAULT '#ff2266',
            background_color text DEFAULT '#ffffff',
            button_color text DEFAULT '#ff2266',
            text_color text DEFAULT '#0f172a',
            button_text text DEFAULT 'Pedir no WhatsApp',
            button_style text DEFAULT 'rounded', -- rounded, square, ghost
            menu_layout text DEFAULT 'grid', -- grid, list, cards
            whatsapp text,
            instagram text,
            facebook text,
            website text,
            animation_style text DEFAULT 'fade',
            created_at timestamptz DEFAULT now(),
            UNIQUE(company_id)
        );
    END IF;

    -- 2. menu_templates
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'menu_templates') THEN
        CREATE TABLE public.menu_templates (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            template_name text NOT NULL,
            primary_color text,
            background_color text,
            button_color text,
            layout text,
            preview_image text,
            created_at timestamptz DEFAULT now()
        );

        -- Insert initial templates
        INSERT INTO public.menu_templates (template_name, primary_color, background_color, button_color, layout)
        VALUES 
        ('Elegante', '#000000', '#fafafa', '#000000', 'list'),
        ('Moderno', '#ff2266', '#ffffff', '#ff2266', 'grid'),
        ('Minimalista', '#64748b', '#ffffff', '#0f172a', 'cards'),
        ('Colorido', '#fbbf24', '#fffbeb', '#f59e0b', 'grid');
    END IF;

    -- 3. Analytics: menu_views
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'menu_views') THEN
        CREATE TABLE public.menu_views (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
            viewer_ip text,
            device text,
            referrer text,
            created_at timestamptz DEFAULT now()
        );
    END IF;

    -- 4. Analytics: product_clicks
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_clicks') THEN
        CREATE TABLE public.product_clicks (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id uuid REFERENCES public.menu_products(id) ON DELETE CASCADE,
            company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
            created_at timestamptz DEFAULT now()
        );
    END IF;

    -- 5. Update menu_products with position
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_products' AND column_name='position') THEN
        ALTER TABLE public.menu_products ADD COLUMN position integer DEFAULT 0;
    END IF;

END $$;

-- RLS Enablement
ALTER TABLE public.digital_menu_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_clicks ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "tenant_isolation_menu_settings" ON public.digital_menu_settings;
CREATE POLICY "tenant_isolation_menu_settings" ON public.digital_menu_settings 
FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "public_templates_access" ON public.menu_templates;
CREATE POLICY "public_templates_access" ON public.menu_templates FOR SELECT USING (true);

DROP POLICY IF EXISTS "tenant_isolation_menu_views" ON public.menu_views;
CREATE POLICY "tenant_isolation_menu_views" ON public.menu_views 
FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "tenant_isolation_product_clicks" ON public.product_clicks;
CREATE POLICY "tenant_isolation_product_clicks" ON public.product_clicks 
FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Add public access for settings (for customers)
DROP POLICY IF EXISTS "public_menu_settings_access" ON public.digital_menu_settings;
CREATE POLICY "public_menu_settings_access" ON public.digital_menu_settings FOR SELECT USING (true);
