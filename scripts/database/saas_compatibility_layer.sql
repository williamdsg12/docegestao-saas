-- MASTER REPAIR: SaaS Compatibility Layer (Legacy Bridge)
BEGIN;

-- 1. Ensure 'tenants' table has all legacy profile, delivery and customization fields
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS segment TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS address_street TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS address_number TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS address_complement TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS address_neighborhood TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS address_city TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS address_state TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS address_zip TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS address_lat NUMERIC;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS address_lng NUMERIC;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS delivery_radius NUMERIC DEFAULT 0;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS min_order_value NUMERIC DEFAULT 0;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS accept_pix BOOLEAN DEFAULT TRUE;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS accept_card BOOLEAN DEFAULT TRUE;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS accept_cash BOOLEAN DEFAULT TRUE;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS menu_slug TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS menu_banner_text TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS menu_enabled_features TEXT[] DEFAULT '{whatsapp,delivery,pix}';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS whatsapp_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{"description": "Seg-Sex: 09h-18h"}';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS production_time TEXT DEFAULT '30-45 min';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo';

-- 2. Create the Sync Function (Self-Contained)
CREATE OR REPLACE FUNCTION public.sync_legacy_tenant_ids() RETURNS trigger AS $$
BEGIN
    -- For 'tenants' table
    IF TG_TABLE_NAME = 'tenants' THEN
        NEW.company_id := NEW.id;
        NEW.empresa_id := NEW.id;
        
        -- Sync name <-> nome
        IF NEW.name IS NOT NULL AND NEW.nome IS NULL THEN
            NEW.nome := NEW.name;
        ELSIF NEW.nome IS NOT NULL AND NEW.name IS NULL THEN
            NEW.name := NEW.nome;
        END IF;

        -- Sync phone <-> whatsapp <-> telefone
        IF NEW.phone IS NOT NULL AND NEW.whatsapp IS NULL THEN
            NEW.whatsapp := NEW.phone;
        ELSIF NEW.whatsapp IS NOT NULL AND NEW.phone IS NULL THEN
            NEW.phone := NEW.whatsapp;
        END IF;
        
        RETURN NEW;
    END IF;

    -- For other tables, sync tenant_id <-> company_id <-> empresa_id
    IF NEW.tenant_id IS NOT NULL AND NEW.company_id IS NULL THEN
        NEW.company_id := NEW.tenant_id;
    ELSIF NEW.company_id IS NOT NULL AND NEW.tenant_id IS NULL THEN
        NEW.tenant_id := NEW.company_id;
    END IF;
    
    IF NEW.empresa_id IS NULL AND NEW.tenant_id IS NOT NULL THEN
        NEW.empresa_id := NEW.tenant_id;
    END IF;

    -- Sync 'name' to 'nome' for customers and products
    IF TG_TABLE_NAME IN ('customers', 'products', 'product_categories') THEN
        IF NEW.name IS NOT NULL AND NEW.nome IS NULL THEN
            NEW.nome := NEW.name;
        ELSIF NEW.nome IS NOT NULL AND NEW.name IS NULL THEN
            NEW.name := NEW.nome;
        END IF;
    END IF;

    -- Special for Orders: status and types
    IF TG_TABLE_NAME = 'orders' THEN
        -- Sync order_type <-> delivery_type
        IF NEW.order_type IS NOT NULL AND NEW.delivery_type IS NULL THEN
            NEW.delivery_type := NEW.order_type;
        ELSIF NEW.delivery_type IS NOT NULL AND NEW.order_type IS NULL THEN
            NEW.order_type := NEW.delivery_type;
        END IF;
        
        -- Sync customer_id <-> cliente_id
        IF NEW.customer_id IS NOT NULL AND NEW.cliente_id IS NULL THEN
            NEW.cliente_id := NEW.customer_id;
        ELSIF NEW.cliente_id IS NOT NULL AND NEW.customer_id IS NULL THEN
            NEW.customer_id := NEW.cliente_id;
        END IF;
    END IF;

    -- Sync 'category_id' to 'categoria_id' for products
    IF TG_TABLE_NAME = 'products' THEN
        IF NEW.category_id IS NOT NULL AND NEW.categoria_id IS NULL THEN
            NEW.categoria_id := NEW.category_id;
        ELSIF NEW.categoria_id IS NOT NULL AND NEW.category_id IS NULL THEN
            NEW.category_id := NEW.categoria_id;
        END IF;

        -- Sync description <-> descricao
        IF NEW.description IS NOT NULL AND NEW.descricao IS NULL THEN
            NEW.descricao := NEW.description;
        ELSIF NEW.descricao IS NOT NULL AND NEW.description IS NULL THEN
            NEW.description := NEW.descricao;
        END IF;

        -- Sync price <-> preco
        IF NEW.price IS NOT NULL AND NEW.preco IS NULL THEN
            NEW.preco := NEW.price;
        ELSIF NEW.preco IS NOT NULL AND NEW.price IS NULL THEN
            NEW.price := NEW.preco;
        END IF;

        -- Sync image_url <-> imagem_url
        IF NEW.image_url IS NOT NULL AND NEW.imagem_url IS NULL THEN
            NEW.imagem_url := NEW.image_url;
        ELSIF NEW.imagem_url IS NOT NULL AND NEW.image_url IS NULL THEN
            NEW.image_url := NEW.imagem_url;
        END IF;
        
        -- Sync active <-> ativo
        IF NEW.active IS NOT NULL AND NEW.ativo IS NULL THEN
            NEW.ativo := NEW.active;
        ELSIF NEW.ativo IS NOT NULL AND NEW.active IS NULL THEN
            NEW.active := NEW.ativo;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Add legacy columns and triggers to ALL relevant tables
