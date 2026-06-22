-- MIGRATION: V40 - PORTUGUESE ALIAS COLUMNS FOR DELIVERY TRACKING
BEGIN;

ALTER TABLE public.delivery_tracking 
ADD COLUMN IF NOT EXISTS pedido_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS entregador_id UUID REFERENCES public.entregadores(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS velocidade NUMERIC,
ADD COLUMN IF NOT EXISTS direcao NUMERIC;

-- Create unique index/constraint on pedido_id if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'delivery_tracking_pedido_id_key'
    ) THEN
        ALTER TABLE public.delivery_tracking ADD CONSTRAINT delivery_tracking_pedido_id_key UNIQUE (pedido_id);
    END IF;
END $$;

COMMIT;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
