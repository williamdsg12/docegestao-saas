-- DIGITAL MENU SCHEMA FIX
-- Script to ensure all menu tables exist and have the correct structure

DO $$ 
BEGIN 
    -- 1. menu_categories
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'menu_categories') THEN
        CREATE TABLE public.menu_categories (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
            name text NOT NULL,
            active boolean DEFAULT true,
            position integer DEFAULT 0,
            created_at timestamp with time zone DEFAULT now()
        );
    END IF;

    -- 2. menu_products
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'menu_products') THEN
        CREATE TABLE public.menu_products (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
            category_id uuid REFERENCES public.menu_categories(id) ON DELETE SET NULL,
            name text NOT NULL,
            description text,
            price numeric DEFAULT 0,
            image_url text,
            active boolean DEFAULT true,
            created_at timestamp with time zone DEFAULT now()
        );
    ELSE
        -- Ensure category_id column exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_products' AND column_name='category_id') THEN
            ALTER TABLE public.menu_products ADD COLUMN category_id uuid REFERENCES public.menu_categories(id) ON DELETE SET NULL;
        END IF;
        
        -- Ensure company_id column exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_products' AND column_name='company_id') THEN
            ALTER TABLE public.menu_products ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- 3. menu_orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'menu_orders') THEN
        CREATE TABLE public.menu_orders (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
            customer_name text NOT NULL,
            customer_phone text NOT NULL,
            customer_address text,
            customer_cep text,
            subtotal numeric DEFAULT 0,
            delivery_fee numeric DEFAULT 0,
            total numeric DEFAULT 0,
            payment_method text,
            notes text,
            status text DEFAULT 'pending',
            created_at timestamp with time zone DEFAULT now()
        );
    END IF;

    -- 4. menu_order_items
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'menu_order_items') THEN
        CREATE TABLE public.menu_order_items (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id uuid REFERENCES public.menu_orders(id) ON DELETE CASCADE,
            product_id uuid REFERENCES public.menu_products(id) ON DELETE SET NULL,
            product_name text NOT NULL,
            quantity integer DEFAULT 1,
            price numeric DEFAULT 0,
            created_at timestamp with time zone DEFAULT now()
        );
    END IF;

END $$;

-- Enable RLS
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_order_items ENABLE ROW LEVEL SECURITY;

-- Security Policies (Tenant Isolation)
DO $$ 
DECLARE 
    tbl text;
BEGIN
    FOR tbl IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('menu_categories', 'menu_products', 'menu_orders')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_%I" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "tenant_isolation_%I" ON public.%I FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))', tbl, tbl);
    END LOOP;
    
    -- Special policy for menu_order_items
    DROP POLICY IF EXISTS "tenant_isolation_menu_order_items" ON public.menu_order_items;
    CREATE POLICY "tenant_isolation_menu_order_items" ON public.menu_order_items 
    FOR ALL USING (order_id IN (SELECT id FROM public.menu_orders WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())));
    
    -- Public Access for Digital Menu (Slug-based)
    -- This is required so customers can see the menu without being logged in
    DROP POLICY IF EXISTS "public_menu_categories_access" ON public.menu_categories;
    CREATE POLICY "public_menu_categories_access" ON public.menu_categories FOR SELECT USING (active = true);
    
    DROP POLICY IF EXISTS "public_menu_products_access" ON public.menu_products;
    CREATE POLICY "public_menu_products_access" ON public.menu_products FOR SELECT USING (active = true);
    
    DROP POLICY IF EXISTS "public_menu_orders_insert" ON public.menu_orders;
    CREATE POLICY "public_menu_orders_insert" ON public.menu_orders FOR INSERT WITH CHECK (true);
    
    DROP POLICY IF EXISTS "public_menu_order_items_insert" ON public.menu_order_items;
    CREATE POLICY "public_menu_order_items_insert" ON public.menu_order_items FOR INSERT WITH CHECK (true);
END $$;
