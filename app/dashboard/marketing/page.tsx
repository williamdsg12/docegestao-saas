"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Users, MessageSquare, ShoppingBag, CheckCircle2, 
  TrendingUp, Share2, Copy, Zap, 
  Clock, Sparkles, Filter, Search, Bot,
  Send, History, Calendar, Loader2, AlertCircle, RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useBusiness } from "@/hooks/useBusiness"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface Campaign {
  id: string
  name: string
  message: string
  status: 'draft' | 'scheduled' | 'processing' | 'completed' | 'failed'
  schedule_at: string
  created_at: string
}

export default function MarketingDashboard() {
  const { profile, business } = useBusiness()
  const tenantId = profile?.tenant_id || profile?.company_id

  // Estados do formulário de nova campanha
  const [name, setName] = useState("")
  const [message, setMessage] = useState("Olá {client_name}! 🧁 Temos novidades deliciosas hoje. Confira em nosso cardápio: {menu_link}")
  const [segment, setSegment] = useState("all")
  const [scheduleAt, setScheduleAt] = useState("")
  const [isSending, setIsSending] = useState(false)

  // Lista de campanhas enviadas
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(true)

  // Estatísticas e contadores
  const [customerStats, setCustomerStats] = useState({
    total: 0,
    vip: 0,
    inactive: 0,
    new: 0,
    recent: 0,
    birthday: 0,
    noOrders: 0,
    abandonedCarts: 0
  })
  const [funnelStats, setFunnelStats] = useState({
    leadsCount: 0,
    totalSpent: 0,
    conversionRate: 0,
    campaignsCount: 0,
    messagesDelivered: 0,
    messagesFailed: 0
  })

  // Link de aquisição de Leads
  const [waText, setWaText] = useState("Olá! Gostaria de ver o cardápio e fazer um pedido.")
  const companySlug = profile?.business_name ? profile.business_name.toLowerCase().replace(/\s+/g, '-') : 'menu'
  const waLink = `https://wa.me/${business?.phone?.replace(/\D/g, '') || profile?.whatsapp?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(waText)}`

  const copyLink = () => {
    navigator.clipboard.writeText(waLink)
    toast.success("Link do WhatsApp copiado!")
  }

  // Carrega campanhas históricas (Fase 10)
  const fetchCampaigns = useCallback(async () => {
    if (!tenantId) return
    try {
      setLoadingCampaigns(true)
      const res = await fetch(`/api/marketing/campaigns?tenantId=${tenantId}`)
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data)
      }
    } catch (err) {
      console.error("Erro ao carregar campanhas:", err)
    } finally {
      setLoadingCampaigns(false)
    }
  }, [tenantId])

  // Carrega estatísticas dos clientes e funil (Fase 13)
  const fetchStats = useCallback(async () => {
    if (!tenantId) return
    try {
      // 1. Estatísticas de Clientes
      const { data: clients } = await supabase
        .from('customers')
        .select('is_vip, created_at, last_order_at, total_spent, birthday, total_orders')
        .eq('tenant_id', tenantId)

      if (clients) {
        const now = new Date()
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const currentMonth = now.getMonth() + 1

        let vip = 0, inactive = 0, newClients = 0, recent = 0, totalSpent = 0, birthdayCount = 0, noOrders = 0

        clients.forEach(c => {
          if (c.is_vip) vip++
          if (c.created_at && new Date(c.created_at) >= oneWeekAgo) newClients++
          if (c.last_order_at) {
            const lastOrder = new Date(c.last_order_at)
            if (lastOrder >= oneWeekAgo) recent++
            if (lastOrder < thirtyDaysAgo) inactive++
          } else {
            inactive++ // sem pedidos é considerado inativo
            noOrders++
          }
          if (Number(c.total_orders || 0) === 0 && c.last_order_at) {
            noOrders++
          }
          if (c.birthday) {
            const parts = c.birthday.split('-')
            if (parts.length >= 2 && parseInt(parts[1], 10) === currentMonth) {
              birthdayCount++
            }
          }
          totalSpent += Number(c.total_spent || 0)
        })

        // Busca count de carrinhos abandonados pendentes
        const { count: abandonedCount } = await supabase
          .from('abandoned_carts')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('status', 'pending')

        setCustomerStats({
          total: clients.length,
          vip,
          inactive,
          new: newClients,
          recent,
          birthday: birthdayCount,
          noOrders,
          abandonedCarts: abandonedCount || 0
        })

        // 2. Calcula taxa de conversão baseada em compras
        const convertingClients = clients.filter(c => Number(c.total_spent) > 0).length
        const conversionRate = clients.length > 0 ? (convertingClients / clients.length) * 100 : 0

        // 3. Busca campanhas concluídas e logs de mensagens entregues da fila
        const { count: campaignsCount } = await supabase
          .from('marketing_campaigns')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('status', 'completed')

        const { count: messagesDelivered } = await supabase
          .from('campaign_queue')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('status', 'sent')

        const { count: messagesFailed } = await supabase
          .from('campaign_queue')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('status', 'failed')

        setFunnelStats({
          leadsCount: clients.length,
          totalSpent,
          conversionRate,
          campaignsCount: campaignsCount || 0,
          messagesDelivered: messagesDelivered || 0,
          messagesFailed: messagesFailed || 0
        })
      }
    } catch (err) {
      console.error("Erro ao calcular estatísticas:", err)
    }
  }, [tenantId])

  useEffect(() => {
    if (!tenantId) return

    fetchCampaigns()
    fetchStats()

    // Realtime para atualizar estatísticas e lista de campanhas na hora (Fase 10)
    const channel = supabase
      .channel(`realtime-marketing-dashboard-${tenantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers', filter: `tenant_id=eq.${tenantId}` },
        () => {
          console.log('[Realtime] Clientes atualizados')
          fetchStats()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'marketing_campaigns', filter: `tenant_id=eq.${tenantId}` },
        () => {
          console.log('[Realtime] Campanhas atualizadas')
          fetchCampaigns()
          fetchStats()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaign_queue', filter: `tenant_id=eq.${tenantId}` },
        () => {
          console.log('[Realtime] Fila de campanhas atualizada')
          fetchCampaigns()
          fetchStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId, fetchCampaigns, fetchStats])

  // Criar e enviar nova campanha
  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) return
    if (!name.trim() || !message.trim()) {
      toast.error("Preencha o nome e a mensagem da campanha")
      return
    }

    setIsSending(true)
    const toastId = toast.loading("Enfileirando disparos da campanha...")

    try {
      const res = await fetch('/api/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name,
          message,
          segment,
          scheduleAt: scheduleAt || undefined
        })
      })

      if (res.ok) {
        const result = await res.json()
        toast.success(`Campanha criada! ${result.targetsCount} envios foram agendados na fila.`, { id: toastId })
        setName("")
        setScheduleAt("")
        fetchCampaigns()
        fetchStats()
      } else {
        const errData = await res.json()
        throw new Error(errData.error || "Erro ao criar campanha")
      }
    } catch (err: any) {
      toast.error(err.message || "Erro de conexão", { id: toastId })
    } finally {
      setIsSending(false)
    }
  }

  const insertVariable = (variable: string) => {
    setMessage(prev => prev + " " + variable)
  }

  // Renderização de cards de métricas
  const funnelSteps = [
    { label: 'Total de Leads', value: customerStats.total, icon: Users, color: 'bg-blue-500' },
    { label: 'Campanhas Enviadas', value: funnelStats.campaignsCount, icon: Send, color: 'bg-pink-500' },
    { label: 'Mensagens Entregues', value: funnelStats.messagesDelivered, icon: CheckCircle2, color: 'bg-emerald-500' },
    { label: 'Mensagens Falhadas', value: funnelStats.messagesFailed, icon: AlertCircle, color: 'bg-red-500' },
  ]

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
            <h1 className="text-4xl font-black text-gray-800 italic tracking-tighter uppercase flex items-center gap-2">
              Marketing <span className="text-pink-600">VIP</span>
            </h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              Painel de Automação de Disparos e Conversões
            </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => { fetchCampaigns(); fetchStats(); }} className="h-10 px-4 rounded-xl border bg-white text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
            <RefreshCw size={16} className="mr-2" /> Atualizar Dados
          </Button>
        </div>
      </div>

      {/* Visualização de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {funnelSteps.map((step, i) => (
            <div key={i} className="bg-white border border-gray-100 p-6 rounded-[24px] space-y-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                <div className={cn("size-12 rounded-2xl flex items-center justify-center text-white shadow-md", step.color)}>
                    <step.icon size={22} />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{step.label}</p>
                    <h3 className="text-2xl font-black italic tracking-tighter text-gray-800 mt-1">{step.value}</h3>
                </div>
            </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Formulário de Nova Campanha */}
        <div className="xl:col-span-2 space-y-8">
            <div className="bg-white border border-gray-100 rounded-[28px] p-8 space-y-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="size-10 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-600">
                        <Send size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-800 uppercase italic tracking-tighter">Criar Nova Campanha</h3>
                      <p className="text-xs text-gray-400">Enfileire disparos em lote para segmentos específicos</p>
                    </div>
                </div>

                <form onSubmit={handleSendCampaign} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nome da Campanha</label>
                      <Input 
                        placeholder="Ex: Promoção de Bolos de Chocolate" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-gray-50 border-gray-100 rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Segmento de Clientes</label>
                      <select 
                        value={segment}
                        onChange={(e) => setSegment(e.target.value)}
                        className="w-full h-10 px-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                      >
                        <option value="all">Todos os Clientes ({customerStats.total})</option>
                        <option value="vip">Clientes VIP ({customerStats.vip})</option>
                        <option value="inactive">Clientes Inativos - Sem compras há 30 dias ({customerStats.inactive})</option>
                        <option value="new">Novos Clientes - Cadastrados há 7 dias ({customerStats.new})</option>
                        <option value="recent">Últimos Compradores - Compras há 7 dias ({customerStats.recent})</option>
                        <option value="birthday">Aniversariantes do Mês ({customerStats.birthday})</option>
                        <option value="no_orders">Clientes sem pedido ({customerStats.noOrders})</option>
                        <option value="abandoned_cart">Carrinho Abandonado ({customerStats.abandonedCarts})</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Mensagem de Envio</label>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => insertVariable("{client_name}")} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">
                          {"{client_name}"}
                        </button>
                        <button type="button" onClick={() => insertVariable("{menu_link}")} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">
                          {"{menu_link}"}
                        </button>
                      </div>
                    </div>
                    <Textarea 
                      rows={5}
                      placeholder="Escreva sua mensagem... Use as variáveis acima para personalizar o envio."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="bg-gray-50 border-gray-100 rounded-xl font-mono text-sm leading-relaxed"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                        <Calendar size={14} /> Agendar Disparo (Opcional)
                      </label>
                      <Input 
                        type="datetime-local" 
                        value={scheduleAt}
                        onChange={(e) => setScheduleAt(e.target.value)}
                        className="bg-gray-50 border-gray-100 rounded-xl text-sm"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isSending}
                      className="w-full h-11 bg-pink-600 hover:bg-pink-700 text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {isSending ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Enfileirando...
                        </>
                      ) : (
                        <>
                          <Send size={16} /> Disparar Campanha
                        </>
                      )}
                    </Button>
                  </div>
                </form>
            </div>

            {/* Histórico de Campanhas */}
            <div className="bg-white border border-gray-100 rounded-[28px] p-8 space-y-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600">
                        <History size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-800 uppercase italic tracking-tighter">Histórico de Campanhas</h3>
                      <p className="text-xs text-gray-400">Acompanhe o andamento dos disparos antigos</p>
                    </div>
                </div>

                {loadingCampaigns ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 size={24} className="animate-spin text-pink-500" />
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400 bg-gray-50 rounded-2xl border border-dashed">
                    <AlertCircle size={24} className="mb-2" />
                    <p className="text-xs font-semibold uppercase tracking-wider">Nenhuma campanha enviada ainda</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaigns.map((camp) => (
                      <div key={camp.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 border rounded-2xl gap-4">
                        <div className="space-y-1">
                          <p className="font-bold text-gray-800 text-sm">{camp.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono line-clamp-1">{camp.message}</p>
                          <p className="text-[8px] text-gray-400 uppercase font-semibold">
                            Criação: {new Date(camp.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={cn(
                            "border-none text-[8px] font-black uppercase px-2 py-1 rounded-lg",
                            camp.status === "completed" ? "bg-green-100 text-green-700" :
                            camp.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                            camp.status === "processing" ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          )}>
                            {camp.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
        </div>

        {/* Barra Lateral / Recuperação e Links */}
        <div className="space-y-8">
            {/* Recuperação de Vendas Automática */}
            <div className="bg-gradient-to-br from-pink-600 to-rose-500 rounded-[28px] p-6 text-white space-y-4 shadow-md">
                <div className="size-10 bg-white/20 rounded-xl flex items-center justify-center"><Clock size={20} /></div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-pink-100">Recuperador de Vendas</h4>
                <h3 className="text-3xl font-black italic tracking-tighter">Ativo (30m)</h3>
                <p className="text-[10px] text-white/80 leading-relaxed font-medium">
                  Carrinhos de compras não finalizados receberão uma mensagem automática pelo WhatsApp com o link de recuperação exato após 30 minutos de inatividade.
                </p>
            </div>

            {/* Gerador de Link Inteligente */}
            <div className="bg-white border border-gray-100 rounded-[28px] p-6 space-y-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Share2 size={18} />
                    </div>
                    <h4 className="text-[10px] font-black uppercase text-gray-700 tracking-wider">Link Inteligente</h4>
                </div>
                
                <p className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed">
                  Use este link na Bio do Instagram ou no Google para capturar leads automaticamente.
                </p>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Mensagem Inicial</label>
                        <Input 
                            value={waText}
                            onChange={(e) => setWaText(e.target.value)}
                            className="bg-gray-50 border-gray-100 rounded-xl text-xs"
                        />
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 break-all text-[9px] font-mono text-gray-400">
                        {waLink}
                    </div>
                    <Button onClick={copyLink} className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-sm">
                        Copiar Link <Copy size={12} className="ml-1.5" />
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}

function StarIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  )
}
