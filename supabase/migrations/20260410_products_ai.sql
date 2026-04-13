-- Migração para Inteligência Artificial V3
ALTER TABLE products ADD COLUMN IF NOT EXISTS ai_score INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ai_optimized BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS marketing_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_data JSONB; -- Para permitir desfazer otimizações

-- Nota: O campo ai_score ajuda a identificar produtos que precisam de melhoria
