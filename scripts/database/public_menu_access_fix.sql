-- Allow public access to view company profiles for the digital menu
-- Execute this script in your Supabase SQL Editor
DROP POLICY IF EXISTS "Public access to company profiles" ON public.companies;
CREATE POLICY "Public access to company profiles" ON public.companies 
FOR SELECT USING (true);
