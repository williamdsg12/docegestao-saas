-- Smart Gestão System Expansion
-- Focus: Inventory Tracking, Recipe-Based Production, and Shopping Intelligence

-- 1. Inventory Movements (Entry, Exit, Production)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('entry', 'exit', 'production', 'adjustment')),
    quantity NUMERIC(15,3) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Recipe Ingredients (Linking ingredients to recipes)
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE,
    quantity NUMERIC(15,3) NOT NULL,
    unit TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(recipe_id, ingredient_id)
);

-- 3. Production History
CREATE TABLE IF NOT EXISTS public.production_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES public.recipes(id),
    product_name TEXT NOT NULL,
    quantity_produced NUMERIC(15,2) NOT NULL,
    consumed_ingredients JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_history ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Users can manage their company inventory_movements"
    ON public.inventory_movements FOR ALL 
    USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Users can manage their company recipe_ingredients"
    ON public.recipe_ingredients FOR ALL 
    USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Users can manage their company production_history"
    ON public.production_history FOR ALL 
    USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- 6. Helper View for Real-time Stock Summary
CREATE OR REPLACE VIEW public.inventory_summary AS
SELECT 
    i.id,
    i.tenant_id,
    i.name,
    i.current_quantity,
    i.min_stock,
    i.unit,
    CASE 
        WHEN i.current_quantity = 0 THEN 'zerado'
        WHEN i.current_quantity <= i.min_stock THEN 'baixo'
        ELSE 'ok'
    END as status
FROM public.ingredients i;
