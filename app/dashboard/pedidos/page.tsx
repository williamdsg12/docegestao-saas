"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { 
  ShoppingBag, 
  Truck, 
  RefreshCw, 
  Search, 
  Plus,
  ChevronDown,
  User,
  Settings2,
  Pause,
  LayoutGrid,
  Menu,
  UtensilsCrossed,
  Eye,
  MoreVertical,
  Printer,
  Smartphone,
  Globe,
  Bell,
  X,
  LayoutDashboard,
  Clock,
  LogOut
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useOrders } from "@/hooks/useOrders"
import { useQueryClient } from "@tanstack/react-query"
import { OrderRow } from "@/components/dashboard/pedidos/OrderRow"
import { OrderDetailsPanel } from "@/components/dashboard/pedidos/OrderDetailsPanel"
import { OrderPaymentPanel } from "@/components/dashboard/pedidos/OrderPaymentPanel"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"

type OrderType = 'balcao' | 'delivery' | 'mesas'
type FilterType = 'tudo' | 'pendente' | 'em_curso' | 'pdv_web' | 'aplicativos'

export default function MerchantDashboardV2() {
  const { profile } = useBusiness()
  const companyId = profile?.tenant_id || profile?.company_id
  const queryClient = useQueryClient()
  
  const { data: orders = [], isLoading: loading, updateStatus } = useOrders(companyId)
  
  const [activeTab, setActiveTab] = useState<OrderType>('delivery')
  const [activeFilter, setActiveFilter] = useState<FilterType>('tudo')
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [orderForPayment, setOrderForPayment] = useState<any | null>(null)

  // 🔊 SOM DE NOTIFICAÇÃO (AudioContext Ding)
  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.1) // G5
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.start()
      osc.stop(ctx.currentTime + 0.5)
    } catch (e) {
      console.error("Erro ao tocar som:", e)
    }
  }

  // Realtime subscription (OlaClick Style)
  useEffect(() => {
    if (!companyId) return

    const channel = supabase
      .channel('merchant_orders_realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'orders',
        filter: `tenant_id=eq.${companyId}`
      }, (payload: any) => {
        playNotificationSound()
        toast.custom((t) => (
          <div className="bg-white border-2 border-[#1a56db] rounded-2xl p-4 shadow-2xl flex items-center gap-4 animate-in slide-in-from-top duration-500 max-w-sm">
            <div className="size-12 bg-blue-100 rounded-full flex items-center justify-center text-[#1a56db] shrink-0">
              <Bell className="size-6 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black uppercase italic text-xs text-slate-900 truncate">Novo Pedido Recebido!</h3>
              <p className="text-[10px] font-bold text-slate-500">Um novo pedido acaba de entrar no sistema.</p>
            </div>
            <button onClick={() => toast.dismiss(t)} className="ml-auto text-slate-300 hover:text-slate-900 p-1">
              <X size={18} />
            </button>
          </div>
        ), { duration: 8000 })
        queryClient.invalidateQueries({ queryKey: ["orders", companyId] })
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders',
        filter: `tenant_id=eq.${companyId}`
      }, (payload: any) => {
        queryClient.invalidateQueries({ queryKey: ["orders", companyId] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [companyId, queryClient])

  const filteredOrders = useMemo(() => {
    return orders.filter((o: any) => {
      const matchesTab = o.order_type === activeTab || (activeTab === 'mesas' && o.order_type === 'mesa')
      let matchesFilter = true
      if (activeFilter === 'pendente') matchesFilter = ['novo', 'pendente'].includes(o.status)
      else if (activeFilter === 'em_curso') matchesFilter = ['preparo', 'pronto'].includes(o.status)
      else if (activeFilter === 'tudo') matchesFilter = !['finalizado', 'cancelado'].includes(o.status)
      const matchesSearch = (o.customer_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (o.id || "").toLowerCase().includes(searchQuery.toLowerCase())
      return matchesTab && matchesFilter && matchesSearch
    })
  }, [orders, activeTab, activeFilter, searchQuery])

  const totalValue = useMemo(() => filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0), [filteredOrders])

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      if (['finalizado', 'cancelado'].includes(newStatus)) {
        setTimeout(() => {
          queryClient.setQueryData(["orders", companyId], (old: any) => 
            old ? old.filter((o: any) => o.id !== orderId) : []
          )
        }, 600)
      }
      await updateStatus({ orderId, newStatus })
      toast.success(`Pedido atualizado para: ${newStatus.toUpperCase()}`)
    } catch (e) {
      toast.error("Erro ao atualizar pedido")
    }
  }

  const handleOpenPayment = (order: any) => {
    setOrderForPayment(order)
    setIsPaymentOpen(true)
  }


  return (
    <div className="flex flex-col h-screen w-full bg-[#f9fafb] overflow-hidden font-sans">
        {/* 🚀 CABEÇALHO SUPERIOR (OlaClick Style) */}
        <header className="h-[64px] bg-white border-b border-slate-100 flex items-center shrink-0 z-40 px-4 gap-2">
            {/* Serviços Tabs no Topo */}
            <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100 h-11">
               {[
                  { id: 'balcao', label: 'Balcão', icon: ShoppingBag, count: orders.filter(o => o.order_type === 'balcao' && !['finalizado', 'cancelado'].includes(o.status)).length },
                  { id: 'delivery', label: 'Delivery', icon: Truck, count: orders.filter(o => o.order_type === 'delivery' && !['finalizado', 'cancelado'].includes(o.status)).length },
                  { id: 'mesas', label: 'Mesas', icon: User, count: orders.filter(o => (o.order_type === 'mesa' || o.order_type === 'mesas') && !['finalizado', 'cancelado'].includes(o.status)).length },
               ].map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-4 h-9 rounded-lg transition-all font-black text-[10px] uppercase italic tracking-tight whitespace-nowrap",
                      activeTab === item.id 
                        ? "bg-[#1a56db] text-white shadow-md shadow-blue-100" 
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                     <item.icon size={14} className={cn(activeTab === item.id ? "text-white" : "text-slate-300")} />
                     {item.label}
                     <span className={cn(
                       "px-1.5 h-4 min-w-[16px] rounded-full flex items-center justify-center text-[8px] font-black leading-none",
                       activeTab === item.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
                     )}>
                        {item.count}
                     </span>
                  </button>
               ))}
            </div>

            <div className="w-[1px] h-6 bg-slate-100 mx-1" />

            <div className="flex items-center gap-2">
               <div className="flex flex-col items-center justify-center px-2 h-8 border border-slate-100 rounded leading-none text-[7px] font-black text-slate-300 uppercase italic bg-slate-50/50">
                  <span>NFC</span>
                  <span className="text-[5px]">OFFLINE</span>
               </div>
            </div>

            <div className="flex items-center h-full ml-auto gap-3">
              <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <Input 
                      placeholder="BUSCAR PEDIDO..." 
                      className="h-10 pl-9 w-[180px] bg-slate-50 border-slate-100 text-[10px] font-black uppercase italic rounded-xl focus:ring-2 ring-blue-100 transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>

              <button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ["orders", companyId] })}
                className="p-2 text-slate-300 hover:text-[#1a56db] hover:bg-blue-50 rounded-xl transition-colors"
              >
                 <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>

              <button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                 <Pause size={18} />
              </button>

              <div className="flex items-center">
                 <button className="h-10 px-5 bg-[#1a56db] text-white font-black text-[10px] uppercase italic rounded-l-[12px] flex items-center gap-2 hover:bg-[#1e40af] transition-all shadow-md shadow-blue-50 active:scale-95">
                    <Plus size={16} strokeWidth={4} /> Novo pedido
                 </button>
                 <button className="h-10 px-2 bg-[#1a56db] text-white border-l border-white/20 rounded-r-[12px] hover:bg-[#1e40af] transition-colors shadow-md shadow-blue-50">
                    <ChevronDown size={16} />
                 </button>
              </div>
            </div>
        </header>

          {/* 🔶 BARRA DE FILTROS */}
          <div className="bg-white border-b border-slate-100 px-6 h-[64px] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveFilter('tudo')}
                  className={cn(
                    "h-10 px-6 rounded-full font-black text-[10px] uppercase italic tracking-widest transition-all",
                    activeFilter === 'tudo' ? "bg-[#eff6ff] text-[#1a56db] border border-[#bfdbfe]" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                  )}
                >
                  ✓ Tudo
                </button>

                <button 
                  onClick={() => setActiveFilter('pendente')}
                  className={cn(
                    "h-10 px-6 rounded-full font-black text-[10px] uppercase italic tracking-widest flex items-center gap-3 transition-all",
                    activeFilter === 'pendente' ? "bg-orange-50 text-[#f97316] border border-orange-200" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                  )}
                >
                  Pendente
                  <span className="size-5 bg-[#f97316] text-white rounded-full flex items-center justify-center text-[9px] font-black not-italic">
                    {orders.filter(o => ['novo', 'pendente'].includes(o.status) && (o.order_type === activeTab || (activeTab === 'mesas' && (o.order_type === 'mesa' || o.order_type === 'mesas')))).length}
                  </span>
                </button>

                <button 
                  onClick={() => setActiveFilter('em_curso')}
                  className={cn(
                    "h-10 px-6 rounded-full font-black text-[10px] uppercase italic tracking-widest flex items-center gap-3 transition-all",
                    activeFilter === 'em_curso' ? "bg-green-50 text-[#16a34a] border border-green-200" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                  )}
                >
                  Em curso
                  <span className="size-5 bg-[#16a34a] text-white rounded-full flex items-center justify-center text-[9px] font-black not-italic">
                    {orders.filter(o => ['preparo', 'pronto'].includes(o.status) && (o.order_type === activeTab || (activeTab === 'mesas' && (o.order_type === 'mesa' || o.order_type === 'mesas')))).length}
                  </span>
                </button>

                <div className="w-[1px] h-6 bg-slate-100 mx-2" />

                <button className="h-10 px-6 rounded-full bg-slate-50 text-slate-400 font-black text-[10px] uppercase italic tracking-widest hover:bg-slate-100 transition-colors">
                  PDV / WEB
                </button>

                {activeTab === 'delivery' && (
                  <button className="h-10 px-6 rounded-full bg-slate-50 text-slate-400 font-black text-[10px] uppercase italic tracking-widest flex items-center gap-2 hover:bg-slate-100 transition-colors">
                    <Truck size={16} /> Mapa
                  </button>
                )}
              </div>

              <div className="flex items-center gap-6">
                 <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-300 uppercase italic tracking-widest">Total filtrado</span>
                    <span className="text-base font-black text-slate-800 italic tracking-tighter">R$ {totalValue.toFixed(2)}</span>
                 </div>
                 <button className="size-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#1a56db] transition-colors"><Eye size={20} /></button>
              </div>
          </div>

          {/* 📊 TABELA HEADER */}
          <div className="bg-slate-50/50 border-b border-slate-100 px-6 h-[48px] flex items-center shrink-0">
              <div className="w-[250px] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Data / Cronômetro</div>
              <div className="w-[220px] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Estado</div>
              <div className="w-[150px] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Total</div>
              <div className="flex-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Cliente</div>
              <div className="w-[320px] text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Ações</div>
          </div>

          <ScrollArea className="flex-1">
            <div className="flex flex-col min-h-full">
               <AnimatePresence mode="popLayout" initial={false}>
                  {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 gap-4">
                      <RefreshCw size={32} className="text-[#1a56db] animate-spin" />
                      <span className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">Carregando pedidos...</span>
                    </div>
                  ) : filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <OrderRow 
                        key={order.id} 
                        order={order}
                        onAccept={() => handleUpdateStatus(order.id, 'preparo')}
                        onUpdateStatus={(newStatus) => handleUpdateStatus(order.id, newStatus)}
                        onOpenPayment={() => handleOpenPayment(order)}
                        onOpenDetails={() => {
                          setSelectedOrder(order)
                          setIsDetailsOpen(true)
                        }}
                      />
                    ))
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex-1 flex flex-col items-center justify-center p-32 text-center"
                    >
                      <div className="size-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <UtensilsCrossed size={40} className="text-slate-200" />
                      </div>
                      <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter mb-2">Sem pedidos por aqui</h3>
                      <p className="text-slate-400 text-xs font-bold italic mb-8 max-w-[280px]">Crie pedidos manuais ou aguarde novos pedidos do seu cardápio.</p>
                      <Button className="h-12 px-8 bg-[#1a56db] hover:bg-[#1e40af] text-white font-black uppercase italic text-xs tracking-widest rounded-2xl shadow-xl shadow-blue-100 active:scale-95 transition-all gap-2">
                        <Plus size={18} strokeWidth={4} /> Novo pedido
                      </Button>
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>
          </ScrollArea>

        <OrderDetailsPanel 
          order={selectedOrder}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          onUpdateStatus={async (orderId, newStatus) => handleUpdateStatus(orderId, newStatus)}
        />

        <OrderPaymentPanel 
          order={orderForPayment}
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          onUpdateStatus={async ({ orderId, newStatus }) => handleUpdateStatus(orderId, newStatus)}
        />
    </div>
  )
}
