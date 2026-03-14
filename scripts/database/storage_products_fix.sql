-- STORAGE SETUP FOR PRODUCT IMAGES
-- This script creates the 'products' bucket and sets up public access and authenticated upload.

-- 1. Create the 'products' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 2. Set up Public Access (Allow anyone to view product images)
DROP POLICY IF EXISTS "Public Access to Products" ON storage.objects;
CREATE POLICY "Public Access to Products" ON storage.objects
FOR SELECT USING (bucket_id = 'products');

-- 3. Set up Authenticated Upload (Allow users to upload to their own company's space)
-- Note: Simplified policy allowing all authenticated users to upload to 'products' bucket.
-- In a production environment, you might want to restrict this further (e.g. check company_id in metadata).
DROP POLICY IF EXISTS "Authenticated Upload to Products" ON storage.objects;
CREATE POLICY "Authenticated Upload to Products" ON storage.objects
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'products');

-- 4. Set up Delete Policy
DROP POLICY IF EXISTS "Allow Delete Products" ON storage.objects;
CREATE POLICY "Allow Delete Products" ON storage.objects
FOR DELETE TO authenticated 
USING (bucket_id = 'products');
