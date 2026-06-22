-- ==========================================
-- MIGRATION V5: PROFESSIONAL SAAS ARCHITECTURE (RECURSION FIX)
-- ==========================================
-- Standardizing to English table names, English columns, and tenant_id
-- FIX: Removed infinite recursion in Profiles RLS policy
-- ==========================================

BEGIN;

-- 1. TENANTS (Lojas)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';

-- 3. CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  last_order_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, phone)
);

-- 4. ADDRESSES
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  street TEXT,
  number TEXT,
  city TEXT,
  neighborhood TEXT,
  state TEXT,
  zip TEXT,
  lat NUMERIC,
  lng NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. PRODUCT CATEGORIES
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  order_type TEXT,
  num_serial SERIAL,
  total NUMERIC DEFAULT 0,
  delivery_fee NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  courier_id UUID, 
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT status_check CHECK (
    status IN ('pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')
  )
);

-- 8. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  min_value NUMERIC DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, code)
);

-- 10. DELIVERY SETTINGS
CREATE TABLE IF NOT EXISTS public.delivery_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  base_fee NUMERIC DEFAULT 0,
  fee_per_km NUMERIC DEFAULT 0,
  max_km NUMERIC DEFAULT 0,
  whatsapp_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 11. TRACKING
CREATE TABLE IF NOT EXISTS public.menu_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_views ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid errors on re-run
DROP POLICY IF EXISTS "Tenant Isolation Tenants" ON public.tenants;
DROP POLICY IF EXISTS "Tenant Isolation Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Tenant Isolation Customers" ON public.customers;
DROP POLICY IF EXISTS "Tenant Isolation Addresses" ON public.addresses;
DROP POLICY IF EXISTS "Tenant Isolation Categories" ON public.product_categories;
DROP POLICY IF EXISTS "Tenant Isolation Products" ON public.products;
DROP POLICY IF EXISTS "Tenant Isolation Orders" ON public.orders;
DROP POLICY IF EXISTS "Tenant Isolation OrderItems" ON public.order_items;
DROP POLICY IF EXISTS "Tenant Isolation Coupons" ON public.coupons;
DROP POLICY IF EXISTS "Tenant Isolation Settings" ON public.delivery_settings;
DROP POLICY IF EXISTS "Tenant Isolation Views" ON public.menu_views;

DROP POLICY IF EXISTS "Public Read Tenants" ON public.tenants;
DROP POLICY IF EXISTS "Public Read Categories" ON public.product_categories;
DROP POLICY IF EXISTS "Public Read Products" ON public.products;
DROP POLICY IF EXISTS "Public Read Coupons" ON public.coupons;
DROP POLICY IF EXISTS "Public Read Settings" ON public.delivery_settings;
DROP POLICY IF EXISTS "Public Create Customers" ON public.customers;
DROP POLICY IF EXISTS "Public Create Addresses" ON public.addresses;
DROP POLICY IF EXISTS "Public Create Orders" ON public.orders;
DROP POLICY IF EXISTS "Public Create OrderItems" ON public.order_items;
DROP POLICY IF EXISTS "Public Read Own Order" ON public.orders;
DROP POLICY IF EXISTS "Public Read Own OrderItems" ON public.order_items;
DROP POLICY IF EXISTS "Public Create View" ON public.menu_views;

-- 12. TENANT ISOLATION POLICIES
CREATE POLICY "Tenant Isolation Tenants" ON public.tenants FOR ALL USING (id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- FIX: Non-recursive policy for Profiles
CREATE POLICY "Tenant Isolation Profiles" ON public.profiles FOR ALL USING (id = auth.uid());

CREATE POLICY "Tenant Isolation Customers" ON public.customers FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Tenant Isolation Addresses" ON public.addresses FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Tenant Isolation Categories" ON public.product_categories FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Tenant Isolation Products" ON public.products FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Tenant Isolation Orders" ON public.orders FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Tenant Isolation OrderItems" ON public.order_items FOR ALL USING (
  order_id IN (SELECT id FROM public.orders WHERE tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
);
CREATE POLICY "Tenant Isolation Coupons" ON public.coupons FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Tenant Isolation Settings" ON public.delivery_settings FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Tenant Isolation Views" ON public.menu_views FOR SELECT USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- 13. PUBLIC ACCESS POLICIES
CREATE POLICY "Public Read Tenants" ON public.tenants FOR SELECT USING (true);
CREATE POLICY "Public Read Categories" ON public.product_categories FOR SELECT USING (active = true);
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (active = true);
CREATE POLICY "Public Read Coupons" ON public.coupons FOR SELECT USING (active = true);
CREATE POLICY "Public Read Settings" ON public.delivery_settings FOR SELECT USING (true);
CREATE POLICY "Public Create Customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Create Addresses" ON public.addresses FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Create Orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Create OrderItems" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Own Order" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public Read Own OrderItems" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Public Create View" ON public.menu_views FOR INSERT WITH CHECK (true);

COMMIT;
