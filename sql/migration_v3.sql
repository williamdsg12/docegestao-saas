-- Migration V3: Automations, Marketing & Logistics
-- Standardizing status, adding coupons, loyalty, tracking and printing tables.

-- 1. UPDATE PEDIDOS STATUS CONSTRAINT
ALTER TABLE public.pedidos DROP CONSTRAINT IF EXISTS pedidos_status_check;
ALTER TABLE public.pedidos ADD CONSTRAINT pedidos_status_check 
CHECK (status IN ('novo', 'confirmado', 'em_preparo', 'pronto', 'aguardando_entregador', 'saiu_entrega', 'entregue', 'cancelado'));

-- 2. CUPONS (Marketing System)
CREATE TABLE IF NOT EXISTS public.cupons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    codigo text UNIQUE NOT NULL,
    tipo text CHECK (tipo IN ('percentual', 'fixo', 'frete_gratis')),
    valor numeric NOT NULL,
    valor_minimo numeric DEFAULT 0,
    limite_uso integer DEFAULT 100,
    usos integer DEFAULT 0,
    validade_inicio timestamp with time zone DEFAULT now(),
    validade_fim timestamp with time zone,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.uso_cupons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cupom_id uuid REFERENCES public.cupons(id) ON DELETE CASCADE,
    cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE,
    pedido_id uuid REFERENCES public.pedidos(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. FIDELIDADE (Points & Tiers)
CREATE TABLE IF NOT EXISTS public.fidelidade_clientes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE,
    pontos integer DEFAULT 0,
    nivel text DEFAULT 'bronze' CHECK (nivel IN ('bronze', 'prata', 'ouro', 'diamante')),
    UNIQUE(empresa_id, cliente_id)
);

CREATE TABLE IF NOT EXISTS public.historico_pontos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE,
    pontos integer NOT NULL,
    tipo text NOT NULL CHECK (tipo IN ('ganho', 'resgate')),
    pedido_id uuid REFERENCES public.pedidos(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recompensas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    nome text NOT NULL,
    pontos_necessarios integer NOT NULL,
    descricao text,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. RASTREAMENTO (Real-time Logistics)
CREATE TABLE IF NOT EXISTS public.entregador_localizacao (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    entregador_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    latitude numeric NOT NULL,
    longitude numeric NOT NULL,
    ultima_atualizacao timestamp with time zone DEFAULT now()
);

-- 5. IMPRESSÃO (Hardware Integration)
CREATE TABLE IF NOT EXISTS public.impressoras (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    nome text NOT NULL,
    ip text,
    porta integer DEFAULT 9100,
    setor text NOT NULL DEFAULT 'cozinha',
    tipo text DEFAULT 'termica_80mm',
    ativa boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fila_impressao (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    pedido_id uuid REFERENCES public.pedidos(id) ON DELETE CASCADE,
    status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'imprimindo', 'impresso', 'erro')),
    tentativas integer DEFAULT 0,
    ultimo_erro text,
    created_at timestamp with time zone DEFAULT now()
);

-- Add setor_impressao to products
ALTER TABLE public.menu_products ADD COLUMN IF NOT EXISTS setor_impressao text DEFAULT 'cozinha';

-- 6. TRIGGERS (Automations)
-- Auto-queue printing on new order
CREATE OR REPLACE FUNCTION public.trigger_auto_print_queue()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.fila_impressao (empresa_id, pedido_id)
    VALUES (NEW.empresa_id, NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_impressao ON public.pedidos;
CREATE TRIGGER trigger_impressao
AFTER INSERT ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.trigger_auto_print_queue();

-- Auto-credit loyalty points on delivered
CREATE OR REPLACE FUNCTION public.trigger_credit_loyalty_points()
RETURNS trigger AS $$
DECLARE
    points_to_add integer;
BEGIN
    IF NEW.status = 'entregue' AND OLD.status != 'entregue' THEN
        -- Calculate points: R$ 1 = 1 point
        points_to_add := FLOOR(NEW.valor_total);
        
        IF points_to_add > 0 THEN
            INSERT INTO public.fidelidade_clientes (empresa_id, cliente_id, pontos)
            VALUES (NEW.empresa_id, NEW.cliente_id, points_to_add)
            ON CONFLICT (empresa_id, cliente_id) 
            DO UPDATE SET pontos = public.fidelidade_clientes.pontos + EXCLUDED.pontos;
            
            INSERT INTO public.historico_pontos (cliente_id, pontos, tipo, pedido_id)
            VALUES (NEW.cliente_id, points_to_add, 'ganho', NEW.id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_loyalty ON public.pedidos;
CREATE TRIGGER trigger_loyalty
AFTER UPDATE ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.trigger_credit_loyalty_points();

-- Function to increment coupon usage
CREATE OR REPLACE FUNCTION public.incrementar_uso_cupom(coupon_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.cupons
    SET usos = usos + 1
    WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.cupons;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fidelidade_clientes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.entregador_localizacao;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fila_impressao;
