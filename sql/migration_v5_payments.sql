-- Migration V5: Payments Integration
-- Table to store PIX and other payment transactions

CREATE TABLE IF NOT EXISTS public.pagamentos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    pedido_id uuid REFERENCES public.pedidos(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    gateway text DEFAULT 'mercadopago',
    valor numeric NOT NULL,
    status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'cancelado', 'estornado', 'falha')),
    qr_code text, -- PIX Copy-Paste
    qr_code_base64 text, -- Base64 for Image rendering
    payment_id text, -- Gateway reference ID
    external_reference text, -- Our own reference
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- Owner Isolation (Admin Dashboard)
DROP POLICY IF EXISTS "pagamentos_owner_isolation" ON public.pagamentos;
CREATE POLICY "pagamentos_owner_isolation" ON public.pagamentos
    FOR ALL TO authenticated
    USING (company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id'))
    WITH CHECK (company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id'));

-- Public Select (Customer Checkout tracking)
DROP POLICY IF EXISTS "pagamentos_public_select" ON public.pagamentos;
CREATE POLICY "pagamentos_public_select" ON public.pagamentos
    FOR SELECT TO anon, authenticated
    USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pagamentos_pedido ON public.pagamentos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_company ON public.pagamentos(company_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_payment_id ON public.pagamentos(payment_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.pagamentos;
