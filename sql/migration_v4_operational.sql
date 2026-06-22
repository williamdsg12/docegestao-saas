-- OPERATIONAL ENHANCEMENTS (Doce Gestão v4)

-- 1. Add serial_number and preparation tracking to pedidos
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS num_serial INTEGER;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS preparado_em TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS finalizado_em TIMESTAMP WITH TIME ZONE;

-- 2. Function to generate daily serial number
CREATE OR REPLACE FUNCTION generate_daily_serial()
RETURNS TRIGGER AS $$
DECLARE
    current_max INTEGER;
BEGIN
    -- Get the max serial for today for this company
    SELECT COALESCE(MAX(num_serial), 0) INTO current_max
    FROM public.pedidos
    WHERE company_id = NEW.company_id
    AND created_at >= CURRENT_DATE;

    NEW.num_serial := current_max + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger to auto-generate serial number on insert
DROP TRIGGER IF EXISTS trg_generate_serial ON public.pedidos;
CREATE TRIGGER trg_generate_serial
BEFORE INSERT ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION generate_daily_serial();

-- 4. Update status transition logic (optional, but good for reporting)
CREATE OR REPLACE FUNCTION update_pedidos_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'pronto' AND OLD.status != 'pronto' THEN
        NEW.preparado_em := NOW();
    ELSIF NEW.status = 'finalizado' AND OLD.status != 'finalizado' THEN
        NEW.finalizado_em := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_pedidos_timestamps ON public.pedidos;
CREATE TRIGGER trg_update_pedidos_timestamps
BEFORE UPDATE ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION update_pedidos_timestamps();
