-- FINAL PUBLIC ACCESS FIX FOR DIGITAL MENU
-- This script ensures that customers can view the company info, categories, and products.

-- 1. COMPANIES (Allow public select for the menu to work)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to company profiles" ON public.companies;
CREATE POLICY "Public access to company profiles" ON public.companies
FOR SELECT USING (true);

-- 2. MENU_CATEGORIES (Ensure active categories are visible)
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to menu categories" ON public.menu_categories;
CREATE POLICY "Public access to menu categories" ON public.menu_categories
FOR SELECT USING (active = true);

-- 3. MENU_PRODUCTS (Ensure active products are visible)
ALTER TABLE public.menu_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to menu products" ON public.menu_products;
CREATE POLICY "Public access to menu products" ON public.menu_products
FOR SELECT USING (active = true);

-- 4. PROFILES (Keep restricted but ensure company profiles can link)
-- No changes needed here, profiles should remain private.
