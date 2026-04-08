-- Tabela para Armazenar Configurações de Pagamento (SaaS Payment Gateway)
CREATE TABLE IF NOT EXISTS public.payment_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    tuna_client_id TEXT,
    tuna_client_secret TEXT,
    tuna_connected BOOLEAN DEFAULT false,
    pix_enabled BOOLEAN DEFAULT false,
    pix_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(tenant_id)
);

-- RLS (Row Level Security) para garantir que cada tenant só acesse seus dados
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can only view/update their own payment settings" 
ON public.payment_settings 
FOR ALL 
USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- Trigger para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION update_payment_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_settings_before_update
    BEFORE UPDATE ON public.payment_settings
    FOR EACH ROW
    EXECUTE PROCEDURE update_payment_settings_timestamp();
