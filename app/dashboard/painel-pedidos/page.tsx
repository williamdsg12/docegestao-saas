"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { Button } from "@/components/ui/button"
import {
  RotateCw,
  Search,
  ShoppingBag,
  Package,
  Store,
  Bike,
  Settings2,
  QrCode,
  Pause,
  Plus,
  ChevronDown,
  Filter,
  Check,
  MapPin,
  Eye,
  Clock,
  DollarSign,
  Trophy,
  Zap
} from "lucide-react"
import { playDelayedBeep } from "@/lib/notifications"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { PedidoKanbanCard } from "@/components/pedidos/PedidoKanbanCard"
import { PedidoDrawer } from "@/components/pedidos/PedidoDrawer"
import { usePedidoStore } from "@/store/pedidoStore"
import { usePedidosRealtime } from "@/hooks/usePedidosRealtime"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Badge as UIBadge } from "@/components/ui/badge"
import { NewOrderPopup } from "@/components/pedidos/NewOrderPopup"
import { formatCurrency } from "@/lib/formatters"
import { PedidoSettingsModal } from "@/components/pedidos/PedidoSettingsModal"
import { isStoreOpen } from "@/lib/storeStatus"
import { Label } from "@/components/ui/label"
import { StoreStatusToggle } from "@/components/pedidos/StoreStatusToggle"

