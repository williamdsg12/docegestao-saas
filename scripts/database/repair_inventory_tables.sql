-- REPAIR: Inventory and Recipes (Base Tables)
BEGIN;

-- 1. INGREDIENTS (Insumos/Estoque)
CREATE TABLE IF NOT EXISTS public.ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    current_quantity NUMERIC DEFAULT 0,
    unit TEXT DEFAULT 'g',
    min_stock NUMERIC DEFAULT 0,
    purchase_price NUMERIC DEFAULT 0,
    package_quantity NUMERIC DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RECIPES (Fichas Técnicas)
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    prep_time TEXT,
    yield TEXT,
    image_url TEXT,
    instructions TEXT,
    ingredients JSONB DEFAULT '[]', -- Using JSONB for simplicity as per existing frontend logic
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCT INGREDIENTS (Link products to ingredients for cost calculation)
CREATE TABLE IF NOT EXISTS public.product_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE,
    quantity NUMERIC NOT NULL,
    cost NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "Tenant Isolation Ingredients" ON public.ingredients;
CREATE POLICY "Tenant Isolation Ingredients" ON public.ingredients
    FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenant Isolation Recipes" ON public.recipes;
CREATE POLICY "Tenant Isolation Recipes" ON public.recipes
    FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenant Isolation ProductIngredients" ON public.product_ingredients;
CREATE POLICY "Tenant Isolation ProductIngredients" ON public.product_ingredients
    FOR ALL USING (
        product_id IN (SELECT id FROM public.products WHERE tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
    );

COMMIT;
