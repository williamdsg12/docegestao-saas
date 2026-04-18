-- ==========================================
-- DOCE GESTÃO - SHOPPING LIST MODULE
-- ==========================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.lista_compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    company_id UUID,
    ingrediente_id UUID REFERENCES public.ingredientes(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    quantidade NUMERIC(15,3) NOT NULL,
    unidade TEXT NOT NULL,
    preco_unitario NUMERIC(15,4) DEFAULT 0,
    total NUMERIC(15,4) DEFAULT 0,
    fornecedor TEXT,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'comprado', 'finalizado')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.lista_compras ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Shopping List Isolation" ON public.lista_compras;
CREATE POLICY "Shopping List Isolation" ON public.lista_compras 
    FOR ALL USING (
        COALESCE(tenant_id, company_id) = (SELECT COALESCE(tenant_id, company_id) FROM public.profiles WHERE id = auth.uid())
    );

-- Add column for category in ingredientes if missing (for grouping)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ingredientes' AND column_name='categoria') THEN
        ALTER TABLE public.ingredientes ADD COLUMN categoria TEXT DEFAULT 'Geral';
    END IF;
END $$;

COMMIT;
