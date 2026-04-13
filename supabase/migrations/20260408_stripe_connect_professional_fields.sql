-- Migration: 20260408_stripe_connect_professional_fields.sql
-- Descrição: Adiciona colunas profissionais para o rastreamento arquitetural do Stripe Connect

ALTER TABLE public.payment_settings 
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_account_status TEXT; -- Já existia no código, mas garantindo em DB

-- Comentários
COMMENT ON COLUMN public.payment_settings.stripe_payouts_enabled IS 'Indica se a conta Stripe pode realizar repasses de saldo';
COMMENT ON COLUMN public.payment_settings.stripe_details_submitted IS 'Indica se o lojista já submeteu as informações básicas na Stripe';
COMMENT ON COLUMN public.payment_settings.stripe_account_status IS 'Status amigável (ativo, restrito, em análise)';
