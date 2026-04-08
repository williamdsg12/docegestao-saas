-- Migration: 20260407_stripe_financial_tracking.sql
-- Descrição: Tabelas para rastreamento de transações Stripe e Disputas

-- 1. Extender a tabela de orders com campos do Stripe
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_application_fee_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_fee_amount INTEGER, -- em centavos
ADD COLUMN IF NOT EXISTS net_amount INTEGER; -- valor líquido para o lojista (em centavos)

-- 2. Criar tabela de disputas/chargebacks
CREATE TABLE IF NOT EXISTS public.payment_disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    stripe_dispute_id TEXT UNIQUE NOT NULL,
    stripe_payment_intent_id TEXT,
    amount INTEGER NOT NULL, -- valor da disputa em centavos
    currency TEXT DEFAULT 'brl',
    reason TEXT,
    status TEXT DEFAULT 'warning', -- warning, needs_response, under_review, won, lost
    evidence_due_by TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE public.payment_disputes ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de RLS
CREATE POLICY "Tenants can view their own disputes" 
ON public.payment_disputes FOR SELECT 
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- 5. Comentários para documentação
COMMENT ON TABLE public.payment_disputes IS 'Rastreamento de disputas/chargebacks vinculados a transações Stripe Connect';
COMMENT ON COLUMN public.orders.stripe_payment_intent_id IS 'ID da transação principal na Stripe';
COMMENT ON COLUMN public.orders.net_amount IS 'Valor líquido que o lojista recebeu nesta venda, após taxas';
