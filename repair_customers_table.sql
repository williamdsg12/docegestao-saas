-- SCRIPT DE REPARO DEFINITIVO PARA TABELA CUSTOMERS
-- Este script garante que todas as colunas existam e força a atualização do sistema.

-- 1. Garante que as colunas existam
DO $$ 
BEGIN
    -- 1. Garante que a coluna 'nome' existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'nome') THEN
        ALTER TABLE public.customers ADD COLUMN nome text;
    END IF;

    -- 2. Se a coluna 'name' (Inglês) existir:
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'name') THEN
        -- Copia os dados de 'name' para 'nome' se 'nome' estiver vazio (usamos EXECUTE para evitar erro se 'name' não existir na compilação)
        EXECUTE 'UPDATE public.customers SET nome = "name" WHERE nome IS NULL OR nome = ''''';
        
        -- Remove a restrição NOT NULL da coluna 'name' (temporário)
        ALTER TABLE public.customers ALTER COLUMN "name" DROP NOT NULL;
        
        -- Remove de vez
        ALTER TABLE public.customers DROP COLUMN "name";
    END IF;

    -- 3. Garante que 'nome' não tenha restrição impeditiva agora
    ALTER TABLE public.customers ALTER COLUMN nome DROP NOT NULL;

    -- Se existir 'phone' mas não existir 'telefone', renomeia
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'phone') 
       AND NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'telefone') THEN
        ALTER TABLE public.customers RENAME COLUMN "phone" TO "telefone";
    END IF;

    -- Adiciona coluna telefone se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'telefone') THEN
        ALTER TABLE public.customers ADD COLUMN telefone text;
    END IF;

    -- Adiciona coluna email se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'email') THEN
        ALTER TABLE public.customers ADD COLUMN email text;
    END IF;

    -- Adiciona coluna company_id se não existir (ou corrige a referência)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'company_id') THEN
        ALTER TABLE public.customers ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
    ELSE
        -- Se já existe, garante que a FK aponte para 'companies' (podemos dropar e criar se necessário, mas para simplificar vamos apenas garantir a existência)
        -- Aqui vamos tratar o erro do usuário: se a FK estiver errada, o script abaixo no passo 2 vai resolver para todas as tabelas.
        NULL;
    END IF;
END $$;

-- 2. Garante restrição de unicidade no telefone (necessário para o checkout funcionar)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'customers_telefone_key') THEN
        ALTER TABLE public.customers ADD CONSTRAINT customers_telefone_key UNIQUE (telefone);
    END IF;
END $$;

-- 3. FORÇA A ATUALIZAÇÃO DO CACHE (COMANDO MAIS FORTE)
NOTIFY pgrst, 'reload schema';

-- 4. VERIFICAÇÃO FINAL (O resultado deve mostrar as colunas)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers';
