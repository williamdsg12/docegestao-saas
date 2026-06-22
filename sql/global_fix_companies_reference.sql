-- GLOBAL FIX: ALIGN ALL TABLES TO 'companies' INSTEAD OF 'empresas'
-- This script corrects the architectural mismatch where new tables were pointing to a ghost 'empresas' table.

DO $$ 
DECLARE 
    t_name TEXT;
    fk_name TEXT;
BEGIN
    -- List of tables that need the company_id reference fix
    FOR t_name IN SELECT unnest(ARRAY['customers', 'addresses', 'products', 'orders', 'ingredientes', 'receitas']) 
    LOOP
        -- 1. Check if table exists
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t_name) THEN
            
            -- 2. Find any foreign key leading to 'empresas' on this table
            FOR fk_name IN 
                SELECT conname 
                FROM pg_constraint c
                JOIN pg_class st ON c.conrelid = st.oid
                JOIN pg_class t ON c.confrelid = t.oid
                WHERE st.relname = t_name AND t.relname = 'empresas'
            LOOP
                EXECUTE 'ALTER TABLE public.' || quote_ident(t_name) || ' DROP CONSTRAINT ' || quote_ident(fk_name);
            END LOOP;

            -- 3. Ensure 'company_id' column exists
            IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t_name AND column_name = 'company_id') THEN
                -- 4. Add the correct constraint pointing to 'companies'
                -- We use a generic name like 'table_company_id_fkey'
                fk_name := t_name || '_company_id_fkey_v2';
                
                -- Drop if exists first to avoid duplicates
                EXECUTE 'ALTER TABLE public.' || quote_ident(t_name) || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(fk_name);
                
                EXECUTE 'ALTER TABLE public.' || quote_ident(t_name) || 
                        ' ADD CONSTRAINT ' || quote_ident(fk_name) || 
                        ' FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE';
            END IF;
        END IF;
    END LOOP;
END $$;

-- Special fix for order_items if it has company_id (usually it doesn't, but let's be safe)
-- ... usually order_items -> orders -> companies

-- REFRESH CACHE
NOTIFY pgrst, 'reload schema';
