import { NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase-admin"
import OpenAI from "openai"

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

// Inicializa o OpenAI apenas se a chave estiver configurada
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error("[Webhook] OPENAI_API_KEY não configurada nas variáveis de ambiente.")
    return null
  }
  return new OpenAI({ apiKey })
}

function sanitizePhone(raw: string): string {
  if (raw.endsWith('@lid')) {
    return raw;
  }
  return raw.replace(/@c\.us/g, "").replace(/\D/g, "");
}

function replaceVariables(template: string, data: {
  clientName: string
  firstName: string
  phone: string
  companyName: string
  menuLink: string
  currentDate: string
  currentTime: string
}) {
  return template
    .replace(/\{client\.name\}/g, data.clientName || 'Cliente')
    .replace(/\{client\.first_name\}/g, data.firstName || 'Cliente')
    .replace(/\{client\.phone\}/g, data.phone || '')
    .replace(/\{company\.name\}/g, data.companyName || '')
    .replace(/\{menu\.link\}/g, data.menuLink || '')
    .replace(/\{current_date\}/g, data.currentDate || '')
    .replace(/\{current_time\}/g, data.currentTime || '')
    .replace(/\{client_name\}/g, data.clientName || 'Cliente')
    .replace(/\{company_name\}/g, data.companyName || '')
    .replace(/\{menu_link\}/g, data.menuLink || '')
}

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const { tenantId, from, body, notifyName, direction = "inbound" } = payload

    if (!tenantId || !from || !body) {
      return NextResponse.json({ error: "Parâmetros insuficientes" }, { status: 400 })
    }

    const phone = sanitizePhone(from)
    console.log(`[Webhook] Mensagem recebida de ${phone} para o tenant ${tenantId}`)

    // 1. Debounce anti-duplicação (Fase 10)
    // Busca a última mensagem inbound desse cliente nos últimos 30 segundos
    if (direction === "inbound") {
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString()
      const { data: recentInbound } = await supabase
        .from("messages")
        .select("message, created_at")
        .eq("tenant_id", tenantId)
        .eq("phone", phone)
        .eq("direction", "inbound")
        .gte("created_at", thirtySecondsAgo)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (recentInbound && recentInbound.message === body) {
        console.log(`[Webhook] Debounce acionado. Ignorando mensagem duplicada de ${phone} enviada nos últimos 30 segundos: "${body}"`)
        return NextResponse.json({ ok: true, info: "Ignorado por debounce (duplicada)" })
      }
    }

    // 2. Salvar mensagem recebida na tabela unificada 'messages' (Fase 2)
    const { error: msgErr } = await supabase.from("messages").insert({
      tenant_id: tenantId,
      phone,
      message: body,
      direction
    })
    if (msgErr) {
      console.error("[Webhook] Erro ao salvar mensagem no banco:", msgErr.message)
    }

    // Registrar recebimento na nova tabela de auditoria message_logs (Fase 10 & 11)
    try {
      await supabase.from("message_logs").insert({
        tenant_id: tenantId,
        phone,
        message: body,
        direction,
        status: direction === "inbound" ? "delivered" : "sent",
        provider_response: { status: "received", timestamp: new Date().toISOString() }
      })
    } catch (logErr: any) {
      console.error("[Webhook] Erro ao salvar logs em message_logs:", logErr.message)
    }

    // Se a direção for outbound, apenas guardamos a mensagem e encerramos.
    if (direction === "outbound") {
      return NextResponse.json({ ok: true, saved: true })
    }

    // 3. Identificação do Tenant (Fase 3)
    console.log("Tenant identificado:", tenantId)
    await logEvent(tenantId, "info", "Mensagem recebida", { phone, body })

    // Busca configurações do Chatbot
    const { data: settings, error: settingsErr } = await supabase
      .from("chatbot_settings")
      .select("*")
      .eq("tenant_id", tenantId)
      .single()

    if (settingsErr || !settings) {
      console.warn(`[Webhook] Configurações de chatbot não encontradas para o tenant: ${tenantId}`)
      return NextResponse.json({ ok: true, info: "Sem chatbot_settings" })
    }

    // Verifica se conversa com esse número está pausada para atendimento humano
    const { data: conv } = await supabase
      .from("chatbot_conversations")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("customer_phone", phone)
      .maybeSingle()

    // Se estiver pausado e ainda dentro da validade, ignora auto-resposta
    if (conv?.is_paused) {
      const pausedUntil = conv.paused_until ? new Date(conv.paused_until) : null
      if (pausedUntil && pausedUntil > new Date()) {
        console.log(`[Webhook] Conversa com ${phone} está pausada até ${pausedUntil.toISOString()}`)
        return NextResponse.json({ ok: true, info: "Conversa pausada para humano" })
      }
      // Se passou do tempo de pausa, despausa no banco
      await supabase
        .from("chatbot_conversations")
        .update({ is_paused: false, paused_until: null })
        .eq("id", conv.id)
    }

    // Verifica palavra-chave de transição humana
    const humanKeyword = (settings.human_keyword || "humano").toLowerCase().trim()
    if (body.toLowerCase().includes(humanKeyword)) {
      console.log(`[Webhook] Palavra-chave '${humanKeyword}' identificada. Pausando bot...`)
      
      const pauseUntil = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // Pausa de 4h
      await supabase.from("chatbot_conversations").upsert(
        { 
          tenant_id: tenantId, 
          customer_phone: phone, 
          customer_name: notifyName || "Cliente", 
          is_paused: true, 
          paused_until: pauseUntil, 
          last_message_at: new Date().toISOString() 
        },
        { onConflict: "tenant_id,customer_phone" }
      )

      const humanResponse = "👤 Transferindo para atendimento humano! Em breve alguém irá te atender. 😊"
      await queueMessage(tenantId, phone, humanResponse)
      await logEvent(tenantId, "info", "Atendimento humano acionado", { phone })
      return NextResponse.json({ ok: true, info: "Atendimento humano acionado" })
    }

    // Se o chatbot principal estiver desligado nas configurações, não responde
    if (!settings.is_active) {
      console.log(`[Webhook] Chatbot inativo para o tenant ${tenantId}`)
      return NextResponse.json({ ok: true, info: "Chatbot inativo" })
    }

    // 4. Buscar ou criar controle de boas-vindas na tabela 'chat_sessions' (Fase 11)
    let welcomeSent = false
    let chatSessionId = null

    try {
      const { data: chatSession, error: chatSessErr } = await supabase
        .from("chat_sessions")
        .select("id, welcome_sent")
        .eq("tenant_id", tenantId)
        .eq("phone", phone)
        .maybeSingle()

      if (chatSessErr) {
        console.warn("[Webhook] Tabela chat_sessions indisponível ou erro:", chatSessErr.message)
      } else if (chatSession) {
        welcomeSent = chatSession.welcome_sent
        chatSessionId = chatSession.id
      } else {
        // Se não existir na chat_sessions, criamos um registro inicial
        const { data: newSess, error: createSessErr } = await supabase
          .from("chat_sessions")
          .insert({
            tenant_id: tenantId,
            phone,
            welcome_sent: false
          })
          .select("id")
          .single()

        if (!createSessErr && newSess) {
          chatSessionId = newSess.id
        }
      }
    } catch (dbErr: any) {
      console.error("[Webhook] Erro no fluxo chat_sessions:", dbErr.message)
    }

    // Se chat_sessions falhou ou não existe ainda no banco de dados, usamos o conversation_sessions como fallback de primeiro contato
    const { data: session } = await supabase
      .from("conversation_sessions")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("phone", phone)
      .maybeSingle()

    if (chatSessionId === null) {
      if (session) {
        welcomeSent = true
      }
    }

    // 5. Obter nome do cliente e dados da empresa (Fase 4 & 5)
    // Busca cliente na tabela 'customers'
    let dbCustomerQuery = supabase
      .from("customers")
      .select("name, full_name")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)

    if (phone.includes('@lid')) {
      dbCustomerQuery = dbCustomerQuery.eq("phone", phone)
    } else {
      let normPhone = phone.replace(/\D/g, '')
      if ((normPhone.length === 12 || normPhone.length === 13) && normPhone.startsWith('55')) {
        normPhone = normPhone.slice(2)
      }
      dbCustomerQuery = dbCustomerQuery.eq("telefone_normalizado", normPhone)
    }

    const { data: dbCustomer } = await dbCustomerQuery.maybeSingle()

    const clientRealName = dbCustomer?.name || dbCustomer?.full_name || notifyName || "Cliente"
    const clientFirstName = clientRealName.split(" ")[0]

    // Busca dados da empresa
    const { data: company } = await supabase
      .from("tenants")
      .select("name, slug, phone, logo_url, address_street, address_number, address_neighborhood, address_city")
      .eq("id", tenantId)
      .single()

    const companyName = company?.name || "nossa loja"
    const menuLink = `${appUrl}/menu/${company?.slug || ""}`

    // Variáveis dinâmicas para substituição
    const nowLocal = new Date()
    const currentDate = nowLocal.toLocaleDateString('pt-BR')
    const currentTime = nowLocal.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    const templateData = {
      clientName: clientRealName,
      firstName: clientFirstName,
      phone: phone.replace(/@lid/g, '').replace(/@c\.us/g, ''),
      companyName: companyName,
      menuLink: menuLink,
      currentDate: currentDate,
      currentTime: currentTime
    }

    // 6. Lógica de Boas-Vindas (Fase 4)
    if (!welcomeSent && settings.welcome_enabled) {
      const welcomeTemplate = settings.msg_welcome || "Olá, {client.name}! Seja bem-vindo à {company.name}! Acesse nosso cardápio: {menu.link}"
      
      // Substitui as variáveis
      const welcomeText = replaceVariables(welcomeTemplate, templateData)

      // LOGS EXIGIDOS
      console.log('Template original:', welcomeTemplate)
      console.log('Variáveis encontradas', templateData)
      console.log('Mensagem processada:', welcomeText)
      console.log('Cliente:', clientRealName)
      console.log('Empresa:', companyName)
      console.log('Menu:', menuLink)
      console.log('Boas-vindas já enviada?', welcomeSent)

      // Atualiza chat_sessions para evitar reenvio de boas-vindas
      if (chatSessionId) {
        await supabase
          .from("chat_sessions")
          .update({
            welcome_sent: true,
            welcome_sent_at: new Date().toISOString(),
            last_message_at: new Date().toISOString()
          })
          .eq("id", chatSessionId)
      }

      // Salva a sessão inicial de IA (Fase 6)
      await supabase.from("conversation_sessions").insert({
        tenant_id: tenantId,
        phone,
        history: [{ role: "user", content: body }, { role: "assistant", content: welcomeText }],
        last_message: welcomeText
      })

      // Salva na fila de envio
      await queueMessage(tenantId, phone, welcomeText)
      await logEvent(tenantId, "info", "Mensagem de boas-vindas enviada", { phone, message: welcomeText })
      
      return NextResponse.json({ ok: true, welcome: true })
    }

    // Atualiza o last_message_at se welcome_sent = true
    if (chatSessionId) {
      await supabase
        .from("chat_sessions")
        .update({
          last_message_at: new Date().toISOString()
        })
        .eq("id", chatSessionId)
    }

    // 7. Integração ChatGPT (Fase 5)
    console.log("ChatGPT acionado para:", phone)
    await logEvent(tenantId, "info", "ChatGPT acionado", { phone, incoming: body })

    const openai = getOpenAIClient()
    if (!openai) {
      // Fallback padrão se OpenAI não estiver configurada
      const fallbackTemplate = `Olá! Obrigado pela mensagem. Para fazer seu pedido acesse nosso cardápio digital em: {menu.link}`
      const fallbackText = replaceVariables(fallbackTemplate, templateData)
      await queueMessage(tenantId, phone, fallbackText)
      return NextResponse.json({ ok: true, error: "OpenAI API Key não configurada" })
    }

    // Histórico de mensagens da sessão
    const historyList = session?.history ? (session.history as any[]) : []
    
    // Constrói prompt do sistema dinâmico
    const formattedAddress = company 
      ? `${company.address_street || ""}, ${company.address_number || ""} - ${company.address_neighborhood || ""}, ${company.address_city || ""}`
      : "Nosso endereço"

    const systemPrompt = `Você é atendente da empresa "${companyName}".
Responda educadamente.
Ajude os clientes de forma calorosa, ágil e em português.
Direcione para pedidos utilizando o cardápio no link: ${menuLink}
Não invente informações que você não possui. Use os seguintes dados da empresa se necessário:
- Nome da Empresa: ${companyName}
- Telefone de Contato: ${company?.phone || ""}
- Endereço físico: ${formattedAddress}
- Link do cardápio digital: ${menuLink}

Mantenha as respostas curtas, amigáveis e estruturadas em parágrafos de fácil leitura para o WhatsApp. Use emojis de forma moderada.`

    const apiMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...historyList.slice(-12), // Últimas 12 mensagens para contexto
      { role: "user", content: body }
    ]

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 350
    })

    const replyTextRaw = completion.choices[0].message.content || "Desculpe, no momento não consegui gerar uma resposta."
    // Substitui variáveis que possam vir na resposta da IA
    const replyText = replaceVariables(replyTextRaw, templateData)
    console.log("Resposta gerada:", replyText)

    // Atualiza histórico da sessão
    const updatedHistory = [...historyList, { role: "user", content: body }, { role: "assistant", content: replyText }].slice(-20)
    
    await supabase.from("conversation_sessions").upsert(
      {
        tenant_id: tenantId,
        phone,
        history: updatedHistory,
        last_message: replyText,
        updated_at: new Date().toISOString()
      },
      { onConflict: "tenant_id,phone" }
    )

    // Registra na fila de envios
    await queueMessage(tenantId, phone, replyText)
    
    await logEvent(tenantId, "info", "Resposta gerada e enfileirada", { phone, reply: replyText })
    return NextResponse.json({ ok: true, response: replyText })

  } catch (err: any) {
    console.error("[Webhook Error]:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Helper para logs internos (Fase 15)
async function logEvent(tenantId: string, level: string, message: string, details: any = null) {
  console.log(`[LOG] [${level.toUpperCase()}] ${message}`, details ? JSON.stringify(details) : "")
  await supabase.from("whatsapp_logs").insert({
    tenant_id: tenantId,
    level,
    message,
    details
  })
}

// Helper para colocar mensagens na fila (Fase 9)
async function queueMessage(tenantId: string, phone: string, message: string) {
  await supabase.from("whatsapp_message_queue").insert({
    tenant_id: tenantId,
    phone,
    message,
    status: "pending"
  })
}
