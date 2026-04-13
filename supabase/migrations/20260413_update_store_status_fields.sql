-- Update store_settings to support Single Source of Truth status logic
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS manual_status TEXT DEFAULT 'open',
ADD COLUMN IF NOT EXISTS is_manual_override BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.store_settings.manual_status IS 'Manual override status: open, closed, or paused';
COMMENT ON COLUMN public.store_settings.is_manual_override IS 'When true, ignores calculated schedule and uses manual_status';

-- Ensure values are restricted
ALTER TABLE public.store_settings 
DROP CONSTRAINT IF EXISTS check_manual_status;

ALTER TABLE public.store_settings 
ADD CONSTRAINT check_manual_status 
CHECK (manual_status IN ('open', 'closed', 'paused'));
