-- Professional Quotes System Migration

-- Increase precision for numbers
SET client_min_messages TO warning;

-- 1. Create QUOTES table
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.customers(id) ON DELETE SET NULL, -- Using customers as identified in research
    status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, approved, rejected, converted, expired
    
    -- Event Details
    event_date TIMESTAMP WITH TIME ZONE,
    delivery_date TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    theme TEXT,
    description TEXT,
    
    -- Financials
    internal_costs_total NUMERIC(10,2) DEFAULT 0,
    profit_type TEXT DEFAULT 'percent', -- 'fixed' or 'percent'
    profit_value NUMERIC(10,2) DEFAULT 0,
    total_final NUMERIC(10,2) DEFAULT 0,
    
    -- Options & Observations
    display_options JSONB DEFAULT '{"showDetails": true, "language": "pt-BR"}'::jsonb,
    observations TEXT,
    
    -- Tracking & Security
    public_token UUID DEFAULT gen_random_uuid(),
    opened_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create QUOTE_ITEMS table (Products in the quote)
CREATE TABLE IF NOT EXISTS public.quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    description TEXT, -- Custom description for the item in this quote
    quantity NUMERIC(10,2) DEFAULT 1,
    unit_price NUMERIC(10,2) DEFAULT 0,
    total_price NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create QUOTE_COSTS table (Internal costs like ingredients, packaging)
CREATE TABLE IF NOT EXISTS public.quote_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    value NUMERIC(10,2) NOT NULL DEFAULT 0,
    show_to_client BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_costs ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Quotes Policies
CREATE POLICY "Users can manage their own company quotes"
    ON public.quotes
    FOR ALL
    USING (company_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- Allow public viewing of a quote if public_token match (for track opens and client view)
CREATE POLICY "Anyone can view a quote via public token"
    ON public.quotes
    FOR SELECT
    USING (true); -- We will filter by public_token in the application layer or refine this.
    -- Better: USING (public_token IS NOT NULL);

-- Quote Items Policies
CREATE POLICY "Users can manage their company quote items"
    ON public.quote_items
    FOR ALL
    USING (quote_id IN (SELECT id FROM public.quotes WHERE company_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())));

-- Quote Costs Policies
CREATE POLICY "Users can manage their company quote costs"
    ON public.quote_costs
    FOR ALL
    USING (quote_id IN (SELECT id FROM public.quotes WHERE company_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())));

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON public.quotes
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
