-- Migration to add iFood-style persistence columns to orders table
-- Using PostgreSQL standard 'ADD COLUMN IF NOT EXISTS' syntax

BEGIN;

-- 1. distance_km
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS distance_km NUMERIC;

-- 2. estimated_time
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_time TEXT;

-- 3. duration_minutes (numeric representation for analytics)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

COMMIT;
