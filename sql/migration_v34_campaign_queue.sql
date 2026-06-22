-- Migration V34: Campaign queue table and Abandoned Carts multiple stage recovery support

BEGIN;

-- 1. Create campaign_queue table
CREATE TABLE IF NOT EXISTS public.campaign_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    phone VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    error TEXT,
    attempts INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Alter existing abandoned_carts table to match new specs
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    phone VARCHAR(50) NOT NULL,
    client_name VARCHAR(255),
    cart_link TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'recovered', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    recovered_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.abandoned_carts ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.abandoned_carts ADD COLUMN IF NOT EXISTS cart_id TEXT;
ALTER TABLE public.abandoned_carts ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.abandoned_carts ADD COLUMN IF NOT EXISTS recovery_stage INTEGER DEFAULT 0 NOT NULL;

-- 3. Enable RLS
ALTER TABLE public.campaign_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
DROP POLICY IF EXISTS "campaign_queue: tenant isolation" ON public.campaign_queue;
CREATE POLICY "campaign_queue: tenant isolation" ON public.campaign_queue
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "abandoned_carts: tenant isolation" ON public.abandoned_carts;
CREATE POLICY "abandoned_carts: tenant isolation" ON public.abandoned_carts
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Enable Realtime replication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr
        JOIN pg_class c ON c.oid = pr.prrelid
        JOIN pg_publication p ON p.oid = pr.prpubid
        WHERE p.pubname = 'supabase_realtime' AND c.relname = 'campaign_queue'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_queue;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr
        JOIN pg_class c ON c.oid = pr.prrelid
        JOIN pg_publication p ON p.oid = pr.prpubid
        WHERE p.pubname = 'supabase_realtime' AND c.relname = 'abandoned_carts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.abandoned_carts;
    END IF;
END $$;

COMMIT;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
