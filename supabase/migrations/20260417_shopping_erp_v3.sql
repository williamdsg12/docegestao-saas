-- ==========================================
-- DOCE GESTÃO - ERP SHOPPING & INVOICES V3
-- ==========================================

BEGIN;

-- 1. Tabela de Compras (Notas Fiscais / Invoices)
CREATE TABLE IF NOT EXISTS public.compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    company_id UUID,
    fornecedor TEXT,
    cnpj_fornecedor TEXT,
    numero_nota TEXT,
    valor_total NUMERIC(15,2) DEFAULT 0,
    data_compra TIMESTAMPTZ DEFAULT NOW(),
    usuario_id UUID,
    xml_referencia TEXT, -- Opcional: Armazenar o XML ou link
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Adicionar vinculação em estoque_movimentacoes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='estoque_movimentacoes' AND column_name='compra_id') THEN
        ALTER TABLE public.estoque_movimentacoes ADD COLUMN compra_id UUID REFERENCES public.compras(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Habilitar RLS e Políticas
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Compras Isolation" ON public.compras;
CREATE POLICY "Compras Isolation" ON public.compras 
    FOR ALL USING (
        COALESCE(tenant_id, company_id) = (SELECT COALESCE(tenant_id, company_id) FROM public.profiles WHERE id = auth.uid())
    );

COMMIT;