DO $$ 
DECLARE 
    tbl text;
BEGIN
    FOR tbl IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
               AND table_name IN ('profiles', 'tenants', 'customers', 'orders', 'products', 'product_categories', 'addresses', 'delivery_settings', 'subscriptions', 'ingredients', 'recipes')
    LOOP
        -- Add company_id and empresa_id if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=tbl AND column_name='company_id') THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN company_id UUID', tbl);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=tbl AND column_name='empresa_id') THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN empresa_id UUID', tbl);
        END IF;

        -- Add 'nome' if missing
        IF tbl IN ('customers', 'products', 'product_categories') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=tbl AND column_name='nome') THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN nome TEXT', tbl);
        END IF;

        -- Position column
        IF tbl IN ('products', 'product_categories') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=tbl AND column_name='position') THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN position INTEGER DEFAULT 0', tbl);
        END IF;

        -- Orders specific compatibility
        IF tbl = 'orders' THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_type') THEN
                ALTER TABLE public.orders ADD COLUMN delivery_type TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='order_type') THEN
                ALTER TABLE public.orders ADD COLUMN order_type TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='cliente_id') THEN
                ALTER TABLE public.orders ADD COLUMN cliente_id UUID;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='num_serial') THEN
                ALTER TABLE public.orders ADD COLUMN num_serial TEXT;
            END IF;
        END IF;

        -- Add detailed product compatibility
        IF tbl = 'products' THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='category_id') THEN
                ALTER TABLE public.products ADD COLUMN category_id UUID;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='categoria_id') THEN
                ALTER TABLE public.products ADD COLUMN categoria_id UUID;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='description') THEN
                ALTER TABLE public.products ADD COLUMN description TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='descricao') THEN
                ALTER TABLE public.products ADD COLUMN descricao TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='price') THEN
                ALTER TABLE public.products ADD COLUMN price NUMERIC DEFAULT 0;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='preco') THEN
                ALTER TABLE public.products ADD COLUMN preco NUMERIC DEFAULT 0;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='image_url') THEN
                ALTER TABLE public.products ADD COLUMN image_url TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='imagem_url') THEN
                ALTER TABLE public.products ADD COLUMN imagem_url TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='active') THEN
                ALTER TABLE public.products ADD COLUMN active BOOLEAN DEFAULT TRUE;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='ativo') THEN
                ALTER TABLE public.products ADD COLUMN ativo BOOLEAN DEFAULT TRUE;
            END IF;
        END IF;

        -- Add Trigger
        EXECUTE format('DROP TRIGGER IF EXISTS trg_sync_legacy_%I ON public.%I', tbl, tbl);
        EXECUTE format('CREATE TRIGGER trg_sync_legacy_%I BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE PROCEDURE sync_legacy_tenant_ids()', tbl, tbl);
    END LOOP;
END $$;

-- 4. Open RLS for Public Read access to Menu and Tracking
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Tenants" ON public.tenants;
CREATE POLICY "Public Read Tenants" ON public.tenants FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Public Read Categories" ON public.product_categories;
CREATE POLICY "Public Read Categories" ON public.product_categories FOR SELECT USING (active = TRUE);

DROP POLICY IF EXISTS "Public Read Products" ON public.products;
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (active = TRUE);

DROP POLICY IF EXISTS "Public Read Orders" ON public.orders;
CREATE POLICY "Public Read Orders" ON public.orders FOR SELECT USING (TRUE);

-- 5. Initial Sync (Manual updates for safety)
UPDATE public.tenants SET company_id = id, empresa_id = id, nome = name WHERE id IS NOT NULL;
DO $$ BEGIN UPDATE public.profiles SET company_id = tenant_id, empresa_id = tenant_id WHERE tenant_id IS NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.customers SET company_id = tenant_id, empresa_id = tenant_id, nome = name WHERE tenant_id IS NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.orders SET company_id = tenant_id, empresa_id = tenant_id, order_type = COALESCE(order_type, delivery_type), cliente_id = customer_id WHERE tenant_id IS NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.products SET company_id = tenant_id, empresa_id = tenant_id, category_id = categoria_id, description = descricao, price = preco, image_url = imagem_url, active = COALESCE(active, ativo, true) WHERE tenant_id IS NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.product_categories SET company_id = tenant_id, empresa_id = tenant_id, nome = name WHERE tenant_id IS NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 6. Compatibility VIEWS (Bridge legacy names to new tables)
DROP VIEW IF EXISTS public.companies CASCADE;
CREATE VIEW public.companies AS SELECT * FROM public.tenants;

DROP VIEW IF EXISTS public.empresas CASCADE;
CREATE VIEW public.empresas AS SELECT * FROM public.tenants;

DROP VIEW IF EXISTS public.clientes CASCADE;
CREATE VIEW public.clientes AS SELECT * FROM public.customers;

DROP VIEW IF EXISTS public.pedidos CASCADE;
CREATE VIEW public.pedidos AS SELECT *, total AS valor_total FROM public.orders;

DROP VIEW IF EXISTS public.categorias CASCADE;
CREATE VIEW public.categorias AS SELECT * FROM public.product_categories;

DROP VIEW IF EXISTS public.produtos CASCADE;
CREATE VIEW public.produtos AS SELECT * FROM public.products;

DROP VIEW IF EXISTS public.ingredientes CASCADE;
CREATE VIEW public.ingredientes AS SELECT * FROM public.ingredients;

DROP VIEW IF EXISTS public.receitas CASCADE;
CREATE VIEW public.receitas AS SELECT * FROM public.recipes;

COMMIT;
