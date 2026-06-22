-- MIGRATION: ADD DELIVERY ADDRESS COLUMNS TO ORDERS
-- Standardizing for Driver GPS Integration

BEGIN;

-- Add TEXT columns for address parts (Denormalization for stability)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_neighborhood TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_city TEXT;

-- Sync existing data from addresses table if possible
UPDATE public.orders o
SET 
  delivery_address = a.street,
  delivery_number = a.number,
  delivery_neighborhood = a.neighborhood,
  delivery_city = a.city
FROM public.addresses a
WHERE o.address_id = a.id
AND (o.delivery_address IS NULL OR o.delivery_address = '');

COMMIT;
