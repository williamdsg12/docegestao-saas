-- AFFILIATE TRACKING MIGRATION
-- This script adds the referred_by_id column to profiles and updates the signup trigger.

BEGIN;

-- 1. Add column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referred_by_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL;

-- 2. Update the handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    owner_name, 
    tenant_id, 
    company_id,
    referred_by_id
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    (NEW.raw_user_meta_data->>'referral_id')::uuid
  )
  ON CONFLICT (id) DO UPDATE SET
    referred_by_id = EXCLUDED.referred_by_id; -- Update if profile existed pre-signup (e.g. manual entry)
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
