-- Sales Machine (Funil Automático) Migration
-- Date: 2026-05-05

BEGIN;

-- 1. Leads Table (Potential Customers)
CREATE TABLE IF NOT EXISTS public.leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    phone text NOT NULL,
    name text,
    status text DEFAULT 'novo' CHECK (status IN ('novo', 'engajado', 'cliente', 'perdido')),
    source text DEFAULT 'whatsapp',
    created_at timestamp with time zone DEFAULT now(),
    last_interaction_at timestamp with time zone DEFAULT now()
);

-- 2. Sales Conversations (Bot Stages)
CREATE TABLE IF NOT EXISTS public.sales_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
    stage text DEFAULT 'entrada' CHECK (stage IN ('entrada', 'pedido', 'pagamento', 'finalizado')),
    is_active boolean DEFAULT true,
    last_bot_message text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Update Orders with Payment Integration
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pendente' CHECK (payment_status IN ('pendente', 'pago', 'cancelado', 'estornado')),
ADD COLUMN IF NOT EXISTS pix_copy_paste text,
ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamp with time zone;

-- 4. Expanded Automations (Refining Revenue Automations)
ALTER TABLE public.revenue_automations 
DROP CONSTRAINT IF EXISTS revenue_automations_trigger_type_check;

ALTER TABLE public.revenue_automations 
ADD CONSTRAINT revenue_automations_trigger_type_check 
CHECK (trigger_type IN (
    'abandoned_cart_10m', 
    'abandoned_cart_1h', 
    'abandoned_cart_24h', 
    'order_completed', 
    'reactivation_7d', 
    'reactivation_15d',
    'new_lead_welcome'
));

-- 5. Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own leads" ON public.leads
    FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage their own sales conversations" ON public.sales_conversations
    FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Initial Automation Rules for all tenants (example)
-- This would usually be handled by a trigger or at tenant creation
-- For now, we just ensure the structure is ready.

COMMIT;
