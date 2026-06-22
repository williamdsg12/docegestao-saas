-- MIGRATION: V39 - REALTIME DELIVERY GPS COORDINATES SYNC
BEGIN;

-- 1. Add foto_url to public.entregadores table
ALTER TABLE public.entregadores ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- 2. Create sync trigger function
CREATE OR REPLACE FUNCTION sync_courier_gps_to_delivery_tracking()
RETURNS TRIGGER AS $$
BEGIN
  -- Update existing delivery_tracking rows for active orders assigned to this courier
  UPDATE public.delivery_tracking dt
  SET latitude = NEW.latitude,
      longitude = NEW.longitude,
      updated_at = NOW()
  FROM public.entregas e
  JOIN public.orders o ON o.id = e.pedido_id
  WHERE e.entregador_id = NEW.entregador_id
    AND dt.order_id = e.pedido_id
    AND o.order_status IN ('saiu_entrega', 'a_caminho', 'no_caminho', 'chegou');

  -- Insert new delivery_tracking rows for active orders assigned to this courier if they don't exist
  INSERT INTO public.delivery_tracking (delivery_person_id, order_id, latitude, longitude, updated_at)
  SELECT NEW.entregador_id, e.pedido_id, NEW.latitude, NEW.longitude, NOW()
  FROM public.entregas e
  JOIN public.orders o ON o.id = e.pedido_id
  WHERE e.entregador_id = NEW.entregador_id
    AND o.order_status IN ('saiu_entrega', 'a_caminho', 'no_caminho', 'chegou')
  ON CONFLICT (order_id) DO UPDATE
  SET latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Bind trigger to public.entregador_localizacao
DROP TRIGGER IF EXISTS trg_sync_courier_gps_to_delivery_tracking ON public.entregador_localizacao;
CREATE TRIGGER trg_sync_courier_gps_to_delivery_tracking
AFTER INSERT OR UPDATE ON public.entregador_localizacao
FOR EACH ROW
EXECUTE FUNCTION sync_courier_gps_to_delivery_tracking();

COMMIT;

-- Force reload schema
NOTIFY pgrst, 'reload schema';
