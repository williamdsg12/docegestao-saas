-- PROFESSIONAL KDS & KANBAN EXTENSION

-- 1. Add columns for tracking preparation time
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS inicio_preparo TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pronto_em TIMESTAMPTZ;

-- 2. Add columns to products for fine-tuned control
ALTER TABLE public.menu_products 
ADD COLUMN IF NOT EXISTS tempo_preparo INT DEFAULT 15,
ADD COLUMN IF NOT EXISTS setor TEXT DEFAULT 'Cozinha';

-- 3. Create function to automatically record when preparation starts
CREATE OR REPLACE FUNCTION public.registrar_inicio_preparo()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o status mudar para 'em_preparo' e ainda não tiver um início registrado
    IF NEW.status = 'em_preparo' AND OLD.status != 'em_preparo' THEN
        NEW.inicio_preparo = NOW();
    END IF;
    
    -- Se o status mudar para 'pronto', registrar o término
    IF NEW.status = 'pronto' AND OLD.status != 'pronto' THEN
        NEW.pronto_em = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach trigger to pedidos table
DROP TRIGGER IF EXISTS trg_registrar_preparo ON public.pedidos;
CREATE TRIGGER trg_registrar_preparo
BEFORE UPDATE ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.registrar_inicio_preparo();

-- 5. Ensure fila_impressao exists for automated printing (Professional V3)
CREATE TABLE IF NOT EXISTS public.fila_impressao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES public.pedidos(id) ON DELETE CASCADE,
    setor TEXT,
    conteudo JSONB,
    status TEXT DEFAULT 'pendente',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Trigger to auto-queue printing on new orders
CREATE OR REPLACE FUNCTION public.gerar_fila_impressao()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.fila_impressao (pedido_id, status)
    VALUES (NEW.id, 'pendente');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gerar_impressao ON public.pedidos;
CREATE TRIGGER trg_gerar_impressao
AFTER INSERT ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.gerar_fila_impressao();
