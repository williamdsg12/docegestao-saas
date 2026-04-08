-- AFFILIATE ACTIVATION MIGRATION
-- Add affiliate status to profiles and ensure code column is correctly linked.

BEGIN;

-- 1. Add affiliate_status column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS affiliate_status text DEFAULT 'nenhum' 
CHECK (affiliate_status IN ('nenhum', 'pendente', 'ativo', 'rejeitado'));

-- 2. Add affiliate_requested_at for sorting in admin
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS affiliate_requested_at timestamptz;

-- 3. Add affiliate_approved_at
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS affiliate_approved_at timestamptz;

-- 4. Add affiliate_code to profiles for quick lookup (if not exists)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS affiliate_code text UNIQUE;

-- 4. Sync existing affiliates to profile status
UPDATE public.profiles p
SET affiliate_status = 'ativo', 
    affiliate_code = a.code
FROM public.affiliates a
WHERE p.id = a.user_id;

COMMIT;
