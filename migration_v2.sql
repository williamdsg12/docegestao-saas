-- Migration V2: Professional SaaS Architecture Refactor
-- This script aligns the database with the professional blueprint.

-- 1. CLIENTES (New Table for CRM)
CREATE TABLE IF NOT EXISTS public.clientes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    nome text NOT NULL,
    telefone text,
    email text,
    endereco text,
    created_at timestamp DEFAULT now()
);

-- 2. PEDIDOS (Renamed and Structure-aligned)
-- We rename or recreate from delivery_pedidos
CREATE TABLE IF NOT EXISTS public.pedidos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
    numero_pedido serial,
    tipo_pedido text CHECK (tipo_pedido IN ('delivery', 'pickup', 'mesa')),
    status text DEFAULT 'recebido' CHECK (status IN ('recebido', 'confirmado', 'em_preparo', 'pronto', 'saiu_entrega', 'entregue', 'cancelado')),
    valor_total numeric DEFAULT 0,
    taxa_entrega numeric DEFAULT 0,
    endereco_entrega text,
    observacoes text,
    payment_method text,
    created_at timestamp DEFAULT now()
);

-- 3. ITENS_PEDIDO
CREATE TABLE IF NOT EXISTS public.itens_pedido (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    pedido_id uuid REFERENCES public.pedidos(id) ON DELETE CASCADE,
    produto_id uuid, -- Reference to products table
    quantidade integer NOT NULL DEFAULT 1,
    preco numeric NOT NULL
);

-- 4. ENTREGADORES
CREATE TABLE IF NOT EXISTS public.entregadores (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    nome text NOT NULL,
    telefone text,
    status text DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'ocupado', 'inativo'))
);

-- 5. CONFIGURAÇÕES DELIVERY
CREATE TABLE IF NOT EXISTS public.configuracoes_delivery (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id uuid REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
    taxa_base numeric DEFAULT 0,
    km_maximo numeric DEFAULT 10,
    taxa_por_km numeric DEFAULT 1,
    tempo_medio integer DEFAULT 45,
    accept_orders boolean DEFAULT true,
    whatsapp_number text,
    auto_confirm_message text
);

-- 6. PAGAMENTOS
CREATE TABLE IF NOT EXISTS public.pagamentos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    pedido_id uuid REFERENCES public.pedidos(id) ON DELETE CASCADE,
    metodo text,
    status text,
    valor numeric,
    transaction_id text,
    created_at timestamp DEFAULT now()
);

-- Indices for scalability
CREATE INDEX IF NOT EXISTS idx_pedidos_empresa ON public.pedidos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido ON public.itens_pedido(pedido_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.itens_pedido;
ALTER PUBLICATION supabase_realtime ADD TABLE public.configuracoes_delivery;
