-- ==========================================
-- SMART PRICING V2 - ADVANCED FEATURES
-- ==========================================

BEGIN;

-- 1. Enhancing 'ingredientes' table
ALTER TABLE public.ingredientes 
ADD COLUMN IF NOT EXISTS categoria text,
ADD COLUMN IF NOT EXISTS marca text,
ADD COLUMN IF NOT EXISTS unidade_compra text, -- 'kg', 'g', 'L', 'ml', 'unidade', 'caixa', 'lata', 'pacote'
ADD COLUMN IF NOT EXISTS quantidade_embalagem numeric(10,3),
ADD COLUMN IF NOT EXISTS valor_pago numeric(10,2);

-- 2. Enhancing 'receitas' table
ALTER TABLE public.receitas 
ADD COLUMN IF NOT EXISTS categoria text,
ADD COLUMN IF NOT EXISTS peso_total_estimado numeric(10,3),
ADD COLUMN IF NOT EXISTS rendimento_potes integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS gramas_por_pote integer DEFAULT 250,
ADD COLUMN IF NOT EXISTS custo_fixo_gas numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS custo_fixo_energia numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS custo_etiqueta numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS custo_colher numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS markup numeric(10,2) DEFAULT 100.00;

-- 3. Creating History table for AI and Manual Snapshots
CREATE TABLE IF NOT EXISTS public.historico_precificacao (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    receita_id uuid REFERENCES public.receitas(id) ON DELETE SET NULL,
    dados_calculo jsonb NOT NULL, -- Snapshot of all inputs
    custo_total numeric(10,2),
    venda_sugerida numeric(10,2),
    lucro_estimado numeric(10,2),
    metodo text DEFAULT 'manual', -- 'manual' or 'ai'
    created_at timestamp with time zone DEFAULT now()
);

-- RLS for Historico
ALTER TABLE public.historico_precificacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own history" ON public.historico_precificacao;
CREATE POLICY "Users can manage their own history"
ON public.historico_precificacao FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Update RLS for existing tables (ensure they are up to date)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ingredientes' AND policyname = 'Users can manage their own ingredients') THEN
        CREATE POLICY "Users can manage their own ingredients" ON public.ingredientes FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

COMMIT;
