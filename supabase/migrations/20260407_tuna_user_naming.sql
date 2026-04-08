-- Migration to match user's requested naming convention for Tuna accounts
-- strictly following: user_id, access_token, account_id, conectado, pix_ativo, cartao_ativo

BEGIN;

-- Add new columns with the exact requested names if they don't exist
ALTER TABLE public.tuna_accounts 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS account_id TEXT,
ADD COLUMN IF NOT EXISTS conectado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pix_ativo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cartao_ativo BOOLEAN DEFAULT false;

-- Sync data from existing columns to new columns (best effort)
UPDATE public.tuna_accounts 
SET 
    account_id = tuna_account_id,
    conectado = connected,
    pix_ativo = pix_enabled,
    cartao_ativo = card_enabled
WHERE account_id IS NULL; -- only if not already set

-- Note: We keep tenant_id for system-wide multi-tenancy, 
-- but add user_id for user-specific connection as requested.

COMMIT;
