"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  Zap,
  AlertCircle,
  Timer,
  ChevronRight,
  Printer,
  ShoppingBag,
  Bell
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useBusiness } from "@/hooks/useBusiness"
import { useDeliveryRealtime } from "@/hooks/useDeliveryRealtime"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { differenceInMinutes, format } from "date-fns"

export default function KDSPage() {
  const { profile } = useBusiness()
  const { newOrders, unlockAudio } = useDeliveryRealtime(profile?.company_id || "")
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    if (!profile?.company_id) return
    try {
      setLoading(true)
      // Fetch orders in confirmed or production status
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          clientes(nome),
          itens_pedido(*)
        `)
        .eq('company_id', profile.company_id)
        .in('status', ['novo', 'confirmado', 'preparando'])
        .order('created_at', { ascending: true })
      
      if (error) throw error
      setOrders(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    if (newOrders.length > 0) {
      fetchOrders()
    }
  }, [newOrders, fetchOrders])

  const handleUpdateStatus = async (orderId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'confirmado' ? 'preparando' : 'pronto'
    
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ 
          status: nextStatus,
          // If status is 'pronto', maybe set a finished_at if columns exist
        })
        .eq('id', orderId)
      
      if (error) throw error
      
      if (nextStatus === 'pronto') {
        setOrders(prev => prev.filter(o => o.id !== orderId))
        toast.success("Pedido pronto! Enviado para coleta. 🚀")
      } else {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o))
        toast.info("Iniciando preparação... 👨‍🍳")
      }
    } catch (e) {
      toast.error("Erro ao atualizar status")
    }
  }

  const getUrgencyColor = (minutes: number) => {
    if (minutes > 30) return "text-rose-500 bg-rose-50 border-rose-100"
    if (minutes > 15) return "text-amber-500 bg-amber-50 border-amber-100"
    return "text-emerald-500 bg-emerald-50 border-emerald-100"
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10 font-sans overflow-x-hidden">
      {/* KDS Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
        <div className="flex items-center gap-6">
          <div className="size-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-[28px] flex items-center justify-center shadow-2xl shadow-orange-500/20 animate-pulse">
            <ChefHat className="size-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-none">
              Kitchen <span className="text-amber-500">Display</span> System
            </h1>
            <p className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-500 italic mt-2">Intelligence Unit V4.0</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="px-10 py-5 bg-white/5 rounded-[32px] border border-white/10 backdrop-blur-xl flex items-center gap-8">
              <div className="text-center">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Pendente</p>
                 <p className="text-3xl font-black italic text-white leading-none">
                   {orders.filter(o => o.status === 'confirmado').length}
                 </p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Preparo</p>
                 <p className="text-3xl font-black italic text-amber-500 leading-none">
                   {orders.filter(o => o.status === 'preparando').length}
                 </p>
              </div>
           </div>
           
           <Button 
             onClick={unlockAudio}
             variant="outline" 
             className="size-16 rounded-[28px] border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
           >
             <Bell className="size-6" />
           </Button>
        </div>
      </div>

      {/* Grid of Kitchen Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <AnimatePresence mode="popLayout">
          {orders.length > 0 ? orders.map((order, idx) => {
            const minutes = differenceInMinutes(new Date(), new Date(order.created_at))
            const urgency = getUrgencyColor(minutes)
            
            return (
              <motion.div
                layout
                key={order.id}
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 100 }}
                transition={{ type: "spring", stiffness: 100, delay: idx * 0.05 }}
              >
                <Card className="rounded-[48px] bg-white border-none shadow-2xl overflow-hidden min-h-[580px] flex flex-col group transition-all duration-500 hover:-translate-y-2">
                  {/* Card Header */}
                  <div className={cn(
                    "p-8 pb-4 flex justify-between items-start transition-colors",
                    order.status === 'preparando' ? "bg-amber-50/50" : "bg-white"
                  )}>
                    <div>
                      <Badge className={cn(
                        "mb-4 px-4 py-2 border-none rounded-2xl font-black text-[10px] uppercase tracking-widest",
                        order.status === 'preparando' ? "bg-amber-500 text-white animate-pulse" : "bg-slate-900 text-white"
                      )}>
                        {order.status === 'preparando' ? "🔨 Em Preparo" : "📥 Novo Pedido"}
                      </Badge>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none max-w-[200px] truncate">
                        {order.clientes?.nome || "Balcão"}
                      </h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                         Pedido <span className="text-primary tracking-tighter">#{order.num_serial?.toString().padStart(3, '0') || order.id.slice(0, 5)}</span> <span className="text-slate-200">|</span> <Clock className="size-3" /> {format(new Date(order.created_at), 'HH:mm')}
                      </p>
                    </div>
                    
                    <div className={cn(
                      "px-4 py-6 rounded-[24px] border border-transparent font-black italic transition-all flex flex-col items-center gap-1",
                      urgency
                    )}>
                      <span className="text-2xl leading-none">{minutes}</span>
                      <span className="text-[8px] uppercase tracking-widest leading-none">MIN</span>
                    </div>
                  </div>

                  {/* Items List */}
                  <CardContent className="p-8 flex-1">
                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">Lista de Produção</p>
                       <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 scrollbar-hide">
                          {order.itens_pedido?.length > 0 ? order.itens_pedido.map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-4 group/item cursor-pointer">
                               <div className="size-10 bg-slate-50 group-hover/item:bg-amber-500 group-hover/item:text-white rounded-xl flex items-center justify-center font-black text-xs transition-colors border border-slate-100">
                                 {item.quantidade || 1}x
                               </div>
                               <div className="flex-1">
                                 <p className="text-sm font-black text-slate-800 uppercase italic tracking-tighter line-clamp-1">{item.nome || order.product_name}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.observacao || 'Sem obs'}</p>
                               </div>
                            </div>
                          )) : (
                            <div className="flex items-center gap-4">
                               <div className="size-10 bg-slate-50 rounded-xl flex items-center justify-center font-black text-xs">1x</div>
                               <p className="text-sm font-black text-slate-800 uppercase italic tracking-tighter">{order.product_name}</p>
                            </div>
                          )}
                       </div>
                    </div>
                  </CardContent>

                  {/* Card Actions */}
                  <div className="p-8 pt-0 mt-auto">
                    <Button 
                      onClick={() => handleUpdateStatus(order.id, order.status)}
                      className={cn(
                        "w-full h-20 rounded-[32px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 group-hover:scale-[1.02]",
                        order.status === 'preparando' 
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200" 
                          : "bg-slate-950 hover:bg-slate-900 text-white shadow-slate-200"
                      )}
                    >
                      {order.status === 'preparando' ? (
                        <div className="flex items-center gap-3">
                           FINALIZAR <CheckCircle2 className="size-6 text-emerald-200" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                           INICIAR PREPARO <Zap className="size-6 text-amber-400" />
                        </div>
                      )}
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-3 mt-4">
                       <Button variant="outline" className="h-14 rounded-2xl border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100">
                          <Printer className="size-5" />
                       </Button>
                       <Button variant="outline" className="h-14 rounded-2xl border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100">
                          <ChevronRight className="size-5" />
                       </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          }) : !loading && (
            <div className="col-span-full py-40 flex flex-col items-center">
               <div className="size-48 bg-white/5 rounded-[64px] flex items-center justify-center text-slate-800 mb-8 border border-white/5">
                  <ChefHat className="size-20 opacity-20" />
               </div>
               <h3 className="text-3xl font-black text-white/50 tracking-tighter uppercase italic">Cozinha em Descanso</h3>
               <p className="text-slate-500 font-medium italic mt-4 uppercase tracking-[0.2em]">Aguardando novas ordens de produção...</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
