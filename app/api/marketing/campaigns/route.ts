import { NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase-admin"

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

function replaceVariables(template: string, data: {
  clientName: string
  firstName: string
  phone: string
  companyName: string
  menuLink: string
  birthday: string
  coupon: string
  currentDate: string
  currentTime: string
}) {
  return template
    .replace(/\{client\.name\}/g, data.clientName || 'Cliente')
    .replace(/\{client_name\}/g, data.clientName || 'Cliente')
    .replace(/\{client\.first_name\}/g, data.firstName || 'Cliente')
    .replace(/\{company\.name\}/g, data.companyName || '')
    .replace(/\{company_name\}/g, data.companyName || '')
    .replace(/\{menu\.link\}/g, data.menuLink || '')
    .replace(/\{menu_link\}/g, data.menuLink || '')
    .replace(/\{phone\}/g, data.phone || '')
    .replace(/\{client\.phone\}/g, data.phone || '')
    .replace(/\{coupon\}/g, data.coupon || '')
    .replace(/\{birthday\}/g, data.birthday || '')
    .replace(/\{current_date\}/g, data.currentDate || '')
    .replace(/\{current_time\}/g, data.currentTime || '')
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get("tenantId")

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId obrigatório" }, { status: 400 })
    }

    const { data: campaigns, error } = await supabase
      .from("marketing_campaigns")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(campaigns)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { tenantId, name, message, segment, scheduleAt } = body

    // FASE 4 — VALIDAR PAYLOAD e Logar
    console.log('Campaign Payload', body)

    if (!tenantId || !name || !message || !segment) {
      return NextResponse.json({ error: "Parâmetros insuficientes" }, { status: 400 })
    }

    // FASE 7 — VALIDAÇÃO DE CAMPANHA (Mensagem vazia, Segmento inválido, Tenant inexistente, WhatsApp desconectado)
    if (!message || message.trim() === "") {
      return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 })
    }

    const validSegments = ["all", "vip", "inactive", "new", "recent", "birthday", "no_orders", "abandoned_cart"]
    if (!validSegments.includes(segment)) {
      return NextResponse.json({ error: "Segmento inválido." }, { status: 400 })
    }

    const { data: tenant, error: tenantErr } = await supabase
      .from("tenants")
      .select("id, name, slug")
      .eq("id", tenantId)
      .maybeSingle()

    if (tenantErr || !tenant) {
      return NextResponse.json({ error: "Tenant inexistente." }, { status: 400 })
    }

    const { data: waInst, error: waErr } = await supabase
      .from("whatsapp_instances")
      .select("status")
      .eq("tenant_id", tenantId)
      .maybeSingle()

    if (waErr || !waInst || waInst.status !== "connected") {
      return NextResponse.json({ error: "WhatsApp desconectado. Conecte o robô antes de disparar campanhas." }, { status: 400 })
    }

    // 1. Salva a campanha no banco
    const scheduledDate = scheduleAt ? new Date(scheduleAt) : new Date()
    const campaignStatus = scheduleAt ? "scheduled" : "processing"

    const { data: campaign, error: campErr } = await supabase
      .from("marketing_campaigns")
      .insert({
        tenant_id: tenantId,
        name,
        message,
        status: campaignStatus,
        segment: segment, // Salva o segmento!
        schedule_at: scheduledDate.toISOString()
      })
      .select("*")
      .single()

    if (campErr) throw campErr

    // Se a campanha for agendada, salvamos no banco e paramos aqui.
    // O cron job rodando no background do Express/Worker irá resolver os alvos dinamicamente e enfileirar as mensagens na data/hora do disparo.
    if (campaignStatus === "scheduled") {
      return NextResponse.json({
        success: true,
        campaignId: campaign.id,
        status: "scheduled",
        targetsCount: 0
      })
    }

    // 2. Filtra clientes por segmentação de forma dinâmica no JS
    let query = supabase
      .from("customers")
      .select("id, name, phone, email, is_vip, created_at, last_order_at, birthday, total_orders")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)

    const { data: targets, error: targetErr } = await query
    if (targetErr) throw targetErr

    // FASE 8 — LOGS COMPLETOS
    console.log('Segmento:', segment)
    console.log('Mensagem:', message)
    console.log('Clientes encontrados no banco:', targets ? targets.length : 0)

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const currentMonth = now.getMonth() + 1 // 1-12

    let filteredTargets = targets || []

    if (segment === "vip") {
      filteredTargets = filteredTargets.filter((c: any) => c.is_vip)
    } else if (segment === "birthday") {
      filteredTargets = filteredTargets.filter((c: any) => {
        if (!c.birthday) return false
        const parts = c.birthday.split('-') // YYYY-MM-DD
        if (parts.length >= 2) {
          return parseInt(parts[1], 10) === currentMonth
        }
        return false
      })
    } else if (segment === "inactive") {
      filteredTargets = filteredTargets.filter((c: any) => {
        if (!c.last_order_at) return false
        const lastOrder = new Date(c.last_order_at)
        return lastOrder < thirtyDaysAgo
      })
    } else if (segment === "new") {
      filteredTargets = filteredTargets.filter((c: any) => {
        const created = c.created_at ? new Date(c.created_at) : null
        return created && created >= sevenDaysAgo
      })
    } else if (segment === "recent") {
      filteredTargets = filteredTargets.filter((c: any) => {
        const lastOrder = c.last_order_at ? new Date(c.last_order_at) : null
        return lastOrder && lastOrder >= sevenDaysAgo
      })
    } else if (segment === "no_orders") {
      filteredTargets = filteredTargets.filter((c: any) => !c.last_order_at || Number(c.total_orders || 0) === 0)
    } else if (segment === "abandoned_cart") {
      const { data: abandonedCarts } = await supabase
        .from("abandoned_carts")
        .select("phone")
        .eq("tenant_id", tenantId)
        .eq("status", "pending")
      
      const abandonedPhones = new Set((abandonedCarts || []).map((ac: any) => ac.phone.replace(/\D/g, "")))
      filteredTargets = filteredTargets.filter((c: any) => {
        const cleanPhone = c.phone ? c.phone.replace(/\D/g, "") : ""
        return abandonedPhones.has(cleanPhone)
      })
    }

    console.log('Clientes no segmento filtrado:', filteredTargets.length)

    // FASE 6 — CORRIGIR SEGMENTAÇÃO (Se não existirem clientes no segmento)
    if (filteredTargets.length === 0) {
      // Como não tem clientes no segmento imediato, marcamos a campanha como falha
      await supabase
        .from("marketing_campaigns")
        .update({ status: "failed" })
        .eq("id", campaign.id)

      return NextResponse.json({ error: "Nenhum cliente encontrado para este segmento." }, { status: 400 })
    }

    // Carrega dados da empresa para as variáveis da campanha
    const companyName = tenant?.name || "nossa loja"
    const menuLink = `${appUrl}/menu/${tenant?.slug || ""}`

    const nowLocal = new Date()
    const currentDate = nowLocal.toLocaleDateString('pt-BR')
    const currentTime = nowLocal.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    let enqueuedCount = 0

    // Enfileira cada disparo na tabela whatsapp_message_queue (Fase 9 / Disparo)
    const queueEntries = filteredTargets
      .filter((c: any) => c.phone && c.phone.trim() !== "") // TESTE 3: Clientes sem telefone
      .map((c: any) => {
        // FASE 5 — VALIDAR DADOS DO CLIENTE (Nenhum campo pode ser null com fallbacks)
        const customer = {
          name: c.name || 'Cliente',
          phone: c.phone || '',
          email: c.email || '',
          tags: c.tags || [],
          status: c.status || 'active',
          vip: c.is_vip || false,
          birthday: c.birthday || ''
        }

        // FASE 8 — LOGS COMPLETOS
        console.log('Cliente atual:', customer)
        console.log('Telefone:', customer.phone)

        const clientName = customer.name
        const clientFirstName = clientName.split(" ")[0]

        let birthdayStr = ''
        if (customer.birthday) {
          const parts = customer.birthday.split('-')
          if (parts.length >= 3) {
            birthdayStr = `${parts[2]}/${parts[1]}`
          }
        }

        const templateData = {
          clientName: clientName,
          firstName: clientFirstName,
          phone: customer.phone.replace(/@lid/g, '').replace(/@c\.us/g, ''),
          companyName: companyName,
          menuLink: menuLink,
          birthday: birthdayStr,
          coupon: customer.vip ? 'VIP10' : 'CUPOM5',
          currentDate: currentDate,
          currentTime: currentTime
        }

        const formattedMsg = replaceVariables(message, templateData)
        const isLid = customer.phone.includes('@lid')

        return {
          tenant_id: tenantId,
          phone: isLid ? customer.phone : customer.phone.replace(/\D/g, ""),
          message: formattedMsg,
          status: "pending",
          scheduled_at: scheduledDate.toISOString(),
          campaign_id: campaign.id,
          client_id: c.id
        }
      })

    // FASE 6 — Sem clientes válidos após filtrar telefones vazios
    if (queueEntries.length === 0) {
      await supabase
        .from("marketing_campaigns")
        .update({ status: "failed" })
        .eq("id", campaign.id)
      return NextResponse.json({ error: "Nenhum cliente encontrado para este segmento com telefone válido." }, { status: 400 })
    }

    const { error: queueErr } = await supabase.from("campaign_queue").insert(queueEntries)
    if (queueErr) throw queueErr

    console.log('[CAMPAIGN] Campanha criada:', campaign.id)
    console.log('[CAMPAIGN] Clientes encontrados:', targets ? targets.length : 0)
    console.log('[CAMPAIGN] Inserido na fila:', queueEntries.length)

    enqueuedCount = queueEntries.length

    // Cria os registros correspondentes na tabela campaign_logs com status Pendente
    const campaignLogEntries = queueEntries.map((q: any) => ({
      tenant_id: tenantId,
      campaign_id: campaign.id,
      phone: q.phone,
      message: q.message,
      status: 'Pendente',
      client_id: q.client_id
    }))
    await supabase.from("campaign_logs").insert(campaignLogEntries)

    // Marca como concluído
    await supabase
      .from("marketing_campaigns")
      .update({ status: "completed" })
      .eq("id", campaign.id)

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      status: "completed",
      targetsCount: enqueuedCount
    })

  } catch (err: any) {
    // FASE 1 — IDENTIFICAR LINHA EXATA
    console.error("Erro no POST /api/marketing/campaigns:")
    console.error(err.stack || err.message || err)

    let errorDetails = "Erro desconhecido"
    if (err.stack) {
      const lines = err.stack.split("\n")
      if (lines.length > 1) {
        errorDetails = lines[1].trim()
      }
    }

    return NextResponse.json({ 
      error: `Erro ao disparar campanha: ${err.message}`, 
      details: errorDetails 
    }, { status: 500 })
  }
}
