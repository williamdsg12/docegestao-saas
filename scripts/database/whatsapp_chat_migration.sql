CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL, -- 'inbound' (do cliente) | 'outbound' (do bot/atendente)
  content TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chatbot_conversations 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'aberta'; -- 'aberta', 'em_atendimento', 'finalizada'

ALTER TABLE chatbot_conversations 
ADD COLUMN IF NOT EXISTS bot_state JSONB DEFAULT '{}'::jsonb;

-- RLS
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_own_wa_msgs" ON whatsapp_messages
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
