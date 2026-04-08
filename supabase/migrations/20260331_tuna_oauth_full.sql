-- Tabela para Armazenar Contas OAuth da Tuna (Modelo Parceiro)
CREATE TABLE IF NOT EXISTS public.tuna_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    tuna_account_id TEXT,
    access_token TEXT,
    refresh_token TEXT,
    connected BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(tenant_id)
);

-- Habilitar RLS para tuna_accounts
ALTER TABLE public.tuna_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view/update their own tuna settings" 
ON public.tuna_accounts 
FOR ALL 
USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- Adicionar Colunas de Pagamento na Tabela Orders (ou Pedidos)
-- O sistema usa a tabela 'orders' para o motor principal
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS tuna_payment_id TEXT;

-- Indexar tuna_payment_id para buscas rápidas via webhook
CREATE INDEX IF NOT EXISTS idx_orders_tuna_payment_id ON public.orders(tuna_payment_id);
