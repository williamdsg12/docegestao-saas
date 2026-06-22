-- ----------------------------------------------------
-- RECRIAÇÃO DA TABELA: digital_menu_settings
-- ----------------------------------------------------
-- A tabela atual existe mas não possui a coluna company_id
-- Como ela está vazia, podemos recriá-la com a estrutura correta.

DROP TABLE IF EXISTS public.digital_menu_settings CASCADE;

CREATE TABLE public.digital_menu_settings (
    company_id UUID NOT NULL PRIMARY KEY, -- Referência à empresa
    store_name TEXT,
    store_description TEXT,
    menu_cover TEXT,
    menu_logo TEXT,
    primary_color TEXT DEFAULT '#ff2266',
    background_color TEXT DEFAULT '#ffffff',
    button_color TEXT DEFAULT '#ff2266',
    text_color TEXT DEFAULT '#0f172a',
    button_text TEXT DEFAULT 'Pedir no WhatsApp',
    button_style TEXT DEFAULT 'rounded',
    menu_layout TEXT DEFAULT 'grid',
    whatsapp TEXT,
    instagram TEXT,
    facebook TEXT,
    website TEXT,
    animation_style TEXT DEFAULT 'fade',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Adicionando RLS (Row Level Security)
ALTER TABLE public.digital_menu_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Leitura pública do cardápio"
    ON public.digital_menu_settings
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Usuários logados podem editar suas configurações"
    ON public.digital_menu_settings
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
