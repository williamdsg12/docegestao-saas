-- Migration: Add role column to profiles for advanced admin control
-- Converts is_admin boolean to role 'admin'|'user' for better extensibility.

DO $$ BEGIN
    -- 1. Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user';
    END IF;

    -- 2. Migrate existing is_admin data to role
    UPDATE public.profiles SET role = 'admin' WHERE is_admin = true AND role != 'admin';
    
    -- 3. Ensure the main admins are set
    UPDATE public.profiles SET role = 'admin' WHERE email IN ('williamosadia94@gmail.com', 'williamdev36@gmail.com');

END $$;
