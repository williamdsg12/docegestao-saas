-- ==========================================
-- DOCE GESTÃO - SHOPPING LIST MODULE V2
-- ==========================================

BEGIN;

-- 1. Rename columns to match the new specification
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lista_compras' AND column_name='nome') THEN
        ALTER TABLE public.lista_compras RENAME COLUMN nome TO nome_item;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lista_compras' AND column_name='total') THEN
        ALTER TABLE public.lista_compras RENAME COLUMN total TO valor_total;
    END IF;
END $$;

-- 2. Update Status Constraint
ALTER TABLE public.lista_compras DROP CONSTRAINT IF EXISTS lista_compras_status_check;
ALTER TABLE public.lista_compras ADD CONSTRAINT lista_compras_status_check 
    CHECK (status IN ('pendente', 'comprado', 'adicionado_estoque', 'finalizado')); -- keeping finalizado for compatibility during transition

-- 3. Ensure usuario_id exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lista_compras' AND column_name='usuario_id') THEN
        ALTER TABLE public.lista_compras ADD COLUMN usuario_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

COMMIT;
