-- Tabela de configuração do chatbot por tenant
CREATE TABLE IF NOT EXISTS chatbot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT false,
  whatsapp_connected BOOLEAN DEFAULT false,
  whatsapp_number TEXT,

  -- Mensagens configuráveis pelo tenant
  msg_welcome TEXT DEFAULT 'Olá {nome}! 👋 Seja bem-vindo(a) à {empresa}!
Acesse nosso cardápio e faça seu pedido:
🛒 {link_cardapio}

Para falar com um atendente, digite *humano*.',

  msg_absence TEXT DEFAULT 'Olá! 😊 No momento estamos fechados.
Nosso horário de funcionamento: {horario}
Mas você já pode fazer seu pedido pelo nosso cardápio:
🛒 {link_cardapio}
Em breve estaremos disponíveis!',

  msg_order_received TEXT DEFAULT '✅ *Pedido #{codigo} recebido!*
Obrigado, {nome}! Seu pedido está sendo preparado com carinho.
⏱ Previsão: *{tempo} minutos*
Total: *R$ {total}*

Avisaremos quando estiver pronto! 🍰',

  msg_order_ready TEXT DEFAULT '🎉 *Pedido #{codigo} pronto!*
{nome}, seu pedido está prontinho esperando por você!
🏠 Tipo: {tipo_entrega}',

  msg_order_out_delivery TEXT DEFAULT '🛵 *Pedido #{codigo} saiu para entrega!*
{nome}, seu pedido está a caminho!
📍 Endereço: {endereco}
⏱ Previsão de chegada: {tempo} minutos',

  msg_order_cancelled TEXT DEFAULT '❌ *Pedido #{codigo} cancelado*
{nome}, infelizmente seu pedido foi cancelado.
Qualquer dúvida, estamos aqui! 💬',

  msg_sales_recovery TEXT DEFAULT 'Oi {nome}! 😊 Sentimos sua falta por aqui!
Temos novidades imperdíveis esperando por você.
Confira nosso cardápio atualizado:
🛒 {link_cardapio}
Use o cupom *VOLTEI10* e ganhe 10% de desconto! 🎁',

  msg_loyalty TEXT DEFAULT '🌟 *Você ganhou pontos!*
{nome}, você acumulou *{pontos} pontos* no programa de fidelidade da {empresa}!
{mensagem_cupom}
Continue pedindo e ganhe recompensas exclusivas! 🎉',

  msg_make_order TEXT DEFAULT 'Olá, {client.name}! 🍰\n\nPara fazer seu pedido é super simples!\n\n👉 Acesse nosso cardápio digital:\n🛒 {menu.link}\n\nLá você encontra todos os nossos produtos com fotos, preços e opções de personalização.',
  msg_promotions TEXT DEFAULT '🎉 *Promoções especiais da {company.name}!*\n\nOlá, {client.name}! Temos novidades imperdíveis para você:\n\n🔥 Confira todas as promoções no cardápio:\n🛒 {menu.link}\n\nAproveite enquanto durar! ⏰',
  msg_request_info TEXT DEFAULT 'Olá, {client.name}! 📋\n\nAqui estão as informações da {company.name}:\n\n📍 *Endereço:* {company.address}\n📞 *Telefone:* {company.phone}\n⏰ *Horários:* {business.hours}\n🛵 *Delivery:* Disponível na sua região\n\n🛒 *Faça seu pedido:* {menu.link}',
  msg_business_hours TEXT DEFAULT '⏰ *Horários de atendimento da {company.name}*\n\n{business.hours}\n\n🛒 Você pode fazer seu pedido a qualquer hora pelo nosso cardápio digital e processamos quando abrirmos:\n{menu.link}',

  -- Configurações de comportamento
  welcome_enabled BOOLEAN DEFAULT true,
  absence_enabled BOOLEAN DEFAULT true,
  make_order_enabled BOOLEAN DEFAULT true,
  promotions_enabled BOOLEAN DEFAULT false,
  request_info_enabled BOOLEAN DEFAULT true,
  business_hours_enabled BOOLEAN DEFAULT true,
  order_received_enabled BOOLEAN DEFAULT true,
  order_ready_enabled BOOLEAN DEFAULT true,
  order_out_delivery_enabled BOOLEAN DEFAULT true,
  order_cancelled_enabled BOOLEAN DEFAULT true,
  sales_recovery_enabled BOOLEAN DEFAULT false,
  sales_recovery_days INTEGER DEFAULT 14, -- dias sem pedir para disparar
  loyalty_enabled BOOLEAN DEFAULT false,
  human_keyword TEXT DEFAULT 'humano', -- palavra que pausa o bot

  -- Horário de funcionamento (para mensagem de ausência)
  business_hours JSONB DEFAULT '{
    "segunda": {"open": "08:00", "close": "22:00", "active": true},
    "terca":   {"open": "08:00", "close": "22:00", "active": true},
    "quarta":  {"open": "08:00", "close": "22:00", "active": true},
    "quinta":  {"open": "08:00", "close": "22:00", "active": true},
    "sexta":   {"open": "08:00", "close": "22:00", "active": true},
    "sabado":  {"open": "08:00", "close": "20:00", "active": true},
    "domingo": {"open": "10:00", "close": "18:00", "active": false}
  }',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- Tabela de sessões do WhatsApp (uma por tenant)
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  status TEXT DEFAULT 'disconnected', -- disconnected | qr_pending | connected
  qr_code TEXT, -- base64 do QR code atual
  phone_number TEXT,
  last_activity TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- Tabela de conversas (controle de estado por cliente)
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  is_paused BOOLEAN DEFAULT false, -- true quando cliente digitou 'humano'
  paused_until TIMESTAMPTZ, -- bot volta automaticamente após X horas
  messages_count INTEGER DEFAULT 0,
  UNIQUE(tenant_id, customer_phone)
);

-- Tabela de log de mensagens enviadas
CREATE TABLE IF NOT EXISTS chatbot_messages_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  customer_phone TEXT NOT NULL,
  message_type TEXT NOT NULL, -- welcome, absence, order_received, etc.
  message_content TEXT,
  order_id UUID REFERENCES orders(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent' -- sent | failed
);

-- RLS: tenant só vê seus próprios dados
ALTER TABLE chatbot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_own_chatbot" ON chatbot_settings
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "tenant_own_sessions" ON whatsapp_sessions
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "tenant_own_convs" ON chatbot_conversations
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "tenant_own_logs" ON chatbot_messages_log
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
