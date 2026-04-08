-- Migration: 20260407_stripe_connect_refinements.sql
-- Descrição: Adiciona campos refinados para controle de status e repasses da Stripe

ALTER TABLE public.payment_settings 
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'pendente';

-- Atualizar comentários
COMMENT ON COLUMN public.payment_settings.stripe_payouts_enabled IS 'Indica se a conta Stripe do tenant pode realizar transferências de saída (repasses)';
COMMENT ON COLUMN public.payment_settings.stripe_account_status IS 'Status unificado da conta Stripe: pendente, ativo, restrito, etc.';
