-- MIGRATION V20: STANDARDIZATION & REFACTORING
-- Goal: Standardize schemas to English, fix multi-tenant, and repair relationships.

DO $$ 
BEGIN
    -- 0. CLEANUP LEGACY TRIGGERS
    -- Drop triggers that depend on legacy columns before we drop the columns
    DROP TRIGGER IF EXISTS tr_sync_legacy_tenant_ids ON public.products;
    DROP TRIGGER IF EXISTS tr_sync_legacy_tenant_ids ON public.orders;
    DROP TRIGGER IF EXISTS tr_sync_legacy_tenant_ids ON public.customers;
    DROP FUNCTION IF EXISTS public.sync_legacy_tenant_ids();

    -- 1. STANDARDIZE PRODUCTS
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
        -- Migrate data if English columns are null
        UPDATE public.products SET name = nome WHERE name IS NULL AND nome IS NOT NULL;
        UPDATE public.products SET price = preco WHERE price IS NULL AND preco IS NOT NULL;
        UPDATE public.products SET description = descricao WHERE description IS NULL AND descricao IS NOT NULL;
        UPDATE public.products SET active = ativo WHERE active IS NULL AND ativo IS NOT NULL;
        UPDATE public.products SET image_url = imagem_url WHERE image_url IS NULL AND imagem_url IS NOT NULL;
        UPDATE public.products SET category_id = categoria_id WHERE category_id IS NULL AND categoria_id IS NOT NULL;
        UPDATE public.products SET company_id = empresa_id WHERE company_id IS NULL AND empresa_id IS NOT NULL;

        -- Drop Portuguese columns if they exist (using CASCADE to handle dependent views)
        ALTER TABLE public.products DROP COLUMN IF EXISTS nome CASCADE;
        ALTER TABLE public.products DROP COLUMN IF EXISTS preco CASCADE;
        ALTER TABLE public.products DROP COLUMN IF EXISTS descricao CASCADE;
        ALTER TABLE public.products DROP COLUMN IF EXISTS ativo CASCADE;
        ALTER TABLE public.products DROP COLUMN IF EXISTS imagem_url CASCADE;
        ALTER TABLE public.products DROP COLUMN IF EXISTS categoria_id CASCADE;
        ALTER TABLE public.products DROP COLUMN IF EXISTS empresa_id CASCADE;
    END IF;

    -- 2. STANDARDIZE PAYMENTS
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
        UPDATE public.payments SET method = payment_method WHERE method IS NULL AND payment_method IS NOT NULL;
        UPDATE public.payments SET status = payment_status WHERE status IS NULL AND payment_status IS NOT NULL;

        ALTER TABLE public.payments DROP COLUMN IF EXISTS payment_method CASCADE;
        ALTER TABLE public.payments DROP COLUMN IF EXISTS payment_status CASCADE;
    END IF;

    -- 3. STANDARDIZE COMPANIES
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'companies') THEN
        UPDATE public.companies SET name = nome WHERE name IS NULL AND nome IS NOT NULL;
        UPDATE public.companies SET phone = telefone WHERE phone IS NULL AND telefone IS NOT NULL;

        ALTER TABLE public.companies DROP COLUMN IF EXISTS nome CASCADE;
        ALTER TABLE public.companies DROP COLUMN IF EXISTS telefone CASCADE;
    END IF;

    -- 4. FIX MULTI-TENANT (tenant_id consistency)
    -- Standardize all tables to use tenant_id as the primary isolation column
    -- If a table has company_id but no tenant_id, we can link them.
    -- (Assuming tenant_id and company_id are used interchangeably in this app)
    
    -- Ensure tenant_id is indexed for performance
    CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON public.orders(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON public.products(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON public.customers(tenant_id);

    -- 5. DATA CLEANING
    -- Fix invalid product_id in order_items
    UPDATE public.order_items 
    SET product_id = NULL 
    WHERE product_id = '00000000-0000-0000-0000-000000000000';

    -- Fix invalid tenant_id in orders (Map zero UUID to a valid company ID to avoid NOT NULL violation)
    -- We use the first found company ID: d5c49dff-ecbe-4df3-9502-0a84093a5d42
    UPDATE public.orders 
    SET tenant_id = 'd5c49dff-ecbe-4df3-9502-0a84093a5d42'::uuid 
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000';
    
    -- Also update customers and products just in case
    UPDATE public.customers SET tenant_id = 'd5c49dff-ecbe-4df3-9502-0a84093a5d42'::uuid WHERE tenant_id = '00000000-0000-0000-0000-000000000000';
    UPDATE public.products SET tenant_id = 'd5c49dff-ecbe-4df3-9502-0a84093a5d42'::uuid WHERE tenant_id = '00000000-0000-0000-0000-000000000000';
    UPDATE public.order_items SET tenant_id = 'd5c49dff-ecbe-4df3-9502-0a84093a5d42'::uuid WHERE tenant_id = '00000000-0000-0000-0000-000000000000';
END $$;

-- 6. OPTIMIZED VIEW FOR ORDERS
DROP VIEW IF EXISTS public.view_orders_detailed;
CREATE VIEW public.view_orders_detailed AS
SELECT 
    o.id as order_id,
    o.tenant_id,
    o.order_type,
    o.order_status,
    o.total as order_total,
    o.delivery_fee,
    o.created_at,
    o.notes,
    c.id as customer_id,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email,
    p.method as payment_method,
    p.status as payment_status,
    p.amount as payment_amount,
    (
        SELECT json_agg(item_data)
        FROM (
            SELECT 
                oi.id,
                oi.name as product_name,
                oi.quantity,
                oi.unit_price,
                oi.total_price,
                oi.variation,
                oi.extras,
                oi.observation
            FROM public.order_items oi
            WHERE oi.order_id = o.id
        ) item_data
    ) as items
FROM public.orders o
LEFT JOIN public.customers c ON o.customer_id = c.id
LEFT JOIN public.payments p ON o.id = p.order_id;

-- 7. NOTIFY REFRESH
NOTIFY pgrst, 'reload schema';
