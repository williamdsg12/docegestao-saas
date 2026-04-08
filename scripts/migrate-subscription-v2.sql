-- Migration: Trial & Subscription Control v2
-- Adds trial and plan management directly to the profiles table for faster access checks.

-- 1. Add columns if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'trial_ends_at') THEN
        ALTER TABLE profiles ADD COLUMN trial_ends_at TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'plan') THEN
        ALTER TABLE profiles ADD COLUMN plan TEXT DEFAULT 'free';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_status') THEN
        ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'inactive';
    END IF;
END $$;

-- 2. Initialize trial_ends_at for existing users (14 days from signup)
UPDATE profiles 
SET trial_ends_at = created_at + INTERVAL '14 days'
WHERE trial_ends_at IS NULL;

-- 3. Set default status for active trials
UPDATE profiles
SET subscription_status = 'active'
WHERE trial_ends_at > NOW() AND (subscription_status = 'inactive' OR subscription_status IS NULL);

-- 4. Ensure Super-Admin has permanent access
UPDATE profiles
SET plan = 'pro', subscription_status = 'active'
WHERE email = 'williamdev36@gmail.com';
