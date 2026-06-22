import { Client, LocalAuth, Message } from 'whatsapp-web.js'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Carrega .env.local e .env da raiz do projeto
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function formatPhone(phone: string): string {
  return phone.replace('@c.us', '').replace(/\D/g, '')
}

export class WhatsAppManager {
  public clients: Map<string, Client> = new Map()
  public qrCodes: Map<string, string> = new Map()
  public workerInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startQueueWorker()
  }

  // ─── QUEUE WORKER: Processador da Fila de Envio (Fase 9) ──────────────────────
  startQueueWorker() {
    if (this.workerInterval) return
    console.log('⚡ [Queue Worker] Iniciando processador de fila do WhatsApp...')
    this.workerInterval = setInterval(async () => {
      await this.processQueue()
      await this.processCampaignQueue()
    }, 3000) // roda a cada 3 segundos
  }

  async processQueue() {
    try {
      // Busca até 5 mensagens pendentes com agendamento menor ou igual a agora
      const { data: queueItems, error } = await supabase
        .from('whatsapp_message_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .order('created_at', { ascending: true })
        .limit(5)

      if (error) {
        console.error('[Queue Worker] Erro ao buscar fila:', error.message)
        return
      }

      if (!queueItems || queueItems.length === 0) return

      for (const item of queueItems) {
        // Marca item como em processamento para evitar duplicidade
        await supabase
          .from('whatsapp_message_queue')
          .update({ status: 'processing' })
          .eq('id', item.id)

        const client = this.clients.get(item.tenant_id)
        if (!client) {
          console.warn(`[Queue Worker] Cliente não conectado para o tenant: ${item.tenant_id}`)
          await supabase
            .from('whatsapp_message_queue')
            .update({ 
              status: 'pending', 
              attempts: item.attempts + 1, 
              error_message: 'Instância desconectada ou carregando' 
            })
            .eq('id', item.id)
          continue
        }

        try {
          // Normalização do número de telefone e Linked Identity (LID) (Fase 4)
          const isLid = item.phone.includes('@lid') || 
                        (item.phone.replace(/\D/g, '').startsWith('79') && item.phone.replace(/\D/g, '').length >= 14)
          
          let formattedPhone = ''
          let cleanPhone = ''
          
          if (isLid) {
            cleanPhone = item.phone.replace(/@lid/g, '').replace(/\D/g, '')
            formattedPhone = `${cleanPhone}@lid`
          } else {
            cleanPhone = item.phone.replace(/@c\.us/g, '').replace(/\D/g, '')
            formattedPhone = item.phone.includes('@')
              ? item.phone
              : (cleanPhone.length <= 11
                ? `55${cleanPhone}@c.us`
                : `${cleanPhone}@c.us`)
          }

          const dbPhone = isLid ? `${cleanPhone}@lid` : cleanPhone

          console.log(`[Queue Worker] Iniciando envio. Destino original: "${item.phone}", formatado: "${formattedPhone}", dbPhone: "${dbPhone}"`)

          // Envia a mensagem pelo WhatsApp Web
          const result = await client.sendMessage(formattedPhone, item.message)
          console.log(`[Queue Worker] Mensagem enviada com sucesso para ${item.phone}. Resposta API:`, JSON.stringify(result))

          // Sucesso: atualiza status da fila
          await supabase
            .from('whatsapp_message_queue')
            .update({ status: 'sent', attempts: item.attempts + 1 })
            .eq('id', item.id)

          // Atualiza campaign_logs se a mensagem pertence a uma campanha
          if (item.campaign_id) {
            try {
              await supabase
                .from('campaign_logs')
                .update({ status: 'Entregue', sent_at: new Date().toISOString() })
                .eq('campaign_id', item.campaign_id)
                .eq('phone', item.phone)
            } catch (campLogErr: any) {
              console.error('[Queue Worker] Erro ao atualizar campaign_logs (sucesso):', campLogErr.message)
            }
          }

          // Salva na nova tabela de auditoria message_logs (Fase 10 & 11) - Envelopado em try/catch para resiliência
          try {
            await supabase.from('message_logs').insert({
              tenant_id: item.tenant_id,
              phone: item.phone,
              message: item.message,
              direction: 'outbound',
              status: 'sent',
              provider_response: { success: true, id: result.id?._serialized || null, deviceType: result.deviceType || null }
            })
          } catch (logErr: any) {
            console.error('[Queue Worker] Erro ao salvar em message_logs:', logErr.message)
          }

          // Salva mensagem no histórico unificado como outbound (Fase 2)
          await supabase.from('messages').insert({
            tenant_id: item.tenant_id,
            phone: dbPhone,
            message: item.message,
            direction: 'outbound'
          })

          // Também atualiza whatsapp_messages para manter compatibilidade com chat antigo se existir
          const { data: conv } = await supabase
            .from('chatbot_conversations')
            .select('id')
            .eq('tenant_id', item.tenant_id)
            .eq('customer_phone', dbPhone)
            .maybeSingle()

          if (conv) {
            await supabase.from('whatsapp_messages').insert({
              tenant_id: item.tenant_id,
              conversation_id: conv.id,
              direction: 'outbound',
              content: item.message,
              status: 'sent'
            })
          }

          // Salva log de envio (Fase 15)
          await supabase.from('whatsapp_logs').insert({
            tenant_id: item.tenant_id,
            level: 'info',
            message: 'Mensagem enviada',
            details: { phone: item.phone, message: item.message, messageId: result.id?._serialized || null }
          })

          // Delay preventivo anti-bloqueio entre disparos
          await new Promise(resolve => setTimeout(resolve, 2500))

        } catch (err: any) {
          console.error(`[Queue Worker] Erro ao enviar mensagem para ${item.phone}:`, err.message)
          const nextStatus = item.attempts >= 3 ? 'failed' : 'pending'
          
          // Registra falha na tabela message_logs (Fase 10 & 11) - Envelopado em try/catch para resiliência
          if (item.campaign_id && nextStatus === 'failed') {
            try {
              await supabase
                .from('campaign_logs')
                .update({ status: 'Falhou', error: err.message, sent_at: new Date().toISOString() })
                .eq('campaign_id', item.campaign_id)
                .eq('phone', item.phone)
            } catch (campLogErr: any) {
              console.error('[Queue Worker] Erro ao atualizar campaign_logs (falha):', campLogErr.message)
            }
          }

          await supabase
            .from('whatsapp_message_queue')
            .update({ 
              status: nextStatus, 
              attempts: item.attempts + 1, 
              error_message: err.message 
            })
            .eq('id', item.id)

          // Registra falha na tabela message_logs (Fase 10 & 11) - Envelopado em try/catch para resiliência
          try {
            await supabase.from('message_logs').insert({
              tenant_id: item.tenant_id,
              phone: item.phone,
              message: item.message,
              direction: 'outbound',
              status: 'failed',
              error_message: err.message,
              provider_response: { success: false, error: err.message }
            })
          } catch (logErr: any) {
            console.error('[Queue Worker] Erro ao salvar falha em message_logs:', logErr.message)
          }

          try {
            await supabase.from('whatsapp_logs').insert({
              tenant_id: item.tenant_id,
              level: 'error',
              message: `Erro ao enviar mensagem: ${err.message}`,
              details: { phone: item.phone, error: err.message }
            })
          } catch (logErr: any) {
            console.error('[Queue Worker] Erro ao salvar em whatsapp_logs:', logErr.message)
          }
        }
      }
    } catch (globalErr: any) {
      console.error('[Queue Worker] Erro crítico no loop da fila:', globalErr.message)
    }
  }

  // ─── SESSÕES DO WHATSAPP ──────────────────────────────────────────────────────
  async startSession(tenantId: string): Promise<{ status: string }> {
    if (this.clients.has(tenantId)) {
      console.log(`[${tenantId}] Sessão já está rodando`)
      return { status: 'already_running' }
    }

    console.log(`[${tenantId}] Iniciando sessão WhatsApp...`)

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: tenantId,
        dataPath: path.resolve(__dirname, '../.wwebjs_auth'),
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      },
    })

    // Evento: QR Code gerado
    client.on('qr', async (qr: string) => {
      console.log(`[${tenantId}] ✅ QR Code gerado (${qr.length} chars)`)
      this.qrCodes.set(tenantId, qr)

      // Atualiza whatsapp_sessions antigo
      await supabase.from('whatsapp_sessions').upsert(
        { tenant_id: tenantId, status: 'qr_pending', qr_code: qr, updated_at: new Date().toISOString() },
        { onConflict: 'tenant_id' }
      )
      
      // Atualiza whatsapp_instances novo (Fase 7)
      await supabase.from('whatsapp_instances').upsert(
        {
          tenant_id: tenantId,
          status: 'qr_pending',
          instance_name: `Instância ${tenantId}`,
          webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whatsapp/webhook`,
          session_data: { qr },
          updated_at: new Date().toISOString()
        },
        { onConflict: 'tenant_id' }
      )
    })

    // Evento: Autenticado
    client.on('authenticated', () => {
      console.log(`[${tenantId}] 🔑 Autenticado!`)
    })

    // Evento: Pronto para usar
    client.on('ready', async () => {
      const phone = client.info?.wid?.user || ''
      console.log(`[${tenantId}] 🟢 WhatsApp conectado! Número: ${phone}`)
      this.qrCodes.delete(tenantId)

      const { data: company } = await supabase.from('tenants').select('name').eq('id', tenantId).single()
      const instanceName = `Instância ${company?.name || tenantId}`

      // Atualiza tabelas de conexão
      await supabase.from('whatsapp_sessions').upsert(
        { tenant_id: tenantId, status: 'connected', qr_code: null, phone_number: phone, last_activity: new Date().toISOString(), updated_at: new Date().toISOString() },
        { onConflict: 'tenant_id' }
      )
      await supabase.from('chatbot_settings').upsert(
        { tenant_id: tenantId, whatsapp_connected: true, whatsapp_number: phone },
        { onConflict: 'tenant_id' }
      )
      await supabase.from('whatsapp_instances').upsert(
        {
          tenant_id: tenantId,
          phone_number: phone,
          instance_name: instanceName,
          status: 'connected',
          webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whatsapp/webhook`,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'tenant_id' }
      )
    })

    // Evento: MENSAGEM RECEBIDA (Fase 2 & Webhook)
    client.on('message', async (msg: Message) => {
      if (msg.fromMe) return
      if (msg.from.includes('@g.us')) return
      if (msg.from.includes('@newsletter')) return
      if (msg.from === 'status@broadcast') return

      const body = msg.body || ''
      const notifyName = (msg as any)._data?.notifyName || (msg as any).notifyName || 'Cliente'
      console.log(`[${tenantId}] 📨 Mensagem recebida de ${msg.from}: "${body.slice(0, 50)}"`)

      try {
        const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whatsapp/webhook`
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId,
            from: msg.from,
            body,
            notifyName,
            direction: 'inbound'
          })
        })

        if (!res.ok) {
          console.error(`[${tenantId}] ❌ Webhook respondeu com erro: ${res.status}`)
        }
      } catch (err: any) {
        console.error(`[${tenantId}] ❌ Falha ao repassar mensagem ao webhook do Next.js:`, err.message)
      }
    })

    // Evento: Desconectado
    client.on('disconnected', async (reason) => {
      console.log(`[${tenantId}] 🔴 Desconectado: ${reason}`)
      this.clients.delete(tenantId)
      this.qrCodes.delete(tenantId)

      // Auto-limpeza do diretório de sessão para evitar travamentos de lockfile
      try {
        const fs = require('fs')
        const sessionDir = path.resolve(__dirname, `../.wwebjs_auth/session-${tenantId}`)
        if (fs.existsSync(sessionDir)) {
          console.log(`[${tenantId}] Removendo cache de sessão para liberar lockfile...`)
          fs.rmSync(sessionDir, { recursive: true, force: true })
        }
      } catch (cleanErr: any) {
        console.error(`[${tenantId}] Erro ao limpar diretório de sessão desconectada:`, cleanErr.message)
      }

      await supabase.from('whatsapp_sessions').upsert(
        { tenant_id: tenantId, status: 'disconnected', qr_code: null, updated_at: new Date().toISOString() },
        { onConflict: 'tenant_id' }
      )
      await supabase.from('chatbot_settings')
        .update({ whatsapp_connected: false })
        .eq('tenant_id', tenantId)

      await supabase.from('whatsapp_instances')
        .update({ status: 'disconnected', updated_at: new Date().toISOString() })
        .eq('tenant_id', tenantId)
    })

    this.clients.set(tenantId, client)
    await client.initialize()
    return { status: 'starting' }
  }

  // ─── RESTAURAÇÃO DE SESSÕES ──────────────────────────────────────────────────
  async restoreAllSessions() {
    const { data: sessions } = await supabase
      .from('whatsapp_sessions')
      .select('tenant_id')
      .eq('status', 'connected')

    if (!sessions?.length) return
    console.log(`Restaurando ${sessions.length} sessão(ões)...`)
    for (const s of sessions) {
      await this.startSession(s.tenant_id)
      await new Promise(r => setTimeout(r, 3000))
    }
  }

  getStatus(tenantId: string) {
    return this.clients.has(tenantId) ? 'running' : 'stopped'
  }

  getQR(tenantId: string) {
    return this.qrCodes.get(tenantId) || null
  }

  async disconnect(tenantId: string) {
    const client = this.clients.get(tenantId)
    if (client) {
      await client.destroy()
      this.clients.delete(tenantId)
      this.qrCodes.delete(tenantId)
    }
  }

  // Fallback manual direto para envios sem fila (ex: alertas do sistema de login/senha se houver)
  async sendMessage(tenantId: string, phone: string, message: string) {
    const client = this.clients.get(tenantId)
    if (!client) return { error: 'Não conectado' }
    
    const isLid = phone.includes('@lid') || 
                  (phone.replace(/\D/g, '').startsWith('79') && phone.replace(/\D/g, '').length >= 14)
    
    let formatted = ''
    if (isLid) {
      formatted = `${phone.replace(/@lid/g, '').replace(/\D/g, '')}@lid`
    } else {
      formatted = phone.includes('@') ? phone : `55${phone.replace(/\D/g, '')}@c.us`
    }
    
    await client.sendMessage(formatted, message)
    return { ok: true }
  }

  async processCampaignQueue() {
    try {
      const { data: queueItems, error } = await supabase
        .from('campaign_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .order('created_at', { ascending: true })
        .limit(5)

      if (error) {
        console.error('[Campaign Queue Worker] Erro ao buscar fila:', error.message)
        return
      }

      if (!queueItems || queueItems.length === 0) return

      for (const item of queueItems) {
        await supabase
          .from('campaign_queue')
          .update({ status: 'processing' })
          .eq('id', item.id)

        const client = this.clients.get(item.tenant_id)
        if (!client) {
          console.warn(`[Campaign Queue Worker] Cliente não conectado para o tenant: ${item.tenant_id}`)
          await supabase
            .from('campaign_queue')
            .update({ 
              status: 'failed', 
              attempts: item.attempts + 1, 
              error: 'WhatsApp desconectado' 
            })
            .eq('id', item.id)
          
          if (item.campaign_id) {
            try {
              await supabase
                .from('campaign_logs')
                .update({ status: 'Falhou', error: 'WhatsApp desconectado', sent_at: new Date().toISOString() })
                .eq('campaign_id', item.campaign_id)
                .eq('phone', item.phone)
            } catch (campLogErr: any) {
              console.error('[Campaign Queue Worker] Erro ao atualizar campaign_logs (falha):', campLogErr.message)
            }
          }
          console.log(`[CAMPAIGN] Falha ao enviar: WhatsApp desconectado`)
          continue
        }

        try {
          const isLid = item.phone.includes('@lid') || 
                        (item.phone.replace(/\D/g, '').startsWith('79') && item.phone.replace(/\D/g, '').length >= 14)
          
          let formattedPhone = ''
          let cleanPhone = ''
          
          if (isLid) {
            cleanPhone = item.phone.replace(/@lid/g, '').replace(/\D/g, '')
            formattedPhone = `${cleanPhone}@lid`
          } else {
            cleanPhone = item.phone.replace(/@c\.us/g, '').replace(/\D/g, '')
            formattedPhone = item.phone.includes('@')
              ? item.phone
              : (cleanPhone.length <= 11
                ? `55${cleanPhone}@c.us`
                : `${cleanPhone}@c.us`)
          }

          const dbPhone = isLid ? `${cleanPhone}@lid` : cleanPhone

          console.log(`[Campaign Queue Worker] Iniciando envio. Destino: "${item.phone}", formatado: "${formattedPhone}"`)

          const result = await client.sendMessage(formattedPhone, item.message)
          console.log(`[Campaign Queue Worker] Mensagem enviada com sucesso para ${item.phone}. ID: ${result.id?._serialized}`)

          await supabase
            .from('campaign_queue')
            .update({ status: 'sent', sent_at: new Date().toISOString(), attempts: item.attempts + 1 })
            .eq('id', item.id)

          if (item.campaign_id) {
            try {
              await supabase
                .from('campaign_logs')
                .update({ status: 'Entregue', sent_at: new Date().toISOString() })
                .eq('campaign_id', item.campaign_id)
                .eq('phone', item.phone)
            } catch (campLogErr: any) {
              console.error('[Campaign Queue Worker] Erro ao atualizar campaign_logs (sucesso):', campLogErr.message)
            }
          }

          try {
            await supabase.from('message_logs').insert({
              tenant_id: item.tenant_id,
              phone: item.phone,
              message: item.message,
              direction: 'outbound',
              status: 'sent',
              provider_response: { success: true, id: result.id?._serialized || null, deviceType: result.deviceType || null }
            })
          } catch (logErr: any) {
            console.error('[Campaign Queue Worker] Erro ao salvar em message_logs:', logErr.message)
          }

          await supabase.from('messages').insert({
            tenant_id: item.tenant_id,
            phone: dbPhone,
            message: item.message,
            direction: 'outbound'
          })

          await supabase.from('whatsapp_logs').insert({
            tenant_id: item.tenant_id,
            level: 'info',
            message: 'Campanha enviada',
            details: { phone: item.phone, messageId: result.id?._serialized || null }
          })

          console.log(`[CAMPAIGN] Mensagem enviada para ${item.phone}`)

          await new Promise(resolve => setTimeout(resolve, 2500))

        } catch (err: any) {
          console.error(`[Campaign Queue Worker] Erro ao enviar mensagem para ${item.phone}:`, err.message)
          const nextStatus = item.attempts >= 3 ? 'failed' : 'pending'
          
          if (item.campaign_id && nextStatus === 'failed') {
            try {
              await supabase
                .from('campaign_logs')
                .update({ status: 'Falhou', error: err.message, sent_at: new Date().toISOString() })
                .eq('campaign_id', item.campaign_id)
                .eq('phone', item.phone)
            } catch (campLogErr: any) {
              console.error('[Campaign Queue Worker] Erro ao atualizar campaign_logs (falha):', campLogErr.message)
            }
          }

          await supabase
            .from('campaign_queue')
            .update({ 
              status: nextStatus, 
              attempts: item.attempts + 1, 
              error: err.message 
            })
            .eq('id', item.id)

          try {
            await supabase.from('message_logs').insert({
              tenant_id: item.tenant_id,
              phone: item.phone,
              message: item.message,
              direction: 'outbound',
              status: 'failed',
              error_message: err.message,
              provider_response: { success: false, error: err.message }
            })
          } catch (logErr: any) {
            console.error('[Campaign Queue Worker] Erro ao salvar falha em message_logs:', logErr.message)
          }

          try {
            await supabase.from('whatsapp_logs').insert({
              tenant_id: item.tenant_id,
              level: 'error',
              message: `Erro ao enviar campanha: ${err.message}`,
              details: { phone: item.phone, error: err.message }
            })
          } catch (logErr: any) {
            console.error('[Campaign Queue Worker] Erro ao salvar em whatsapp_logs:', logErr.message)
          }
        }
      }
    } catch (globalErr: any) {
      console.error('[Campaign Queue Worker] Erro crítico no loop da fila de campanha:', globalErr.message)
    }
  }
}
