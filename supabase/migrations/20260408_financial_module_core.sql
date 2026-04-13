-- Migration: 20260408_financial_module_core.sql
-- Descrição: Expantes o sistema financeiro e de pagamentos

-- 1. Adicionar sort_order na tabela de métodos de pagamento
ALTER TABLE public.company_payment_methods 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 2. Criar tabela de transações financeiras
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    order_id UUID, -- Opcional: link com a tabela de pedidos se houver
    customer_id UUID, -- Opcional: link com perfis de clientes
    
    amount DECIMAL(12,2) NOT NULL, -- Valor bruto
    net_amount DECIMAL(12,2) NOT NULL, -- Valor líquido
    fee_amount DECIMAL(12,2) DEFAULT 0.00, -- Taxas totais (Stripe + Plataforma)
    platform_fee_amount DECIMAL(12,2) DEFAULT 0.00, -- Taxa de 1% da Doce Gestão
    
    payment_method_key TEXT NOT NULL, -- 'dinheiro', 'pix', 'stripe_card', etc.
    payment_method_name TEXT NOT NULL,
    
    status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'payout', 'refund')),
    
    stripe_payment_intent_id TEXT, -- Para transações online
    
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexação para performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_tenant_id ON public.financial_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_created_at ON public.financial_transactions(created_at);

-- RLS
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can manage their own transactions" 
ON public.financial_transactions 
FOR ALL 
USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_financial_transactions_timestamp
    BEFORE UPDATE ON public.financial_transactions
    FOR EACH ROW
    EXECUTE PROCEDURE update_payment_settings_timestamp();
