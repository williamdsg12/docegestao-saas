-- MIGRATION: V41 - TEAM & DELIVERY DRIVERS CORE DATABASE SETUP
BEGIN;

-- 1. Create delivery_drivers table
CREATE TABLE IF NOT EXISTS public.delivery_drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(30),
    vehicle VARCHAR(100),
    plate VARCHAR(30),
    photo TEXT,
    status VARCHAR(30) DEFAULT 'offline', -- 'online', 'offline', 'em_entrega', 'pausado'
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    last_update TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    company_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255)
);

-- 2. Create team_role_permissions table for customizable permissions
CREATE TABLE IF NOT EXISTS public.team_role_permissions (
    company_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'admin', 'manager', 'atendente', 'caixa', 'cozinha', 'entregador'
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (company_id, role)
);

-- 3. Add driver_id column to orders and recreate public.pedidos view
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES public.delivery_drivers(id) ON DELETE SET NULL;

DROP VIEW IF EXISTS public.pedidos CASCADE;
CREATE OR REPLACE VIEW public.pedidos AS
SELECT
    id,
    tenant_id AS company_id,
    tenant_id,
    customer_id,
    customer_id AS cliente_id,
    address_id,
    total,
    total AS valor_total,
    order_status AS status,
    order_status,
    order_type,
    order_type AS tipo_pedido,
    notes,
    notes AS observacoes,
    delivery_fee,
    delivery_fee AS taxa_entrega,
    discount,
    discount AS desconto,
    latitude,
    longitude,
    created_at,
    updated_at,
    driver_id,
    driver_id AS entregador_id
FROM public.orders;

-- 4. Enable RLS (Row Level Security)
ALTER TABLE public.delivery_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_role_permissions ENABLE ROW LEVEL SECURITY;

-- 5. Set access control policies for delivery_drivers
DROP POLICY IF EXISTS "Allow public read on delivery_drivers" ON public.delivery_drivers;
CREATE POLICY "Allow public read on delivery_drivers" ON public.delivery_drivers
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow tenant insert on delivery_drivers" ON public.delivery_drivers;
CREATE POLICY "Allow tenant insert on delivery_drivers" ON public.delivery_drivers
    FOR INSERT
    TO authenticated
    WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Allow tenant update on delivery_drivers" ON public.delivery_drivers;
CREATE POLICY "Allow tenant update on delivery_drivers" ON public.delivery_drivers
    FOR UPDATE
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow tenant delete on delivery_drivers" ON public.delivery_drivers;
CREATE POLICY "Allow tenant delete on delivery_drivers" ON public.delivery_drivers
    FOR DELETE
    TO authenticated
    USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 6. Set access control policies for team_role_permissions
DROP POLICY IF EXISTS "Allow tenant read on permissions" ON public.team_role_permissions;
CREATE POLICY "Allow tenant read on permissions" ON public.team_role_permissions
    FOR SELECT
    TO authenticated
    USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Allow tenant write on permissions" ON public.team_role_permissions;
CREATE POLICY "Allow tenant write on permissions" ON public.team_role_permissions
    FOR ALL
    TO authenticated
    USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 7. Enable Supabase Realtime replication on delivery_drivers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'delivery_drivers'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_drivers;
    END IF;
END $$;

ALTER TABLE public.delivery_drivers REPLICA IDENTITY FULL;

COMMIT;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
