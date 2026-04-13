-- Adiciona coluna de imagem na tabela de produtos
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Criação do bucket de produtos (opcional, mas recomendado)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('products', 'products', true)
-- ON CONFLICT (id) DO NOTHING;

-- Nota: No código estamos usando o bucket 'logos' na pasta 'products/' 
-- para garantir compatibilidade com buckets já existentes.
