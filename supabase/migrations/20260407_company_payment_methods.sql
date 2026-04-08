-- Migration: 20260407_company_payment_methods.sql
-- Descrição: Tabela para gerenciar métodos de pagamento (Manuais e Online) por tenant

CREATE TABLE IF NOT EXISTS public.company_payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    method_key TEXT NOT NULL, -- 'dinheiro', 'cartao_manual', 'pix_tuna', 'cartao_tuna'
    method_name TEXT NOT NULL,
    method_type TEXT NOT NULL CHECK (method_type IN ('manual', 'online')),
    is_enabled BOOLEAN DEFAULT false,
    
    -- Regras por tipo de pedido
    is_active_delivery BOOLEAN DEFAULT true,
    is_active_pickup BOOLEAN DEFAULT true,
    is_active_local BOOLEAN DEFAULT true,
    
    -- Configurações avançadas
    instructions TEXT,
    payment_code TEXT,
    fee_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(tenant_id, method_key)
);

-- RLS
ALTER TABLE public.company_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can manage their own payment methods" 
ON public.company_payment_methods 
FOR ALL 
USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_company_payment_methods_timestamp
    BEFORE UPDATE ON public.company_payment_methods
    FOR EACH ROW
    EXECUTE PROCEDURE update_payment_settings_timestamp();

-- Seed inicial para tenants existentes (Dinheiro e Cartão Manual)
INSERT INTO public.company_payment_methods (tenant_id, method_key, method_name, method_type, is_enabled)
SELECT id, 'dinheiro', 'Dinheiro', 'manual', true FROM public.tenants
ON CONFLICT (tenant_id, method_key) DO NOTHING;

INSERT INTO public.company_payment_methods (tenant_id, method_key, method_name, method_type, is_enabled)
SELECT id, 'cartao_manual', 'Cartão', 'manual', true FROM public.tenants
ON CONFLICT (tenant_id, method_key) DO NOTHING;
