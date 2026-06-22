-- MIGRATION: V45 - EXTRA SCHEMAS FOR OLACLICK WORKFLOW
BEGIN;

-- 1. Alter cash_registers to store operator, notes, and closed sales breakdowns
ALTER TABLE public.cash_registers ADD COLUMN IF NOT EXISTS operator_name VARCHAR(150);
ALTER TABLE public.cash_registers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.cash_registers ADD COLUMN IF NOT EXISTS cash_sales_amount DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE public.cash_registers ADD COLUMN IF NOT EXISTS pix_sales_amount DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE public.cash_registers ADD COLUMN IF NOT EXISTS debit_sales_amount DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE public.cash_registers ADD COLUMN IF NOT EXISTS credit_sales_amount DECIMAL(12,2) DEFAULT 0.00;

-- 2. Alter delivery_drivers table to add CPF and WhatsApp
ALTER TABLE public.delivery_drivers ADD COLUMN IF NOT EXISTS cpf VARCHAR(30);
ALTER TABLE public.delivery_drivers ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(30);

-- 3. Alter restaurant_tables table to add coordinates, shape, capacity
ALTER TABLE public.restaurant_tables ADD COLUMN IF NOT EXISTS shape VARCHAR(30) DEFAULT 'square';
ALTER TABLE public.restaurant_tables ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 4;
ALTER TABLE public.restaurant_tables ADD COLUMN IF NOT EXISTS x_position INTEGER DEFAULT 100;
ALTER TABLE public.restaurant_tables ADD COLUMN IF NOT EXISTS y_position INTEGER DEFAULT 100;

-- 4. Create restaurant_table_calls table
CREATE TABLE IF NOT EXISTS public.restaurant_table_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    table_number VARCHAR(30) NOT NULL,
    type VARCHAR(30) DEFAULT 'call', -- 'call', 'bill'
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'attended'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable Row Level Security (RLS) on restaurant_table_calls
ALTER TABLE public.restaurant_table_calls ENABLE ROW LEVEL SECURITY;

-- 6. Access control policies for restaurant_table_calls
DROP POLICY IF EXISTS "Allow public anonymous insert on calls" ON public.restaurant_table_calls;
CREATE POLICY "Allow public anonymous insert on calls" ON public.restaurant_table_calls
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow tenant read/write on calls" ON public.restaurant_table_calls;
CREATE POLICY "Allow tenant read/write on calls" ON public.restaurant_table_calls
    FOR ALL
    TO authenticated
    USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 7. Also add delivery confirmation columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_photo TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_signature TEXT;

-- 8. Add supabase realtime publication for calls and tables
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'restaurant_table_calls'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_table_calls;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'restaurant_tables'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_tables;
    END IF;
END $$;

COMMIT;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
