import express from 'express'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import { WhatsAppManager } from './WhatsAppManager'

const app = express()
app.use(express.json())

const manager = new WhatsAppManager()
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Endpoints ─────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (_, res) => res.json({ ok: true, time: new Date().toISOString() }))

// Iniciar sessão (Fase 7)
app.post('/session/start', async (req, res) => {
  const { tenantId } = req.body
  if (!tenantId) return res.status(400).json({ error: 'tenantId obrigatório' })
  const result = await manager.startSession(tenantId)
  res.json(result)
})

// QR Code atual
app.get('/session/:tenantId/qr', (req, res) => {
  const qr = manager.getQR(req.params.tenantId)
  const status = manager.getStatus(req.params.tenantId)
  res.json({ qr, status })
})

// Status
app.get('/session/:tenantId/status', (req, res) => {
  res.json({ status: manager.getStatus(req.params.tenantId) })
})

// Desconectar
app.post('/session/:tenantId/disconnect', async (req, res) => {
  await manager.disconnect(req.params.tenantId)
  res.json({ ok: true })
})

// Enviar mensagem manual (Fase 9 / Desvia direto para a fila para ser seguro!)
app.post('/message/send', async (req, res) => {
  const { tenantId, phone, message } = req.body
  if (!tenantId || !phone || !message) {
    return res.status(400).json({ error: 'Faltando parâmetros' })
  }
  
  // Insere na fila ao invés de enviar diretamente para respeitar FASE 9
  const { error } = await supabase.from('whatsapp_message_queue').insert({
    tenant_id: tenantId,
    phone,
    message,
    status: 'pending'
  })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json({ ok: true, queued: true })
})

// ── HELPER: Substituição de variáveis dinâmicas (Fase 4) ──────────────────────────
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

// ── CRON: Recuperação automática de carrinho (Fase 12) ───────────────────────────
// Roda a cada 60 segundos buscando carrinhos com status 'pending'
setInterval(async () => {
  console.log('[CRON Abandono] Verificando carrinhos abandonados...')
  try {
    const { data: carts, error } = await supabase
      .from('abandoned_carts')
      .select('*')
      .eq('status', 'pending')

    if (error) {
      console.error('[CRON Abandono] Erro ao buscar carrinhos abandonados:', error.message)
      return
    }

    if (!carts || carts.length === 0) return

    console.log(`[CRON Abandono] Encontrados ${carts.length} carrinho(s) pendente(s) para analisar.`)

    for (const cart of carts) {
      const elapsedMinutes = (Date.now() - new Date(cart.last_activity).getTime()) / (60 * 1000)
      let targetStage = -1
      let messageText = ''

      if (cart.recovery_stage === 2 && elapsedMinutes >= 1440) {
        targetStage = 3
      } else if (cart.recovery_stage === 1 && elapsedMinutes >= 60) {
        targetStage = 2
      } else if (cart.recovery_stage === 0 && elapsedMinutes >= 30) {
        targetStage = 1
      }

      if (targetStage === -1) {
        continue
      }

      console.log(`[RECOVERY] Carrinho ${cart.id} do cliente ${cart.client_name || 'Desconhecido'} elegível para Estágio ${targetStage} (Inativo há ${Math.round(elapsedMinutes)} minutos)`)

      // 1. Verifica se o chatbot do tenant está ativo e configurado
      const { data: settings } = await supabase
        .from('chatbot_settings')
        .select('sales_recovery_enabled, is_active, msg_sales_recovery')
        .eq('tenant_id', cart.tenant_id)
        .maybeSingle()

      if (!settings) {
        console.log(`[CRON Abandono] Chatbot não configurado para tenant ${cart.tenant_id}. Expirando carrinho.`)
        await supabase
          .from('abandoned_carts')
          .update({ status: 'expired' })
          .eq('id', cart.id)
        continue
      }

      if (!settings.is_active || !settings.sales_recovery_enabled) {
        console.log(`[CRON Abandono] Recuperador desativado para tenant ${cart.tenant_id}. Expirando carrinho.`)
        await supabase
          .from('abandoned_carts')
          .update({ status: 'expired' })
          .eq('id', cart.id)
        continue
      }

      // 2. Prepara a mensagem de acordo com o estágio
      const clientName = cart.client_name || 'Cliente'
      
      if (targetStage === 1) {
        const welcomeMsg = settings.msg_sales_recovery || `Olá {client_name} 👋\n\nPercebemos que você iniciou um pedido mas não concluiu. Seu carrinho com delícias está salvo e te esperando!\n\nAcesse e finalize agora:\n{cart_link}`
        messageText = welcomeMsg
          .replace(/{client_name}/g, clientName)
          .replace(/{cart_link}/g, cart.cart_link)
      } else if (targetStage === 2) {
        messageText = `Oi {client_name}! 😊 Seu carrinho ainda está aberto por aqui. Não passe vontade! Garanta suas delícias agora.\n\nAcesse pelo link:\n{cart_link}`
          .replace(/{client_name}/g, clientName)
          .replace(/{cart_link}/g, cart.cart_link)
      } else if (targetStage === 3) {
        messageText = `Última chance, {client_name}! ⏰ Seu carrinho será limpo em breve. Não perca suas delícias preferidas.\n\nClique para concluir seu pedido:\n{cart_link}`
          .replace(/{client_name}/g, clientName)
          .replace(/{cart_link}/g, cart.cart_link)
      }

      // 3. Adiciona mensagem na fila de campanhas
      const { error: queueErr } = await supabase.from('campaign_queue').insert({
        tenant_id: cart.tenant_id,
        client_id: cart.client_id,
        phone: cart.phone,
        message: messageText,
        status: 'pending'
      })

      if (queueErr) {
        console.error(`[CRON Abandono] Erro ao enfileirar mensagem de recuperação Estágio ${targetStage} para ${cart.phone}:`, queueErr.message)
        continue
      }

      // 4. Atualiza o estágio do carrinho
      const updateData: any = { recovery_stage: targetStage }
      if (targetStage === 3) {
        updateData.status = 'expired'
      }
      
      await supabase
        .from('abandoned_carts')
        .update(updateData)
        .eq('id', cart.id)

      console.log(`[CRON Abandono] Mensagem de recuperação Estágio ${targetStage} enfileirada para ${cart.phone}`)
      
      await new Promise(r => setTimeout(r, 1000))
    }
  } catch (err: any) {
    console.error('[CRON Abandono] Erro crítico:', err.message)
  }
}, 60 * 1000)

