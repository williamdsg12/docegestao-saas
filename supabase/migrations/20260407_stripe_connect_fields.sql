-- Migration: 20260407_stripe_connect_fields.sql
-- Descrição: Adiciona campos para integração com Stripe Connect na tabela payment_settings

-- Primeiro, garantimos que a tabela existe (caso não tenha sido criada antes por algum motivo)
CREATE TABLE IF NOT EXISTS public.payment_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(tenant_id)
);

-- Adicionar campos do Stripe Connect
ALTER TABLE public.payment_settings 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT false;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.payment_settings.stripe_account_id IS 'ID da conta Express do Stripe Connect para este tenant';
COMMENT ON COLUMN public.payment_settings.stripe_onboarding_complete IS 'Indica se o tenant completou o fluxo de onboarding da Stripe';
COMMENT ON COLUMN public.payment_settings.stripe_charges_enabled IS 'Indica se a conta Stripe do tenant está habilitada para receber pagamentos';
