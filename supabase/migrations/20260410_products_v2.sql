-- Expansão da tabela de produtos para o Painel V2
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS preparation_time INTEGER DEFAULT 30; -- em minutos
ALTER TABLE products ADD COLUMN IF NOT EXISTS order_position INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'; -- active | inactive
ALTER TABLE products ADD COLUMN IF NOT EXISTS inventory_count INTEGER; -- NULL = ilimitado

-- Correção de tipos caso necessário
-- ALTER TABLE products ALTER COLUMN active SET DEFAULT true;

-- Políticas de RLS para o novo campo status
-- (Assumindo que as políticas existentes para 'active' cobrem a visibilidade baseada no usuário)
