-- DOCESGESTÃO - RECIPE TABLE FIX
-- Script to ensure tables exist with correct columns and RLS

DO $$ 
BEGIN 

    -- 1. Create or Update 'receitas' table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'receitas'
    ) THEN

        CREATE TABLE public.receitas (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
            user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
            nome text NOT NULL,
            descricao text,
            tempo_preparo text,
            rendimento text,
            foto_url text,
            modo_preparo text,
            created_at timestamptz DEFAULT now()
        );

    ELSE

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='receitas' AND column_name='company_id'
        ) THEN
            ALTER TABLE public.receitas 
            ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='receitas' AND column_name='user_id'
        ) THEN
            ALTER TABLE public.receitas 
            ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='receitas' AND column_name='descricao'
        ) THEN
            ALTER TABLE public.receitas ADD COLUMN descricao text;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='receitas' AND column_name='tempo_preparo'
        ) THEN
            ALTER TABLE public.receitas ADD COLUMN tempo_preparo text;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='receitas' AND column_name='foto_url'
        ) THEN
            ALTER TABLE public.receitas ADD COLUMN foto_url text;
        END IF;

    END IF;


    -- 2. Create recipe ingredients table if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'receita_ingredientes'
    ) THEN

        CREATE TABLE public.receita_ingredientes (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            receita_id uuid REFERENCES public.receitas(id) ON DELETE CASCADE,
            ingrediente_id uuid REFERENCES public.ingredientes(id) ON DELETE CASCADE,
            quantidade numeric NOT NULL,
            unidade text,
            created_at timestamptz DEFAULT now()
        );

    END IF;

END $$;


-- Enable RLS
ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receita_ingredientes ENABLE ROW LEVEL SECURITY;


-- Policies
DROP POLICY IF EXISTS tenant_isolation_receitas ON public.receitas;

CREATE POLICY tenant_isolation_receitas 
ON public.receitas
FOR ALL
USING (
    company_id IN (
        SELECT company_id 
        FROM public.profiles 
        WHERE id = auth.uid()
    )
);


DROP POLICY IF EXISTS tenant_isolation_receita_ingredientes ON public.receita_ingredientes;

CREATE POLICY tenant_isolation_receita_ingredientes 
ON public.receita_ingredientes
FOR ALL
USING (
    receita_id IN (
        SELECT id 
        FROM public.receitas 
        WHERE company_id IN (
            SELECT company_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    )
);