// ── CRON: Disparo Automático de Campanhas Agendadas (Fase 6) ─────────────────────
// Roda a cada 60 segundos buscando campanhas com status 'scheduled' e data menor ou igual a agora
setInterval(async () => {
  console.log('[CRON Campanhas] Verificando campanhas agendadas...')
  try {
    const now = new Date()
    // Busca campanhas agendadas com data de agendamento <= agora
    const { data: campaigns, error } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('status', 'scheduled')
      .lte('schedule_at', now.toISOString())

    if (error) {
      console.error('[CRON Campanhas] Erro ao buscar campanhas agendadas:', error.message)
      return
    }

    if (!campaigns || campaigns.length === 0) return

    console.log(`[CRON Campanhas] Encontradas ${campaigns.length} campanha(s) agendada(s). Processando...`)

    for (const campaign of campaigns) {
      // 1. Atualiza status para 'processing' para evitar corrida/duplo processamento
      const { error: lockErr } = await supabase
        .from('marketing_campaigns')
        .update({ status: 'processing' })
        .eq('id', campaign.id)

      if (lockErr) {
        console.error(`[CRON Campanhas] Falha ao travar campanha ${campaign.id}:`, lockErr.message)
        continue
      }

      console.log(`[CRON Campanhas] Processando campanha: "${campaign.name}" (${campaign.id})`)

      try {
        const tenantId = campaign.tenant_id

        // 2. Carrega dados do estabelecimento
        const { data: tenant, error: tenantErr } = await supabase
          .from('tenants')
          .select('id, name, slug')
          .eq('id', tenantId)
          .maybeSingle()

        if (tenantErr || !tenant) {
          throw new Error(`Tenant não encontrado: ${tenantId}`)
        }

        // 3. Verifica conexão da instância do WhatsApp
        const { data: waInst, error: waErr } = await supabase
          .from('whatsapp_instances')
          .select('status')
          .eq('tenant_id', tenantId)
          .maybeSingle()

        if (waErr || !waInst || waInst.status !== 'connected') {
          throw new Error('Instância do WhatsApp não está conectada para este estabelecimento')
        }

        // 4. Busca clientes do tenant
        const { data: targets, error: targetErr } = await supabase
          .from('customers')
          .select('id, name, phone, email, is_vip, created_at, last_order_at, birthday, total_orders')
          .eq('tenant_id', tenantId)
          .is('deleted_at', null)

        if (targetErr) throw targetErr

        // 5. Filtra os clientes dinamicamente em JS de acordo com a segmentação (Fase 11)
        const segment = campaign.segment || 'all'
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
            .from('abandoned_carts')
            .select('phone')
            .eq('tenant_id', tenantId)
            .eq('status', 'pending')
          
          const abandonedPhones = new Set((abandonedCarts || []).map((ac: any) => ac.phone.replace(/\D/g, "")))
          filteredTargets = filteredTargets.filter((c: any) => {
            const cleanPhone = c.phone ? c.phone.replace(/\D/g, "") : ""
            return abandonedPhones.has(cleanPhone)
          })
        }

        console.log(`[CRON Campanhas] Filtro "${segment}": de ${targets?.length || 0} clientes para ${filteredTargets.length} elegíveis.`)

        const validTargets = filteredTargets.filter((c: any) => c.phone && c.phone.trim() !== "")

        if (validTargets.length === 0) {
          throw new Error('Nenhum cliente com telefone válido encontrado para esta segmentação')
        }

        // 6. Prepara as variáveis
        const companyName = tenant.name || 'nossa loja'
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const menuLink = `${appUrl}/menu/${tenant.slug || ''}`
        const currentDate = now.toLocaleDateString('pt-BR')
        const currentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

        const queueEntries = validTargets.map((c: any) => {
          const clientName = c.name || 'Cliente'
          const clientFirstName = clientName.split(" ")[0]

          let birthdayStr = ''
          if (c.birthday) {
            const parts = c.birthday.split('-')
            if (parts.length >= 3) {
              birthdayStr = `${parts[2]}/${parts[1]}`
            }
          }

          const templateData = {
            clientName,
            firstName: clientFirstName,
            phone: c.phone.replace(/@lid/g, '').replace(/@c\.us/g, ''),
            companyName,
            menuLink,
            birthday: birthdayStr,
            coupon: c.is_vip ? 'VIP10' : 'CUPOM5',
            currentDate,
            currentTime
          }

          const formattedMsg = replaceVariables(campaign.message, templateData)
          const isLid = c.phone.includes('@lid')

          return {
            tenant_id: tenantId,
            phone: isLid ? c.phone : c.phone.replace(/\D/g, ""),
            message: formattedMsg,
            status: 'pending',
            scheduled_at: now.toISOString(),
            campaign_id: campaign.id
          }
        })

        // Enfileira mensagens na fila
        const { error: queueErr } = await supabase.from('campaign_queue').insert(queueEntries)
        if (queueErr) throw queueErr

        // Insere registros iniciais de log na tabela campaign_logs
        const campaignLogEntries = queueEntries.map((q: any) => ({
          tenant_id: tenantId,
          campaign_id: campaign.id,
          phone: q.phone,
          message: q.message,
          status: 'Pendente'
        }))
        await supabase.from('campaign_logs').insert(campaignLogEntries)

        // 7. Marca campanha como 'completed'
        await supabase
          .from('marketing_campaigns')
          .update({ status: 'completed' })
          .eq('id', campaign.id)

        console.log(`[CRON Campanhas] Campanha ${campaign.id} disparada com sucesso! ${queueEntries.length} mensagens enfileiradas.`)

      } catch (runErr: any) {
        console.error(`[CRON Campanhas] Falha ao processar campanha ${campaign.id}:`, runErr.message)
        await supabase
          .from('marketing_campaigns')
          .update({ status: 'failed' })
          .eq('id', campaign.id)
      }
    }
  } catch (err: any) {
    console.error('[CRON Campanhas] Erro crítico no scheduler de campanhas:', err.message)
  }
}, 60 * 1000) // Executa a cada minuto

// ── Global Anti-Crash Handlers ───────────────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Anti-Crash] Unhandled Rejection detected:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Anti-Crash] Uncaught Exception detected:', err.message);
});

// ── Inicializa o servidor ─────────────────────────────────────────────────────
const PORT = process.env.WA_SERVICE_PORT || 3001

app.listen(PORT, async () => {
  console.log(`\n🤖 WhatsApp Service rodando na porta ${PORT}`)
  console.log(`   Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 40)}...`)
  console.log(`   App URL: ${process.env.NEXT_PUBLIC_APP_URL}\n`)

  // Restaura sessões que estavam conectadas antes do restart
  await manager.restoreAllSessions()
})
