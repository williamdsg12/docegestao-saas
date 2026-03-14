-- MIGRATION: Add Segment Column to Companies Table
-- This column is required for identifying the business niche (e.g., Confeitaria Gourmet, Bolos Artesanais)

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='segment') THEN
        ALTER TABLE public.companies ADD COLUMN segment text;
    END IF;
END $$;
