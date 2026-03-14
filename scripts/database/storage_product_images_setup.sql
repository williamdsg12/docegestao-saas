-- MASTER STORAGE SETUP FOR PRODUCT IMAGES (REFINED)
-- This script creates the 'product-images' bucket exactly as requested by the user.

-- 1. Create the 'product-images' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 2. Public Access Policy (Allow customers to see photos)
DROP POLICY IF EXISTS "public_select_product_images" ON storage.objects;
CREATE POLICY "public_select_product_images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- 3. Authenticated Insert Policy (Allow sellers to upload)
DROP POLICY IF EXISTS "auth_insert_product_images" ON storage.objects;
CREATE POLICY "auth_insert_product_images" ON storage.objects
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'product-images');

-- 4. Authenticated Delete Policy (Allow sellers to remove photos)
DROP POLICY IF EXISTS "auth_delete_product_images" ON storage.objects;
CREATE POLICY "auth_delete_product_images" ON storage.objects
FOR DELETE TO authenticated 
USING (bucket_id = 'product-images');

-- 5. Authenticated Update Policy
DROP POLICY IF EXISTS "auth_update_product_images" ON storage.objects;
CREATE POLICY "auth_update_product_images" ON storage.objects
FOR UPDATE TO authenticated 
USING (bucket_id = 'product-images');
