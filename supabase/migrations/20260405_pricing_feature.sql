-- ==========================================
-- SMART PRICING FEATURE MIGRATION
-- ==========================================

BEGIN;

-- 0. Limpeza de conflitos (Se existir como visualização, remover para virar tabela)
DO $$ 
BEGIN
    -- Se existir uma view com esse nome (comum em camadas de compatibilidade), removemos
    IF (SELECT count(*) FROM pg_views WHERE schemaname = 'public' AND viewname = 'ingredientes') > 0 THEN
        DROP VIEW public.ingredientes CASCADE;
    END IF;
END $$;

-- 1. Tabelas Principais
CREATE TABLE IF NOT EXISTS public.ingredientes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    nome text NOT NULL,
    preco_total numeric(10,2) NOT NULL DEFAULT 0,
    quantidade_total numeric(10,3) NOT NULL DEFAULT 0,
    unidade text NOT NULL, -- g, kg, ml, unidade
    custo_unitario numeric(10,4) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- Garantir que as colunas existem (caso a tabela tenha sido criada parcialmente)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ingredientes' AND column_name='user_id') THEN
        ALTER TABLE public.ingredientes ADD COLUMN user_id uuid REFERENCES auth.users(id);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.receitas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    nome text NOT NULL,
    rendimento numeric(10,2) NOT NULL DEFAULT 1,
    embalagem numeric(10,2) DEFAULT 0,
    mao_obra numeric(10,2) DEFAULT 0,
    margem numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.receita_ingredientes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    receita_id uuid REFERENCES public.receitas(id) ON DELETE CASCADE NOT NULL,
    ingrediente_id uuid REFERENCES public.ingredientes(id) ON DELETE RESTRICT NOT NULL,
    quantidade numeric(10,3) NOT NULL
);

-- 2. Trigger para Calcular Custo Unitário do Ingrediente
CREATE OR REPLACE FUNCTION public.fn_update_custo_unitario()
RETURNS trigger AS $$
BEGIN
    IF NEW.quantidade_total > 0 THEN
        NEW.custo_unitario := NEW.preco_total / NEW.quantidade_total;
    ELSE
        NEW.custo_unitario := 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_custo_unitario ON public.ingredientes;
CREATE TRIGGER tr_update_custo_unitario
BEFORE INSERT OR UPDATE OF preco_total, quantidade_total ON public.ingredientes
FOR EACH ROW EXECUTE FUNCTION public.fn_update_custo_unitario();

-- 3. RPC para Calcular Custos da Receita
CREATE OR REPLACE FUNCTION public.get_recipe_details(p_recipe_id uuid)
RETURNS json AS $$
DECLARE
    v_receita record;
    v_custo_ingredientes numeric := 0;
    v_custo_unitario_base numeric := 0;
    v_custo_final numeric := 0;
    v_preco_venda numeric := 0;
    v_lucro numeric := 0;
BEGIN
    -- Busca dados da receita
    SELECT * INTO v_receita FROM public.receitas WHERE id = p_recipe_id;
    
    IF v_receita IS NULL THEN
        RETURN NULL;
    END IF;

    -- Calcula faturamento dos ingredientes
    SELECT COALESCE(SUM(ri.quantidade * i.custo_unitario), 0)
    INTO v_custo_ingredientes
    FROM public.receita_ingredientes ri
    JOIN public.ingredientes i ON ri.ingrediente_id = i.id
    WHERE ri.receita_id = p_recipe_id;

    -- Cálculos
    v_custo_unitario_base := CASE WHEN v_receita.rendimento > 0 THEN v_custo_ingredientes / v_receita.rendimento ELSE 0 END;
    v_custo_final := v_custo_unitario_base + COALESCE(v_receita.embalagem, 0) + COALESCE(v_receita.mao_obra, 0);
    
    -- Preço = Custo Final / (1 - Margem)
    -- Se margem for 0.6 (60%), divide por 0.4
    IF v_receita.margem < 1 THEN
        v_preco_venda := v_custo_final / (1 - v_receita.margem);
    ELSE
        -- Fallback para evitar divisão por zero ou negativa se margem >= 1
        v_preco_venda := v_custo_final * 2;
    END IF;

    v_lucro := v_preco_venda - v_custo_final;

    RETURN json_build_object(
        'custo_total_receita', v_custo_ingredientes,
        'custo_unitario_base', v_custo_unitario_base,
        'custo_final', v_custo_final,
        'preco_sugerido', v_preco_venda,
        'lucro_por_unidade', v_lucro,
        'margem_percentual', v_receita.margem * 100
    );
END;
$$ LANGUAGE plpgsql;

-- 4. RLS (Row Level Security)
ALTER TABLE public.ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receita_ingredientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own ingredients" ON public.ingredientes;
CREATE POLICY "Users can manage their own ingredients"
ON public.ingredientes FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own recipes" ON public.receitas;
CREATE POLICY "Users can manage their own recipes"
ON public.receitas FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their recipe ingredients" ON public.receita_ingredientes;
CREATE POLICY "Users can manage their recipe ingredients"
ON public.receita_ingredientes FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.receitas r 
        WHERE r.id = receita_id AND r.user_id = auth.uid()
    )
);

COMMIT;