export default function PedidosPage() {
  console.log("Kanban Page Loaded (iFood Standard)");
  const { business, profile, refreshBusiness } = useBusiness()
  const tenantId = profile?.tenant_id || profile?.company_id
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Zustand Store
  const pedidos = usePedidoStore(s => s.pedidos)
  const setPedidos = usePedidoStore(s => s.setPedidos)
  const updatePedido = usePedidoStore(s => s.updatePedido)
  const popupQueue = usePedidoStore(s => s.popupQueue)
  const removeFromQueue = usePedidoStore(s => s.removeFromQueue)
  const config = usePedidoStore(s => s.config)
  const [storeSettings, setStoreSettings] = useState<any>(null)
  const [now, setNow] = useState(Date.now()) // Real-time ticker
  const prevAtrasadosCount = useRef(0) // For sound alert trigger
  
  const storeStatus = isStoreOpen(storeSettings)
  
  // Stats calculations for Operational Header (MUST BE INITIALIZED BEFORE USEEffects)
  const stats = {
    faturamento: pedidos.reduce((acc, o) => {
        const isToday = new Date(o.created_at).toDateString() === new Date().toDateString()
        const isFinished = ['finalizado', 'delivered', 'done'].includes(o.status)
        return isToday && isFinished ? acc + Number(o.total || 0) : acc
    }, 0),
    preparando: pedidos.filter(o => ['preparando', 'em_preparo', 'preparing'].includes(o.status)).length,
    atrasados: pedidos.filter(o => {
        if (['finalizado', 'delivered', 'done', 'cancelado'].includes(o.status)) return false
        // Use reactive 'now' for precise counting
        const minutes = Math.floor((now - new Date(o.created_at).getTime()) / 60000)
        return minutes >= (config.alertMin || 15) // Use alertMin or 15 as base
    }).length,
    tempoMedio: (() => {
        const finished = pedidos.filter(o => ['finalizado', 'delivered', 'done'].includes(o.status))
        if (finished.length === 0) return 0
        const totalMs = finished.reduce((acc, o) => {
            const start = new Date(o.created_at).getTime()
            const end = new Date(o.updated_at || Date.now()).getTime()
            return acc + (end - start)
        }, 0)
        return Math.floor(totalMs / finished.length / 60000)
    })(),
    topCliente: (() => {
        const names = pedidos.map(o => o.customers?.name || "Cliente Final")
        if (names.length === 0) return "---"
        const counts = names.reduce((acc: any, name) => {
            acc[name] = (acc[name] || 0) + 1
            return acc
        }, {})
        return Object.entries(counts).sort((a: any, b: any) => b[1] - a[1])[0][0]
    })(),
    emRisco: pedidos.filter(o => {
        if (!['preparando', 'em_preparo', 'preparing'].includes(o.status)) return false
        const minutes = Math.floor((now - new Date(o.created_at).getTime()) / 60000)
        const limit = config.criticalMin || 15
        return minutes >= (limit * 0.7) && minutes < limit 
    }).length
  }

  // Custom Hooks
  usePedidosRealtime()

  useEffect(() => {
    fetchData()
    
    // Request notification permissions
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission()
      }
    }

    // Ticker for real-time atrasados (updates every 1s like iFood)
    const ticker = setInterval(() => setNow(Date.now()), 1000)

    // Real-time synchronization for store settings
    if (!tenantId) return

    const settingsChannel = supabase
      .channel(`kanban-settings-sync-${tenantId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'store_settings',
        filter: `store_id=eq.${tenantId}`
      }, (payload) => {
        setStoreSettings(payload.new)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(settingsChannel)
      clearInterval(ticker)
    }
  }, [profile, tenantId])

  // AUDIO ALERT TRIGGER: Beep when a order BECOMES delayed
  useEffect(() => {
    if (stats.atrasados > prevAtrasadosCount.current) {
        playDelayedBeep()
    }
    prevAtrasadosCount.current = stats.atrasados
  }, [stats.atrasados])

  async function fetchData() {
    try {
      if (!tenantId) return
      
      const startOfDay = new Date()
      startOfDay.setHours(0,0,0,0)

      const [ordersRes, settingsRes] = await Promise.all([
        supabase
            .from('orders')
            .select('*, customers(*)')
            .eq('tenant_id', tenantId)
            .gte('created_at', startOfDay.toISOString()) // DAILY RESET: Fetch only today's orders
            .order('created_at', { ascending: false }),
        supabase.from('store_settings').select('*').eq('store_id', tenantId).maybeSingle()
      ])

      if (ordersRes.data) setPedidos(ordersRes.data)
      if (settingsRes.data) setStoreSettings(settingsRes.data)
    } catch (e) {
      console.error(e)
      toast.error("Erro ao carregar pedidos")
    }
  }

  async function handleUpdateStatus(id: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
      updatePedido(id, { status: newStatus })
      toast.success("Status atualizado!")
    } catch (e) {
      toast.error("Erro ao atualizar status")
    }
  }

  async function handleUpdatePaymentStatus(id: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newStatus })
        .eq('id', id)

      if (error) throw error
      updatePedido(id, { payment_status: newStatus })
      toast.success("Pagamentos atualizados!")
    } catch (e) {
      toast.error("Erro ao atualizar pagamento")
    }
  }

  // Column Mapping
  const getColPedidos = (col: string) => {
    switch(col) {
      case 'novos': return pedidos.filter(o => ['novo', 'pending', 'pending_payment'].includes(o.status))
      case 'preparo': return pedidos.filter(o => ['preparando', 'em_preparo', 'preparing'].includes(o.status))
      case 'entrega': return pedidos.filter(o => ['saiu-entrega', 'saiu_entrega', 'delivery'].includes(o.status))
      case 'finalizados': 
        // Hide concluded/canceled if store is closed/manual override to closed
        if (!storeStatus.isOpen) return []
        return pedidos.filter(o => ['finalizado', 'delivered', 'done'].includes(o.status)).slice(0, 15)
      default: return []
    }
  }


  // Visual Urgency for Atrasados Stats
  const getDelayedBadgeColor = () => {
    if (stats.atrasados === 0) return "slate"
    if (stats.atrasados <= 5) return "amber"
    return "rose"
  }

  const currentPopupOrder = popupQueue[0]

  // Mobile Tabs
  const [activeTab, setActiveTab] = useState('novos')
  const tabs = [
    { id: 'novos', label: 'Novos', color: 'rose' },
    { id: 'preparo', label: 'Preparo', color: 'amber' },
    { id: 'entrega', label: 'Entrega', color: 'blue' },
    { id: 'finalizados', label: 'Concluídos', color: 'slate' },
  ]

  return (
    <div className="flex flex-col h-screen bg-[#F4F7F6] overflow-hidden font-sans">
      
      {/* 1. OPERATIONAL HEADER */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-6 h-16 flex items-center justify-between shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden md:flex flex-col">
            <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none">Central de <span className="text-primary">Operações</span></h1>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Gestão em Tempo Real</p>
          </div>

          <div className="md:hidden flex flex-col">
             <h1 className="text-lg font-black italic tracking-tighter text-slate-800">OPERACIONAL</h1>
          </div>

          <Separator orientation="vertical" className="h-10 bg-slate-100 mx-2" />

          {/* STORE STATUS TOGGLE - Single Source of Truth */}
          <StoreStatusToggle 
            status={storeStatus}
            isLoading={isUpdatingStatus}
            onToggle={async (newManualState) => {
                try {
                    setIsUpdatingStatus(true)
                    if (!tenantId) throw new Error("Sessão expirada")

                    const updates = {
                        is_manual_override: !newManualState ? true : false, // If closing, override. If opening, set to automatic (or manual open)
                        manual_status: newManualState ? 'open' : 'closed',
                        updated_at: new Date().toISOString()
                    }

                    const { error } = await supabase
                        .from('store_settings')
                        .upsert({
                            store_id: tenantId,
                            ...updates,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'store_id' })
                    
                    if (error) throw error
                    await fetchData()
                    
                    if (newManualState) {
                        toast.success("Loja ativa! 🚀")
                    } else {
                        toast.info("Loja fechada manual.")
                    }
                } catch (e: any) {
                    toast.error("Erro ao alternar status")
                } finally {
                    setIsUpdatingStatus(false)
                }
            }}
          />

          <Separator orientation="vertical" className="hidden md:block h-10 bg-slate-100" />

          {/* Stats Grid */}
          <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar py-1">
             <StatCard 
                label="Hoje" 
                value={formatCurrency(stats.faturamento)} 
                icon={<DollarSign className="size-3 md:size-4 text-emerald-500" />}
                color="emerald"
             />
             <StatCard 
                label="Preparo" 
                value={stats.preparando} 
                icon={<Package className="size-3 md:size-4 text-amber-500" />}
                color="amber"
             />
             <StatCard 
                label="Atrasados" 
                value={stats.atrasados} 
                icon={<Clock className={cn("size-3 md:size-4", stats.atrasados > 0 ? "text-white" : "text-slate-500")} />}
                color={getDelayedBadgeColor()}
                isAlert={stats.atrasados > 0}
             />
             <Separator orientation="vertical" className="hidden lg:block h-10 bg-slate-100" />
             <StatCard 
                label="TMP Médio" 
                value={`${stats.tempoMedio} min`} 
                icon={<Zap className="size-3 md:size-4 text-blue-500" />}
                color="blue"
             />
             <StatCard 
                label="Top Cliente" 
                value={stats.topCliente} 
                icon={<Trophy className="size-3 md:size-4 text-amber-500" />}
                color="amber"
             />
             {stats.emRisco > 0 && (
                 <div className="hidden lg:flex bg-orange-500 text-white rounded-full px-3 py-1 animate-pulse items-center gap-1.5 shadow-lg shadow-orange-200">
                     <Zap className="size-3" />
                     <span className="text-[10px] font-black uppercase">{stats.emRisco} EM RISCO</span>
                 </div>
             )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="size-10 rounded-xl border-slate-200 bg-white" onClick={fetchData}>
            <RotateCw className="size-4 text-slate-500" />
          </Button>
          <Button 
            onClick={() => setShowSettings(true)}
            className="hidden md:flex h-10 rounded-xl bg-slate-900 text-white font-bold text-[11px] px-6 shadow-sm hover:bg-slate-800 transition-all"
          >
             Configurações
          </Button>
        </div>
      </div>

      {/* MOBILE TABS SWITCHER */}
      <div className="md:hidden bg-white border-b border-slate-100 px-4 py-2 flex items-center justify-between gap-1 shrink-0 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                    "flex-1 flex flex-col items-center py-2 px-1 rounded-xl transition-all border",
                    activeTab === tab.id 
                        ? `border-${tab.color === 'rose' ? 'rose' : tab.color}-500 bg-${tab.color === 'rose' ? 'rose' : tab.color}-50` 
                        : "border-transparent text-slate-400"
                )}
              >
                  <span className={cn(
                      "text-[9px] font-bold uppercase tracking-wider mb-0.5",
                      activeTab === tab.id ? `text-${tab.color === 'rose' ? 'rose' : tab.color}-600` : "text-slate-400"
                  )}>{tab.label}</span>
                  <span className={cn(
                      "text-sm font-bold",
                      activeTab === tab.id ? "text-slate-900" : "text-slate-300"
                  )}>{getColPedidos(tab.id).length}</span>
              </button>
          ))}
      </div>

      {/* KANBAN BOARD */}
      <div className="flex-1 overflow-x-auto no-scrollbar bg-slate-50 p-4 md:p-6">
        {/* Desktop Grid */}
        <div className="hidden md:grid min-w-[1240px] h-full grid-cols-4 gap-6">
          <KanbanColumn title="Novos" icon={<Plus size={14} strokeWidth={3} />} color="rose" pedidos={getColPedidos('novos')} onUpdateStatus={handleUpdateStatus} />
          <KanbanColumn title="Preparo" icon={<Package size={14} strokeWidth={3} />} color="amber" pedidos={getColPedidos('preparo')} onUpdateStatus={handleUpdateStatus} />
          <KanbanColumn title="Entrega" icon={<Bike size={14} strokeWidth={3} />} color="blue" pedidos={getColPedidos('entrega')} onUpdateStatus={handleUpdateStatus} />
          <KanbanColumn title="Concluídos" icon={<Check size={14} strokeWidth={4} />} color="slate" pedidos={getColPedidos('finalizados')} onUpdateStatus={handleUpdateStatus} isFinished />
        </div>

        {/* Mobile View */}
        <div className="md:hidden h-full">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="h-full"
                >
                    {activeTab === 'novos' && <KanbanColumn title="Novos" icon={<Plus size={14} strokeWidth={3} />} color="rose" pedidos={getColPedidos('novos')} onUpdateStatus={handleUpdateStatus} />}
                    {activeTab === 'preparo' && <KanbanColumn title="Preparo" icon={<Package size={14} strokeWidth={3} />} color="amber" pedidos={getColPedidos('preparo')} onUpdateStatus={handleUpdateStatus} />}
                    {activeTab === 'entrega' && <KanbanColumn title="Entrega" icon={<Bike size={14} strokeWidth={3} />} color="blue" pedidos={getColPedidos('entrega')} onUpdateStatus={handleUpdateStatus} />}
                    {activeTab === 'finalizados' && <KanbanColumn title="Concluídos" icon={<Check size={14} strokeWidth={4} />} color="slate" pedidos={getColPedidos('finalizados')} onUpdateStatus={handleUpdateStatus} isFinished />}
                </motion.div>
            </AnimatePresence>
        </div>
      </div>

      <PedidoDrawer
        onUpdateStatus={handleUpdateStatus}
        onUpdatePaymentStatus={handleUpdatePaymentStatus}
      />

      <NewOrderPopup 
        order={currentPopupOrder}
        onAccept={async (id) => {
            await handleUpdateStatus(id, 'preparando')
            removeFromQueue(id)
        }}
        onDismiss={() => {
            if (currentPopupOrder) removeFromQueue(currentPopupOrder.id)
        }}
      />

      <PedidoSettingsModal 
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </div>
  )
}

function StatCard({ label, value, icon, color, isAlert }: any) {
    return (
        <div className={cn(
            "bg-white border rounded-xl h-14 px-3 flex items-center gap-3 min-w-[130px] shadow-sm transition-all",
            isAlert ? "border-rose-200 bg-rose-50/50" : "border-slate-100"
        )}>
            <div className={cn(
                "size-8 rounded-lg flex items-center justify-center",
                color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                color === 'amber' ? "bg-amber-50 text-amber-600" : 
                color === 'rose' ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400"
            )}>
                {icon}
            </div>
            <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-0.5">{label}</span>
                <span className="text-sm font-bold text-slate-900 tracking-tight leading-none">{value}</span>
            </div>
        </div>
    )
}

function KanbanColumn({ title, icon, color, pedidos, onUpdateStatus, isFinished = false }: any) {
  const colorMap: any = {
    rose: "bg-rose-500 shadow-rose-200 text-white",
    amber: "bg-amber-500 shadow-amber-200 text-white",
    blue: "bg-blue-500 shadow-blue-200 text-white",
    slate: "bg-slate-400 shadow-slate-100 text-white"
  }

  return (
    <div className="flex flex-col h-full bg-slate-100/40 rounded-xl p-3 border border-slate-200/50">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className={cn("size-7 rounded-lg flex items-center justify-center shadow-sm", colorMap[color])}>
            {icon}
          </div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{title}</h4>
        </div>
        <UIBadge className="bg-white text-slate-500 border-none shadow-sm font-bold px-2 h-5 rounded flex items-center text-[10px]">
          {pedidos.length}
        </UIBadge>
      </div>
      
      <div className={cn("flex-1 overflow-y-auto no-scrollbar space-y-3", isFinished && "opacity-60 hover:opacity-100 transition-opacity")}>
        <AnimatePresence mode="popLayout">
          {pedidos.map((pedido: any) => (
            <PedidoKanbanCard 
              key={pedido.id} 
              pedido={pedido} 
              onAccept={async (id) => onUpdateStatus(id, 'preparando')}
              onReject={async (id) => onUpdateStatus(id, 'cancelado')}
              onNextStep={async (id, current) => {
                const next: any = {
                  'novo': 'preparando',
                  'pending': 'preparando',
                  'preparando': 'saiu-entrega',
                  'em_preparo': 'saiu-entrega',
                  'preparing': 'saiu-entrega',
                  'saiu-entrega': 'finalizado',
                  'saiu_entrega': 'finalizado',
                  'delivery': 'finalizado'
                }
                const target = next[current] || 'finalizado'
                onUpdateStatus(id, target)
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
