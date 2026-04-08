-- Refatoração da Tabela para Armazenar Contas OAuth da Tuna (Modelo Sugerido)
DROP TABLE IF EXISTS public.tuna_accounts; 

CREATE TABLE public.tuna_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tuna_account_id TEXT,
    access_token TEXT,
    refresh_token TEXT,
    connected BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Habilitar RLS para tuna_accounts
ALTER TABLE public.tuna_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view/update their own tuna account" 
ON public.tuna_accounts 
FOR ALL 
USING (user_id = auth.uid());

-- Colunas de Pagamento na Tabela Orders (Garantindo que existam)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS tuna_payment_id TEXT;

-- Indexar tuna_payment_id para buscas rápidas via webhook
CREATE INDEX IF NOT EXISTS idx_orders_tuna_payment_id ON public.orders(tuna_payment_id);
