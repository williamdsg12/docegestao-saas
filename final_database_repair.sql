-- SCRIPT DE REPARO FINAL E DEFINITIVO (BANCO DE DADOS)
-- Este script corrige TODOS os problemas de nomes de colunas e referências de empresa.

DO $$ 
DECLARE 
    t_name TEXT;
    fk_name TEXT;
BEGIN
    -- 1. CORREÇÃO GLOBAL DE REFERÊNCIAS (Empresas -> Companies)
    -- As tabelas devem apontar para 'companies', não para 'empresas'.
    FOR t_name IN SELECT unnest(ARRAY['customers', 'addresses', 'products', 'orders', 'ingredientes', 'receitas']) 
    LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t_name) THEN
            -- Remove FKs antigas que apontam para a tabela fantasma 'empresas'
            FOR fk_name IN 
                SELECT conname FROM pg_constraint c
                JOIN pg_class st ON c.conrelid = st.oid JOIN pg_class t ON c.confrelid = t.oid
                WHERE st.relname = t_name AND t.relname = 'empresas'
            LOOP
                EXECUTE 'ALTER TABLE public.' || quote_ident(t_name) || ' DROP CONSTRAINT ' || quote_ident(fk_name);
            END LOOP;

            -- Garante que a coluna company_id existe e aponta para 'companies'
            IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t_name AND column_name = 'company_id') THEN
                fk_name := t_name || '_company_id_fkey_v2';
                EXECUTE 'ALTER TABLE public.' || quote_ident(t_name) || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(fk_name);
                EXECUTE 'ALTER TABLE public.' || quote_ident(t_name) || 
                        ' ADD CONSTRAINT ' || quote_ident(fk_name) || 
                        ' FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE';
            END IF;
        END IF;
    END LOOP;

    -- 2. REPARO ESPECÍFICO DA TABELA CUSTOMERS (Limpeza de nomes)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customers') THEN
        -- Garante que 'nome' existe
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'nome') THEN
            ALTER TABLE public.customers ADD COLUMN nome text;
        END IF;

        -- Migra e remove a coluna 'name' se ela ainda existir
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'name') THEN
            EXECUTE 'UPDATE public.customers SET nome = "name" WHERE nome IS NULL OR nome = ''''';
            ALTER TABLE public.customers ALTER COLUMN "name" DROP NOT NULL;
            ALTER TABLE public.customers DROP COLUMN "name";
        END IF;

        -- Garante que 'nome' e 'telefone' existam e sejam usáveis
        ALTER TABLE public.customers ALTER COLUMN nome DROP NOT NULL;
        
        -- Garante coluna email e telefone
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'telefone') THEN
            ALTER TABLE public.customers ADD COLUMN telefone text;
        END IF;
    END IF;
END $$;

-- 3. GARANTE UNICIDADE DO TELEFONE PARA O CHECKOUT
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customers') AND
       NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'customers_telefone_key') THEN
        ALTER TABLE public.customers ADD CONSTRAINT customers_telefone_key UNIQUE (telefone);
    END IF;

    -- 3. Habilita Realtime (Essencial para Notificações Estilo iFood)
    -- Verifica se a publicação existe e se a tabela já não faz parte dela
    IF EXISTS (SELECT FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (SELECT FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pedidos') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
        END IF;
    END IF;

    -- 4. AJUSTES NA TABELA ORDERS PARA NÍVEL IFOOD PRO
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
        -- Endereço Completo em JSON (Padrão iFood)
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'delivery_address') THEN
            ALTER TABLE public.orders ADD COLUMN delivery_address jsonb;
        ELSE
            -- Se já existia como text, tenta converter para jsonb (opcional, mas recomendado)
            -- ALTER TABLE public.orders ALTER COLUMN delivery_address TYPE jsonb USING delivery_address::jsonb;
        END IF;

        -- Distância em KM
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'distance') THEN
            ALTER TABLE public.orders ADD COLUMN distance numeric;
        END IF;

        -- Taxa de Entrega
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'delivery_fee') THEN
            ALTER TABLE public.orders ADD COLUMN delivery_fee numeric;
        END IF;

        -- Coordenadas Geográficas (Para mapa de rastreio futuro)
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'latitude') THEN
            ALTER TABLE public.orders ADD COLUMN latitude numeric;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'longitude') THEN
            ALTER TABLE public.orders ADD COLUMN longitude numeric;
        END IF;

        -- Campos de Status e Metadados
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'status') THEN
            ALTER TABLE public.orders ADD COLUMN status text DEFAULT 'pending';
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_method') THEN
            ALTER TABLE public.orders ADD COLUMN payment_method text;
        END IF;
    END IF;

    -- 5. AJUSTES NA TABELA ORDER_ITEMS (Nomes em Português para bater com o Código)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_items') THEN
        -- Renomear price para preco se existir
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'price') THEN
            ALTER TABLE public.order_items RENAME COLUMN price TO preco;
        END IF;
        
        -- Renomear quantity para quantidade se existir
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'quantity') THEN
            ALTER TABLE public.order_items RENAME COLUMN quantity TO quantidade;
        END IF;

        -- Garantir a coluna product_name e tornar product_id opcional
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'product_name') THEN
            ALTER TABLE public.order_items ADD COLUMN product_name text;
        END IF;

        -- Tornar product_id opcional (nullable) para evitar erros se o produto desaparecer do catálogo
        ALTER TABLE public.order_items ALTER COLUMN product_id DROP NOT NULL;

        -- Remover a constraint de foreign key se ela estiver travando (Snapshot total para evitar erros se o produto sumir)
        -- Tenta remover a constraint pelo nome conhecido 'fk_product_item' ou 'order_items_product_id_fkey'
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_product_item') THEN
            ALTER TABLE public.order_items DROP CONSTRAINT fk_product_item;
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_product_id_fkey') THEN
            ALTER TABLE public.order_items DROP CONSTRAINT order_items_product_id_fkey;
        END IF;

        -- Opcional: Recriar sem restritividade extrema se você quiser manter o link, mas para iFood Pro 100% resiliente o snapshot é melhor.
    END IF;
END $$;

-- 4. REFRESH CACHE
NOTIFY pgrst, 'reload schema';
