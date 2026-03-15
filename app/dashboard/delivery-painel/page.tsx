"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  Flame,
  Search,
  Filter,
  Bell,
  Utensils,
  ChevronRight
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { useDeliveryRealtime } from "@/hooks/useDeliveryRealtime"
import { useBusiness } from "@/hooks/useBusiness"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

export default function DeliveryPainelPage() {
  const { profile } = useBusiness()
  const { newOrders, unlockAudio } = useDeliveryRealtime(profile?.company_id || "")
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('recebido')

  useEffect(() => {
    if (profile?.company_id) {
      fetchOrders()
    }
  }, [profile])

  async function fetchOrders() {
    if (!profile?.company_id) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('pedidos')
        .select('*, clientes(nome)')
        .eq('empresa_id', profile.company_id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (newOrders.length > 0) {
      fetchOrders() // Refresh to get client names too
    }
  }, [newOrders])

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: newStatus })
        .eq('id', orderId)
      
      if (error) throw error
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      
      const statusLabels: Record<string, string> = {
        confirmado: 'Confirmado',
        em_preparo: 'Em Preparo',
        pronto: 'Pronto',
        saiu_entrega: 'Saiu para Entrega',
        entregue: 'Entregue',
        cancelado: 'Cancelado'
      }
      
      toast.success(`Pedido ${statusLabels[newStatus] || newStatus} com sucesso!`)
    } catch (e) {
      toast.error("Erro ao atualizar status")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recebido': return 'bg-blue-500'
      case 'confirmado': return 'bg-cyan-500'
      case 'em_preparo': return 'bg-amber-500'
      case 'pronto': return 'bg-emerald-500'
      case 'saiu_entrega': return 'bg-indigo-500'
      case 'entregue': return 'bg-green-500'
      case 'cancelado': return 'bg-rose-500'
      default: return 'bg-slate-500'
    }
  }

  const statusStats = [
    { label: 'Novos', count: orders.filter(o => o.status === 'recebido').length, id: 'recebido', color: 'bg-blue-500' },
    { label: 'Preparando', count: orders.filter(o => ['confirmado', 'em_preparo'].includes(o.status)).length, id: 'em_preparo', color: 'bg-amber-500' },
    { label: 'Prontos', count: orders.filter(o => o.status === 'pronto').length, id: 'pronto', color: 'bg-emerald-500' },
    { label: 'Enviados', count: orders.filter(o => o.status === 'saiu_entrega').length, id: 'saiu_entrega', color: 'bg-indigo-500' },
  ]

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'em_preparo') return ['confirmado', 'em_preparo'].includes(o.status)
    return o.status === activeTab
  })

  return (
    <div className="space-y-8 pb-20 p-6 md:p-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-2">
            Gestão de <span className="text-pink-500">Pedidos</span>
          </h1>
          <p className="text-slate-500 font-medium italic uppercase text-[10px] tracking-widest">Painel Operacional em Tempo Real</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-2xl border-slate-200 h-12 gap-2 font-black uppercase tracking-widest text-[10px]">
            <Filter className="size-4" /> Filtros
          </Button>
          <Button 
            onClick={unlockAudio}
            className="rounded-2xl bg-slate-900 hover:bg-slate-800 text-white h-12 gap-2 font-black uppercase tracking-widest text-[10px] shadow-xl"
          >
            <Bell className="size-4" /> Ativar Som
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusStats.map((stat) => (
          <Card 
            key={stat.id} 
            onClick={() => setActiveTab(stat.id)}
            className={cn(
              "border-none shadow-2xl shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white transition-all cursor-pointer hover:translate-y-[-4px]",
              activeTab === stat.id ? "ring-2 ring-pink-500 border-pink-500/20" : ""
            )}
          >
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className={cn("size-14 rounded-2xl flex items-center justify-center text-white shadow-lg", stat.color)}>
                  <ShoppingBag className="size-7" />
                </div>
                {stat.count > 0 && (
                  <div className="animate-bounce size-6 bg-pink-500 rounded-full flex items-center justify-center text-[10px] font-black text-white">
                    {stat.count}
                  </div>
                )}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{stat.count}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredOrders.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {filteredOrders.map((order) => (
                <motion.div
                  layout
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="rounded-[48px] border-none shadow-2xl shadow-slate-100 bg-white overflow-hidden p-10 relative">
                    <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 opacity-20", getStatusColor(order.status))} />
                    
                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div className="flex items-center gap-6">
                        <div className={cn("size-16 rounded-[24px] flex items-center justify-center text-white shadow-xl", getStatusColor(order.status))}>
                          <ShoppingBag className="size-8" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedido #{order.numero_pedido || order.id.slice(0, 4)}</p>
                          <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{order.customer_name || order.clientes?.nome}</h4>
                        </div>
                      </div>
                      <Badge className="bg-slate-50 text-slate-500 border border-slate-100 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">
                        {order.tipo_pedido?.toUpperCase() || 'DELIVERY'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-10 relative z-10">
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                        <Clock className="size-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">
                          {format(new Date(order.created_at), "HH:mm")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                        <Utensils className="size-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">
                          {order.itens_pedido?.length || 0} ITENS
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-8 border-t border-slate-50 relative z-10">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total do Pedido</p>
                        <div className="text-3xl font-black text-slate-900 tracking-tighter italic">R$ {order.valor_total?.toFixed(2) || '0.00'}</div>
                      </div>
                      
                      <div className="flex gap-3">
                         {order.status === 'recebido' && (
                           <Button 
                             onClick={() => updateStatus(order.id, 'confirmado')} 
                             className="h-14 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-black uppercase text-[10px] tracking-[0.15em] px-8 shadow-xl shadow-cyan-100 transition-all hover:scale-105 active:scale-95 flex gap-2"
                           >
                              Aceitar <ChevronRight className="size-4" />
                           </Button>
                         )}
                         {order.status === 'confirmado' && (
                           <Button 
                             onClick={() => updateStatus(order.id, 'em_preparo')} 
                             className="h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase text-[10px] tracking-[0.15em] px-8 shadow-xl shadow-amber-100 transition-all hover:scale-105 active:scale-95 flex gap-2"
                           >
                              <Flame className="size-4" /> Iniciar Preparo
                           </Button>
                         )}
                         {order.status === 'em_preparo' && (
                           <Button 
                             onClick={() => updateStatus(order.id, 'pronto')} 
                             className="h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-[0.15em] px-8 shadow-xl shadow-emerald-100 transition-all hover:scale-105 active:scale-95 flex gap-2"
                           >
                              <CheckCircle2 className="size-4" /> Finalizar
                           </Button>
                         )}
                         {order.status === 'pronto' && (
                           <Button 
                             onClick={() => updateStatus(order.id, 'saiu_entrega')} 
                             className="h-14 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase text-[10px] tracking-[0.15em] px-8 shadow-xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95 flex gap-2"
                           >
                              <Truck className="size-4" /> Enviar
                           </Button>
                         )}
                         
                         <Button 
                           variant="ghost" 
                           onClick={() => updateStatus(order.id, 'cancelado')}
                           className="size-14 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all"
                         >
                           <XCircle className="size-5" />
                         </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-200/20 min-h-[400px] flex flex-col items-center justify-center text-center p-20"
            >
              <div className="size-32 bg-slate-50 rounded-[48px] flex items-center justify-center text-slate-200 mb-8 overflow-hidden relative">
                <div className="absolute inset-0 bg-slate-100 animate-pulse " />
                <ShoppingBag className="size-16 relative z-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Sem pedidos em {activeTab}</h3>
              <p className="text-slate-500 mt-4 max-w-sm font-medium italic">Aguardando a próxima venda...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
