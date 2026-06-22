-- SAAS & LOGISTICS EXPENSION (Doce Gestão v4)

-- 1. Companies (Standardized mapping to 'empresas')
CREATE TABLE IF NOT EXISTS public.empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    logo_url TEXT,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Entregadores (Couriers)
CREATE TABLE IF NOT EXISTS public.entregadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    telefone TEXT,
    status TEXT DEFAULT 'disponivel', -- disponivel, em_entrega, offline
    veiculo JSONB DEFAULT '{}', -- {tipo: 'moto', placa: 'ABC-123'}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Entregador Localização (GPS History)
CREATE TABLE IF NOT EXISTS public.entregador_localizacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entregador_id UUID REFERENCES public.entregadores(id) ON DELETE CASCADE,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    precisao NUMERIC,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Rotas de Entrega (Smart Logistics)
CREATE TABLE IF NOT EXISTS public.rotas_entrega (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    entregador_id UUID REFERENCES public.entregadores(id),
    pedidos_ids UUID[] NOT NULL,
    distancia_total NUMERIC,
    tempo_estimado INT, -- em minutos
    status TEXT DEFAULT 'planejado', -- planejado, em_transito, concluido
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Row Level Security (RLS) - Enforcement of Multi-Tenancy
-- Force all queries to include empresa_id/company_id check

-- Enable RLS on all tables
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregador_localizacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rotas_entrega ENABLE ROW LEVEL SECURITY;

-- Policies for Couriers
CREATE POLICY "Entregadores: multi-tenant isolation" ON public.entregadores
    FOR ALL USING (empresa_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Policies for GPS
CREATE POLICY "GPS: multi-tenant isolation" ON public.entregador_localizacao
    FOR ALL USING (entregador_id IN (SELECT id FROM entregadores WHERE empresa_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())));

-- Policies for Routes
CREATE POLICY "Rotas: multi-tenant isolation" ON public.rotas_entrega
    FOR ALL USING (empresa_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Update existing orders table to have RLS if not already
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pedidos: multi-tenant isolation" ON public.pedidos
    FOR ALL USING (empresa_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- 6. Trigger for GPS Timestamp
CREATE OR REPLACE FUNCTION update_gps_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gps_timestamp
BEFORE UPDATE ON public.entregador_localizacao
FOR EACH ROW
EXECUTE FUNCTION update_gps_timestamp();
