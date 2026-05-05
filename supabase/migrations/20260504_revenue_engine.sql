-- Revenue Engine System Migration
-- Date: 2026-05-04

BEGIN;

-- 1. Sales Automations (Recovery, Follow-up)
CREATE TABLE IF NOT EXISTS public.revenue_automations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    trigger_type text CHECK (trigger_type IN ('abandoned_cart', 'order_completed', 'customer_inactive')),
    delay_hours integer DEFAULT 24,
    message_template text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Marketplace Items (In-App Purchases)
CREATE TABLE IF NOT EXISTS public.revenue_marketplace (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    type text CHECK (type IN ('template', 'ai_credits', 'automation', 'theme')),
    image_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Gamification & Achievements
CREATE TABLE IF NOT EXISTS public.revenue_achievements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    achievement_type text NOT NULL, -- 'daily_goal', 'first_sale', 'growth_master'
    target_value numeric(15,2),
    current_value numeric(15,2) DEFAULT 0,
    is_completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. Churn Management
CREATE TABLE IF NOT EXISTS public.revenue_churn_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    reason text,
    feedback text,
    offer_accepted text, -- 'discount', 'pause', 'extension', 'none'
    created_at timestamp with time zone DEFAULT now()
);

-- 5. Enable RLS
ALTER TABLE public.revenue_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_churn_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own revenue automations" ON public.revenue_automations
    FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view their own achievements" ON public.revenue_achievements
    FOR SELECT TO authenticated USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Initial Marketplace Data
INSERT INTO public.revenue_marketplace (title, description, price, type)
VALUES 
('Pack Confeitaria Premium', '10 templates de cardápio otimizados para conversão.', 49.90, 'template'),
('IA Sales Booster', '500 créditos de mensagens geradas por IA.', 29.00, 'ai_credits'),
('Automação de WhatsApp', 'Recuperação automática de boletos e abandonos.', 97.00, 'automation')
ON CONFLICT DO NOTHING;

COMMIT;
