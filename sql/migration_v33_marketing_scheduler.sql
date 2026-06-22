-- Migration V33: Marketing Campaign Scheduler, Birthday segment, and Campaign Delivery Logs

BEGIN;

-- 1. Add birthday to customers table
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS birthday DATE;

-- 2. Add segment to marketing_campaigns table
ALTER TABLE public.marketing_campaigns ADD COLUMN IF NOT EXISTS segment VARCHAR(50);

-- 2.5 Add campaign_id to whatsapp_message_queue
ALTER TABLE public.whatsapp_message_queue ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL;

-- 3. Recreate public.clientes view to include birthday columns
DROP VIEW IF EXISTS public.clientes CASCADE;
CREATE OR REPLACE VIEW public.clientes AS
SELECT
    id,
    tenant_id AS company_id,
    tenant_id,
    name,
    name AS nome,
    phone,
    phone AS telefone,
    email,
    is_vip,
    is_vip AS cliente_vip,
    full_name,
    full_name AS nome_completo,
    cpf_cnpj,
    cpf_cnpj AS cpf,
    cep,
    address,
    address AS endereco,
    number,
    number AS numero,
    neighborhood,
    neighborhood AS bairro,
    city,
    city AS cidade,
    state,
    state AS estado,
    complement,
    complement AS complemento,
    reference_point,
    reference_point AS ponto_referencia,
    total_orders,
    total_orders AS total_pedidos,
    total_spent,
    total_spent AS total_gasto,
    last_order_at,
    last_order_at AS ultimo_pedido,
    birthday,
    birthday AS data_nascimento,
    created_at,
    updated_at
FROM public.customers;

-- 4. Create campaign_logs table for campaign target delivery tracking
CREATE TABLE IF NOT EXISTS public.campaign_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
    customer_id UUID,
    phone VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Pendente' NOT NULL CHECK (status IN ('Entregue', 'Falhou', 'Pendente')),
    error TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for campaign_logs
ALTER TABLE public.campaign_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for campaign_logs
DROP POLICY IF EXISTS "campaign_logs: tenant isolation" ON public.campaign_logs;
CREATE POLICY "campaign_logs: tenant isolation" ON public.campaign_logs
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Enable Realtime replication for campaign_logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr
        JOIN pg_class c ON c.oid = pr.prrelid
        JOIN pg_publication p ON p.oid = pr.prpubid
        WHERE p.pubname = 'supabase_realtime' AND c.relname = 'campaign_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_logs;
    END IF;
END $$;

COMMIT;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
