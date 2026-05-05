-- Advanced Support System Migration
-- Date: 2026-05-03

BEGIN;

-- 1. Upgrade support_conversations with advanced metrics
ALTER TABLE public.support_conversations 
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'baixa' CHECK (priority IN ('baixa', 'media', 'alta')),
ADD COLUMN IF NOT EXISTS category text DEFAULT 'geral' CHECK (category IN ('financeiro', 'tecnico', 'duvida', 'comercial', 'geral')),
ADD COLUMN IF NOT EXISTS sentiment text DEFAULT 'neutro' CHECK (sentiment IN ('positivo', 'neutro', 'negativo', 'urgente')),
ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'premium')),
ADD COLUMN IF NOT EXISTS sla_deadline timestamp with time zone,
ADD COLUMN IF NOT EXISTS rating integer CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS feedback text,
ADD COLUMN IF NOT EXISTS is_ai_handled boolean DEFAULT false;

-- 2. Create Support Macros table
CREATE TABLE IF NOT EXISTS public.support_macros (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    content text NOT NULL,
    shortcut text UNIQUE,
    category text DEFAULT 'geral',
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Enable RLS for macros
ALTER TABLE public.support_macros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage macros"
ON public.support_macros FOR ALL
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can view macros"
ON public.support_macros FOR SELECT
TO authenticated
USING (true);

-- 4. Initial Macros Data
INSERT INTO public.support_macros (title, content, shortcut, category)
VALUES 
('Boas-vindas', 'Olá! Como posso te ajudar hoje?', 'bv', 'geral'),
('Financeiro - Atraso', 'Identificamos um atraso no seu pagamento. Poderia nos enviar o comprovante?', 'fin1', 'financeiro'),
('Técnico - Cache', 'Tente limpar o cache do seu navegador ou usar uma aba anônima.', 'tec1', 'tecnico'),
('Encerramento', 'Ficamos felizes em ajudar! Se precisar de mais alguma coisa, estamos à disposição.', 'bye', 'geral')
ON CONFLICT (shortcut) DO NOTHING;

-- 5. Add trigger for updated_at in support_conversations if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_support_conversations_updated_at ON public.support_conversations;
CREATE TRIGGER update_support_conversations_updated_at
BEFORE UPDATE ON public.support_conversations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMIT;
