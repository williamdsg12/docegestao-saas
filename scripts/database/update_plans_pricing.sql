-- Migration Script: Dynamic Subscription Plans
-- Clears old plans and inserts the 3 definitive ones.

-- 1. Ensure system_logs is fully prepared so the trigger won't fail
DO $$ BEGIN
    -- Add company_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='system_logs' AND column_name='company_id') THEN
        ALTER TABLE public.system_logs ADD COLUMN company_id uuid REFERENCES public.companies(id);
    END IF;
    -- Add action if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='system_logs' AND column_name='action') THEN
        ALTER TABLE public.system_logs ADD COLUMN action text;
    END IF;
    -- Add entity if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='system_logs' AND column_name='entity') THEN
        ALTER TABLE public.system_logs ADD COLUMN entity text;
    END IF;
    -- Ensure columns that are expected to be NOT NULL can handle the existing trigger
    -- We make them nullable first if missing to avoid data failures, then trigger will fill them.
END $$;

-- 2. First, we need to update any subscriptions pointing to old plans to point to the new 'iniciante' to avoid foreign key violations when we delete old plans
DO $$ 
DECLARE
    iniciante_id uuid;
BEGIN
    -- Obter ou criar Iniciante
    SELECT id INTO iniciante_id FROM public.plans WHERE slug = 'iniciante' LIMIT 1;
    IF iniciante_id IS NULL THEN
        INSERT INTO public.plans (name, slug, price, interval, max_orders, max_products, max_clients, features, is_active)
        VALUES ('Iniciante', 'iniciante', 19.90, 'month', 100, 50, 100, '["Gestão de clientes", "Relatório de lucros básico", "100 pedidos por mês", "Até 50 fichas técnicas"]'::jsonb, true)
        RETURNING id INTO iniciante_id;
    END IF;

    -- Update existing subscriptions
    UPDATE public.subscriptions SET plan_id = iniciante_id WHERE plan_id IS NOT NULL AND plan_id != iniciante_id;
END $$;

-- 2. Clear out other non-essential plans
DELETE FROM public.plans WHERE slug NOT IN ('iniciante', 'profissional', 'pro');

-- 3. Upsert the definitive 3 plans
INSERT INTO public.plans (name, slug, price, interval, max_orders, max_products, max_clients, features, is_active)
VALUES 
    (
        'Iniciante', 
        'iniciante', 
        19.90, 
        'month', 
        100, 
        50, 
        100, 
        '["Gestão de clientes", "Relatório de lucros básico", "100 pedidos por mês", "Até 50 fichas técnicas"]'::jsonb, 
        true
    ),
    (
        'Profissional', 
        'profissional', 
        49.90, 
        'month', 
        99999, 
        99999, 
        99999, 
        '["Fichas técnicas ilimitadas", "Pedidos ilimitados", "Financeiro completo", "Controle de estoque", "Relatórios profissionais"]'::jsonb, 
        true
    ),
    (
        'Pro', 
        'pro', 
        59.90, 
        'month', 
        99999, 
        99999, 
        99999, 
        '["Todas funcionalidades ilimitadas", "Acesso VIP", "Suporte prioritário"]'::jsonb, 
        true
    )
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    max_orders = EXCLUDED.max_orders,
    max_products = EXCLUDED.max_products,
    max_clients = EXCLUDED.max_clients,
    features = EXCLUDED.features,
    is_active = EXCLUDED.is_active;

-- Update the app's default trigger to use 'iniciante' instead of 'basico'/'premium' terminology
-- (Usually done in the registration_robust_fix.sql trigger, but let's ensure 'iniciante' is the default)
UPDATE public.profiles SET plan = 'iniciante' WHERE plan IN ('basico', 'free', 'trial');
