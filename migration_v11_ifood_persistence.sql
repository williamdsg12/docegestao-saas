-- Migration to add iFood-style persistence columns to orders table
BEGIN;

-- 1. distance (already exists in some variations, but standardized here)
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'distance_km') THEN
    ALTER TABLE public.orders ADD COLUMN distance_km NUMERIC;
END IF;

-- 2. estimated_time
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'estimated_time') THEN
    ALTER TABLE public.orders ADD COLUMN estimated_time TEXT;
END IF;

-- 3. duration_minutes (numeric representation for analytics)
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'duration_minutes') THEN
    ALTER TABLE public.orders ADD COLUMN duration_minutes INTEGER;
END IF;

COMMIT;
