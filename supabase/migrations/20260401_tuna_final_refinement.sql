-- Final refinement for Tuna Integration
-- Adds missing columns to tuna_accounts to match user requirements

BEGIN;

-- Ensure columns exist in tuna_accounts
ALTER TABLE public.tuna_accounts 
ADD COLUMN IF NOT EXISTS pix_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS card_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN DEFAULT true;

-- Ensure consistency with tenant_id (if it was user_id before)
-- The existing migration 20260331_tuna_oauth_full.sql already uses tenant_id.
-- If any old version used user_id, we should handle it, but based on my view_file, it uses tenant_id.

COMMIT;
