-- 1. Tabelas com padrão tenant_id (consistente com o restante do projeto)
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES profiles(id) DEFAULT auth.uid(),
  assigned_to UUID REFERENCES profiles(id),
  assunto TEXT NOT NULL,
  categoria TEXT, 
  prioridade TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'aberto',
  respondido BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- Garantir coluna tenant_id, user_id e assigned_to
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id);

-- Corrigir Foreign Keys para joins explícitos
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_user_id_fkey;
ALTER TABLE tickets ADD CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS mensagens_suporte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  remetente TEXT NOT NULL, 
  remetente_nome TEXT,
  remetente_id UUID DEFAULT auth.uid(),
  tipo TEXT DEFAULT 'texto', 
  conteudo TEXT, 
  audio_url TEXT, 
  lido BOOLEAN DEFAULT false,
  enviado_em TIMESTAMPTZ DEFAULT now()
);

-- Garantir coluna remetente_id na tabela de mensagens
ALTER TABLE mensagens_suporte ADD COLUMN IF NOT EXISTS remetente_id UUID DEFAULT auth.uid();

-- Corrigir Foreign Key de remetente_id para join com profiles
ALTER TABLE mensagens_suporte DROP CONSTRAINT IF EXISTS mensagens_suporte_remetente_id_fkey;
ALTER TABLE mensagens_suporte ADD CONSTRAINT mensagens_suporte_remetente_id_fkey FOREIGN KEY (remetente_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 3. Habilitar RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens_suporte ENABLE ROW LEVEL SECURITY;

-- 4. Policies Idempotentes
DROP POLICY IF EXISTS "usuários_criam_próprios_tickets" ON tickets;
DROP POLICY IF EXISTS "usuários_veem_próprios_tickets" ON tickets;
DROP POLICY IF EXISTS "usuários_inserem_mensagens" ON mensagens_suporte;
DROP POLICY IF EXISTS "usuários_veem_mensagens" ON mensagens_suporte;
DROP POLICY IF EXISTS "admin_acesso_total_tickets" ON tickets;
DROP POLICY IF EXISTS "admin_acesso_total_mensagens" ON mensagens_suporte;

CREATE POLICY "usuários_criam_próprios_tickets" ON tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "usuários_veem_próprios_tickets" ON tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "usuários_inserem_mensagens" ON mensagens_suporte FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tickets WHERE id = ticket_id AND user_id = auth.uid()));
CREATE POLICY "usuários_veem_mensagens" ON mensagens_suporte FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tickets WHERE id = ticket_id AND user_id = auth.uid()));

CREATE POLICY "admin_acesso_total_tickets" ON tickets FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));
CREATE POLICY "admin_acesso_total_mensagens" ON mensagens_suporte FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- 6. Habilitar Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'tickets') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'mensagens_suporte') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE mensagens_suporte;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
