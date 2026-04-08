-- ==========================================
-- SMART PRICING AUTOMATION UPGRADE
-- ==========================================

BEGIN;

-- 1. Alterar tabelas existentes
ALTER TABLE public.receitas ADD COLUMN IF NOT EXISTS margem_minima numeric DEFAULT 0.3;
ALTER TABLE public.receitas ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Garantir colunas de ficha técnica (caso a tabela tenha sido criada em migrações passadas sem elas)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='receitas' AND column_name='rendimento') THEN
        ALTER TABLE public.receitas ADD COLUMN rendimento numeric(10,2) DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='receitas' AND column_name='embalagem') THEN
        ALTER TABLE public.receitas ADD COLUMN embalagem numeric(10,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='receitas' AND column_name='mao_obra') THEN
        ALTER TABLE public.receitas ADD COLUMN mao_obra numeric(10,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='receitas' AND column_name='margem') THEN
        ALTER TABLE public.receitas ADD COLUMN margem numeric(10,2) DEFAULT 0;
    END IF;
END $$;

-- Adicionar colunas na tabela products (base do cardápio)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS receita_id uuid REFERENCES public.receitas(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS preco_manual boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 2. RPC calcular_preco (Versão otimizada que retorna o preço sugerido diretamente)
CREATE OR REPLACE FUNCTION public.calcular_preco(p_recipe_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_details json;
BEGIN
    -- Reutiliza a lógica existente (get_recipe_details) para manter uma única fonte da verdade
    v_details := public.get_recipe_details(p_recipe_id);
    
    IF v_details IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN jsonb_build_object(
        'preco', (v_details->>'preco_sugerido')::numeric,
        'custo', (v_details->>'custo_final')::numeric,
        'margem', (v_details->>'margem_percentual')::numeric / 100
    );
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger Function para Atualização Automática
CREATE OR REPLACE FUNCTION public.atualizar_preco_produto_webhook()
RETURNS trigger AS $$
DECLARE
    v_result jsonb;
BEGIN
    -- Busca o novo cálculo
    v_result := public.calcular_preco(NEW.id);

    IF v_result IS NOT NULL THEN
        -- Atualiza a tabela de produtos vinculada
        UPDATE public.products
        SET price = (v_result->>'preco')::numeric,
            updated_at = now()
        WHERE receita_id = NEW.id
        AND preco_manual = false;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger disparado após qualquer mudança na receita (que afete o preço)
DROP TRIGGER IF EXISTS trigger_atualizar_preco ON public.receitas;
CREATE TRIGGER trigger_atualizar_preco
AFTER UPDATE OF rendimento, embalagem, mao_obra, margem, updated_at ON public.receitas
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_preco_produto_webhook();

-- 4. Triggers de Cascata: Quando mudar ingrediente ou ficha técnica, forçar atualização da receita
CREATE OR REPLACE FUNCTION public.disparar_update_receita_por_ingrediente()
RETURNS trigger AS $$
BEGIN
    UPDATE public.receitas SET updated_at = now() WHERE id = COALESCE(NEW.receita_id, OLD.receita_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_preco_ingredientes ON public.receita_ingredientes;
CREATE TRIGGER trigger_sync_preco_ingredientes
AFTER INSERT OR UPDATE OR DELETE ON public.receita_ingredientes
FOR EACH ROW
EXECUTE FUNCTION public.disparar_update_receita_por_ingrediente();

-- Sincronizar quando o preço base do ingrediente mudar
CREATE OR REPLACE FUNCTION public.disparar_update_receitas_dependentes()
RETURNS trigger AS $$
BEGIN
    UPDATE public.receitas 
    SET updated_at = now() 
    WHERE id IN (SELECT receita_id FROM public.receita_ingredientes WHERE ingrediente_id = NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_preco_base_ingrediente ON public.ingredientes;
CREATE TRIGGER trigger_sync_preco_base_ingrediente
AFTER UPDATE OF preco_total, quantidade_total ON public.ingredientes
FOR EACH ROW
EXECUTE FUNCTION public.disparar_update_receitas_dependentes();

COMMIT;
