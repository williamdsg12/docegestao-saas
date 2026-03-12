-- UNIFIED MULTI-TENANT SECURITY MIGRATION (VERSION 3 - ERP ONLY)
-- This script ensures all data is strictly isolated between companies.
-- Removed storage.objects to avoid permission errors (manage storage in Supabase UI).

DO $$ 
BEGIN 
    -- 0. Self-heal: Link profiles to companies if missing but owner matches
    UPDATE public.profiles p
    SET company_id = c.id
    FROM public.companies c
    WHERE p.company_id IS NULL AND c.owner_id = p.id;

    -- 1. Ensure company_id exists and enable RLS where tables exist
    
    -- Table: ingredientes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ingredientes') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ingredientes' AND column_name='company_id') THEN
            ALTER TABLE public.ingredientes ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
        END IF;
        ALTER TABLE public.ingredientes ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Table: products
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='company_id') THEN
            ALTER TABLE public.products ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
        END IF;
        ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Table: orders
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='company_id') THEN
            ALTER TABLE public.orders ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
        END IF;
        ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Table: menu_orders
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'menu_orders') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_orders' AND column_name='company_id') THEN
            ALTER TABLE public.menu_orders ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
        END IF;
        ALTER TABLE public.menu_orders ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Table: transactions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='company_id') THEN
            ALTER TABLE public.transactions ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
        END IF;
        ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Table: quotes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotes' AND column_name='confeitaria_id') THEN
            ALTER TABLE public.quotes RENAME COLUMN confeitaria_id TO company_id;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotes' AND column_name='company_id') THEN
            ALTER TABLE public.quotes ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
        END IF;
        ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Table: clients
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='company_id') THEN
            ALTER TABLE public.clients ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
        END IF;
        ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
    END IF;

END $$;

-- 2. Create RLS Policies for all tables (Conditional)

-- INGREDIENTES
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ingredientes') THEN
        DROP POLICY IF EXISTS "Tenant Isolation Ingredientes" ON public.ingredientes;
        CREATE POLICY "Tenant Isolation Ingredientes" ON public.ingredientes
        FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
    END IF;
END $$;

-- PRODUCTS
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        DROP POLICY IF EXISTS "Tenant Isolation Products" ON public.products;
        CREATE POLICY "Tenant Isolation Products" ON public.products
        FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
    END IF;
END $$;

-- ORDERS
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        DROP POLICY IF EXISTS "Tenant Isolation Orders" ON public.orders;
        CREATE POLICY "Tenant Isolation Orders" ON public.orders
        FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
    END IF;
END $$;

-- MENU ORDERS
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_orders') THEN
        DROP POLICY IF EXISTS "Tenant Isolation Menu Orders" ON public.menu_orders;
        CREATE POLICY "Tenant Isolation Menu Orders" ON public.menu_orders
        FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
    END IF;
END $$;

-- TRANSACTIONS
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
        DROP POLICY IF EXISTS "Tenant Isolation Transactions" ON public.transactions;
        CREATE POLICY "Tenant Isolation Transactions" ON public.transactions
        FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
    END IF;
END $$;

-- QUOTES
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotes') THEN
        DROP POLICY IF EXISTS "Tenant Isolation Quotes" ON public.quotes;
        CREATE POLICY "Tenant Isolation Quotes" ON public.quotes
        FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
    END IF;
END $$;

-- CLIENTS
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
        DROP POLICY IF EXISTS "Tenant Isolation Clients" ON public.clients;
        CREATE POLICY "Tenant Isolation Clients" ON public.clients
        FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
    END IF;
END $$;

-- PROFILES (SELF ACCESS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR ALL USING (auth.uid() = id);

-- COMPANIES (SELF ACCESS)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can view their own company" ON public.companies;
CREATE POLICY "Owners can view their own company" ON public.companies
FOR ALL USING (auth.uid() = owner_id);
