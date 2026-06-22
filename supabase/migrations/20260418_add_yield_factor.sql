-- ==========================================
-- ADD YIELD FACTOR & PRICING REFACTOR
-- ==========================================

BEGIN;

-- 1. Adicionar coluna de fator de rendimento
ALTER TABLE public.ingredientes 
ADD COLUMN IF NOT EXISTS fator_rendimento numeric DEFAULT 1.0;

-- 2. Comentários para documentar o uso das colunas existentes para precificação
-- preco_total -> Agora deve ser interpretado explicitamente como PREÇO DA EMBALAGEM
-- quantidade_total -> Agora deve ser interpretado explicitamente como QUANTIDADE NA EMBALAGEM

COMMENT ON COLUMN public.ingredientes.preco_total IS 'Preço total da embalagem original de compra';
COMMENT ON COLUMN public.ingredientes.quantidade_total IS 'Conteúdo total da embalagem na unidade de medida (ex: 30 un, 395g)';
COMMENT ON COLUMN public.ingredientes.fator_rendimento IS 'Fator de aproveitamento (ex: 1.0 = 100%, 0.9 = 90% útil)';
COMMENT ON COLUMN public.ingredientes.custo_medio IS 'Custo por unidade base (g, ml, un) já considerando o rendimento';

COMMIT;
