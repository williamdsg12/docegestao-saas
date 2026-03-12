-- INFRAESTRUTURA DE DADOS SAAS PRO
-- Tabelas para Suporte, Auditoria e Relacionamentos Diretos

-- 1. Adicionar company_id em profiles para acesso direto (Performance & SaaS Pattern)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='company_id') THEN
        ALTER TABLE public.profiles ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Tabela de Tickets de Suporte
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Tabela de Logs do Sistema (Auditoria)
CREATE TABLE IF NOT EXISTS public.system_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    company_id uuid REFERENCES public.companies(id),
    action text NOT NULL, -- 'LOGIN', 'PLAN_CHANGE', 'BILLING_UPDATE', etc
    entity text NOT NULL, -- 'subscription', 'profile', 'payment', etc
    description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. Habilitar RLS nestas novas tabelas
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Acesso
-- Usuários veem apenas seus próprios tickets
CREATE POLICY "Users can view their own tickets" ON public.support_tickets
FOR SELECT USING (auth.uid() = user_id);

-- Admins veem todos os tickets e logs
-- Usando a função public.is_admin que criamos anteriormente
CREATE POLICY "Admins can view all tickets" ON public.support_tickets
FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all logs" ON public.system_logs
FOR SELECT USING (public.is_admin(auth.uid()));

-- 6. Trigger para Auditoria Automática de Assinaturas
CREATE OR REPLACE FUNCTION public.log_subscription_changes()
RETURNS trigger AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) OR (OLD.plan_id IS DISTINCT FROM NEW.plan_id) THEN
        INSERT INTO public.system_logs (user_id, company_id, action, entity, description)
        VALUES (
            NEW.user_id,
            NEW.company_id,
            'SUBSCRIPTION_UPDATE',
            'subscription',
            format('Status alterado de %L para %L. Plano ID alterado de %L para %L.', OLD.status, NEW.status, OLD.plan_id, NEW.plan_id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_log_subscription_changes ON public.subscriptions;
CREATE TRIGGER tr_log_subscription_changes
AFTER UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.log_subscription_changes();

-- 7. Atualizar a Função de Cadastro Unificada para preencher o company_id no profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_company_id uuid;
    iniciante_plan_id uuid;
    is_admin_user boolean;
BEGIN
    -- Verificar se é um dos e-mails de admin
    is_admin_user := (new.email IN ('williamosadia94@gmail.com', 'williamdev36@gmail.com'));

    -- 1. Criar Empresa (Companies) - Agora criado ANTES do profile
    INSERT INTO public.companies (name, owner_id)
    VALUES (
        coalesce(new.raw_user_meta_data->>'store_name', 'Minha Confeitaria'),
        new.id
    )
    RETURNING id INTO new_company_id;

    -- 2. Criar Perfil (Profiles) com company_id vinculado
    INSERT INTO public.profiles (
        id,
        owner_name,
        business_name,
        email,
        plan,
        trial_ends_at,
        is_admin,
        company_id
    )
    VALUES (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', 'Usuário'),
        coalesce(new.raw_user_meta_data->>'store_name', 'Minha Confeitaria'),
        new.email,
        CASE WHEN is_admin_user THEN 'premium' ELSE 'basico' END,
        now() + interval '14 days',
        is_admin_user,
        new_company_id
    );

    -- 3. Criar Assinatura (Subscriptions)
    SELECT id INTO iniciante_plan_id FROM public.plans WHERE slug = 'iniciante' LIMIT 1;

    INSERT INTO public.subscriptions (
        user_id,
        company_id,
        plan_id,
        status,
        trial_start,
        trial_end
    )
    VALUES (
        new.id,
        new_company_id,
        iniciante_plan_id,
        'trial',
        now(),
        now() + interval '14 days'
    );

    -- 4. Registrar log de criação de conta
    INSERT INTO public.system_logs (user_id, company_id, action, entity, description)
    VALUES (new.id, new_company_id, 'ACCOUNT_CREATED', 'profile', 'Novo usuário registrado e trial ativado.');

    RETURN new;
END;
$$;
