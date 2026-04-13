-- Create Store Settings table for "Cérebro da Loja"
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Geral
    name TEXT,
    logo_url TEXT,
    instagram TEXT,
    description TEXT,
    primary_color TEXT DEFAULT '#FF2F81',
    
    -- Funcionamento
    is_open BOOLEAN DEFAULT true,
    is_paused BOOLEAN DEFAULT false,
    opening_hours JSONB DEFAULT '{}'::jsonb,
    
    -- Entrega
    delivery_enabled BOOLEAN DEFAULT true,
    pickup_enabled BOOLEAN DEFAULT true,
    delivery_fee NUMERIC DEFAULT 0,
    delivery_radius NUMERIC DEFAULT 0,
    
    -- Pagamento
    accept_pix BOOLEAN DEFAULT true,
    accept_card BOOLEAN DEFAULT true,
    accept_cash BOOLEAN DEFAULT true,
    
    -- Notificações
    sound_enabled BOOLEAN DEFAULT true,
    auto_accept BOOLEAN DEFAULT false,
    
    -- Integrações
    webhook_url TEXT,
    whatsapp_number TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(store_id)
);

-- Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policy
DROP POLICY IF EXISTS "Tenant Isolation Store Settings" ON public.store_settings;
CREATE POLICY "Tenant Isolation Store Settings" ON public.store_settings
    FOR ALL USING (store_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.store_settings;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.store_settings
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Initial sync from tenants/companies (Optional, but recommended)
-- This would typically be run as a one-time migration or handled in the hook
