"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  Bell,
  Utensils,
  Maximize2,
  Volume2,
  VolumeX
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useBusiness } from "@/hooks/useBusiness"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { differenceInMinutes, format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

// --- Sub-component: Kitchen Order Card ---

function KitchenCard({ 
  order, 
  onStatusUpdate 
}: { 
  order: any, 
  onStatusUpdate: (id: string, current: string) => void 
}) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [timeAgo, setTimeAgo] = useState('')
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('low')
  const [minutesOpen, setMinutesOpen] = useState(0)

  useEffect(() => {
    const update = () => {
      const start = new Date(order.created_at)
      const now = new Date()
      const diff = differenceInMinutes(now, start)
      setMinutesOpen(diff)
      setTimeAgo(formatDistanceToNow(start, { locale: ptBR }))
      
      if (diff > 30) setUrgency('high')
      else if (diff > 15) setUrgency('medium')
      else setUrgency('low')
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [order.created_at])

  const toggleItem = (itemId: string) => {
    setCheckedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  const isPreparing = order.status === 'preparing'
  const allChecked = order.order_items?.length > 0 && 
                     order.order_items.every((item: any) => checkedItems[item.id])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, x: 50 }}
      className="h-full"
    >
      <Card className={cn(
        "h-full flex flex-col border-none shadow-2xl rounded-[32px] overflow-hidden transition-all duration-500 ring-2 transition-all",
        isPreparing ? "bg-slate-900 ring-amber-500/30" : "bg-slate-950 ring-slate-800",
        urgency === 'high' && !isPreparing ? "ring-rose-500/50" : ""
      )}>
        {/* Card Header */}
        <div className={cn(
          "p-6 flex justify-between items-start border-b",
          isPreparing ? "border-amber-500/10 bg-amber-500/[0.03]" : "border-white/5"
        )}>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
               <Badge className={cn(
                  "px-2 py-0.5 rounded-lg border-none font-black text-[9px] uppercase tracking-widest",
                  isPreparing ? "bg-amber-500 text-white animate-pulse" : "bg-slate-800 text-slate-400"
               )}>
                  {isPreparing ? "EM PREPARO" : "NA FILA"}
               </Badge>
               <span className="text-[10px] font-black text-slate-500">#{order.num_serial || order.id.slice(0, 3)}</span>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none truncate">
              {order.customers?.name || "Balcão"}
            </h3>
            <p className="text-[10px] font-bold text-slate-500 mt-1 flex items-center gap-1.5 uppercase tracking-widest">
               <Clock className="size-3" /> {timeAgo}
            </p>
          </div>

          <div className={cn(
             "size-12 rounded-2xl flex flex-col items-center justify-center font-black italic",
             urgency === 'high' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" :
             urgency === 'medium' ? "bg-amber-500 text-slate-900" : "bg-emerald-500 text-slate-900"
          )}>
             <span className="text-lg leading-none">{minutesOpen}</span>
             <span className="text-[7px] leading-none uppercase tracking-widest">MIN</span>
          </div>
        </div>

        {/* Content - Items List */}
        <CardContent className="p-6 flex-1 overflow-y-auto scrollbar-hide">
           <div className="space-y-3">
              {order.order_items?.map((item: any) => (
                 <div 
                   key={item.id}
                   onClick={() => toggleItem(item.id)}
                   className={cn(
                      "group flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all border",
                      checkedItems[item.id] ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"
                   )}
                 >
                    <div className={cn(
                       "size-6 rounded-lg border flex items-center justify-center transition-all shrink-0",
                       checkedItems[item.id] ? "bg-emerald-500 border-emerald-500" : "border-white/20 group-hover:border-white/40"
                    )}>
                       {checkedItems[item.id] && <CheckCircle2 className="size-4 text-slate-900" />}
                    </div>
                    <div className="min-w-0 flex-1">
                       <p className={cn(
                          "font-black text-sm uppercase italic tracking-tighter truncate transition-all",
                          checkedItems[item.id] ? "text-emerald-500/50 line-through" : "text-white"
                       )}>
                          {item.quantidade}x {item.products?.name || "Produto"}
                       </p>
                       {item.observacoes && (
                          <p className="text-[10px] font-bold text-amber-500/80 italic line-clamp-1 uppercase tracking-widest">
                             {item.observacoes}
                          </p>
                       )}
                    </div>
                 </div>
              ))}
           </div>
        </CardContent>

        {/* Footer Actions */}
        <div className="p-6 pt-2">
           <Button 
             onClick={() => onStatusUpdate(order.id, order.status)}
             className={cn(
                "w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em] italic text-xs gap-3 transition-all active:scale-95",
                isPreparing 
                   ? (allChecked ? "bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20" : "bg-amber-500 hover:bg-amber-600 text-slate-950")
                   : "bg-white hover:bg-slate-100 text-slate-950"
             )}
           >
              {isPreparing ? (
                 <>FINALIZAR PEDIDO <CheckCircle2 className="size-5" /></>
              ) : (
                 <>INICIAR PREPARO <Utensils className="size-5" /></>
              )}
           </Button>
        </div>
      </Card>
    </motion.div>
  )
}

// --- Main Page Component ---

import { FeatureGuard } from "@/components/dashboard/FeatureGuard"

export default function KitchenPage() {
  return (
    <FeatureGuard feature="cozinha" planRequired="pro">
      <KitchenContent />
    </FeatureGuard>
  )
}

function KitchenContent() {
  const { profile, business, loadingBusiness } = useBusiness()
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const fetchOrders = useCallback(async () => {
    if (!profile?.tenant_id) return
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers!customer_id(name),
          order_items(*, products(name))
        `)
        .eq('tenant_id', profile.tenant_id)
        .in('status', ['accepted', 'preparing'])
        .order('created_at', { ascending: true })
      
      if (error) throw error
      setOrders(data || [])
    } catch (e: any) {
      console.error("KDS error:", e)
      toast.error("Erro ao sincronizar cozinha")
    } finally {
      setIsLoading(false)
    }
  }, [profile?.tenant_id])

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchOrders()
      const subscription = supabase
        .channel('kds-realtime')
        .on('postgres_changes', { 
           event: '*', 
           schema: 'public', 
           table: 'orders',
           filter: `tenant_id=eq.${profile.tenant_id}` 
        }, (payload) => {
           if (payload.eventType === 'INSERT' || (payload.new as any).status === 'accepted') {
              if (audioEnabled && audioRef.current) {
                audioRef.current.play()
              }
              toast.info("Novo pedido na cozinha!")
           }
           fetchOrders()
        })
        .subscribe()
      return () => { supabase.removeChannel(subscription) }
    }
  }, [profile?.tenant_id, fetchOrders, audioEnabled])

  const handleUpdateStatus = async (orderId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'accepted' ? 'preparing' : 'ready'
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId)
      
      if (error) throw error
      
      if (nextStatus === 'ready') {
        toast.success("Pedido finalizado com sucesso!")
      } else {
        toast.info("Pedido em preparação.")
      }
      fetchOrders()
    } catch (e) {
      toast.error("Erro ao atualizar status")
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled)
    if (!audioEnabled) {
      toast.success("Alertas sonoros ativados!")
    }
  }

  if (loadingBusiness || (isLoading && !orders.length)) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
         <div className="flex flex-col items-center gap-6">
            <div className="size-20 bg-amber-500/20 rounded-full flex items-center justify-center animate-pulse">
               <ChefHat className="size-10 text-amber-500" />
            </div>
            <p className="font-black italic uppercase tracking-[0.3em] text-white/50 text-sm animate-pulse">MODO COZINHA ATIVO</p>
         </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-amber-500 overflow-hidden flex flex-col">
      <audio ref={audioRef} src="/sounds/notificacao.mp3" />

      {/* KDS Header */}
      <header className="h-[90px] px-8 md:px-12 flex items-center justify-between border-b border-white/5 bg-slate-950/80 backdrop-blur-xl shrink-0 z-20">
         <div className="flex items-center gap-6">
            <div className="size-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/10 rotate-3">
               <ChefHat className="size-6 text-slate-950" />
            </div>
            <div>
               <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                  KDS <span className="text-amber-500">PRODUCTION</span>
               </h1>
               <div className="flex items-center gap-2 mt-1">
                  <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Real-time Sync Active</span>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5 shadow-inner">
            <div className="px-5 text-center flex flex-col">
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Pendente</span>
               <span className="text-xl font-black italic text-white leading-none mt-1">{orders.filter(o => o.status === 'accepted').length}</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="px-5 text-center flex flex-col">
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Em Preparo</span>
               <span className="text-xl font-black italic text-amber-500 leading-none mt-1">{orders.filter(o => o.status === 'preparing').length}</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex gap-1 pr-1">
               <Button variant="ghost" size="icon" onClick={toggleAudio} className={cn("size-10 rounded-xl transition-all", audioEnabled ? "bg-amber-500/20 text-amber-500" : "text-slate-500 bg-white/5")}>
                  {audioEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4 opacity-50" />}
               </Button>
               <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="size-10 rounded-xl text-slate-500 bg-white/5 hover:text-white">
                  <Maximize2 className="size-4" />
               </Button>
            </div>
         </div>
      </header>

      {/* Card Grid */}
      <main className="flex-1 overflow-hidden relative">
         <ScrollArea className="h-full px-8 md:px-12 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
               <AnimatePresence mode="popLayout" initial={false}>
                  {orders.map((order) => (
                     <KitchenCard 
                        key={order.id} 
                        order={order} 
                        onStatusUpdate={handleUpdateStatus} 
                     />
                  ))}
               </AnimatePresence>

               {orders.length === 0 && !isLoading && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="col-span-full py-40 flex flex-col items-center justify-center opacity-20"
                  >
                     <Utensils className="size-32 mb-8" strokeWidth={1} />
                     <h3 className="text-3xl font-black italic uppercase tracking-tighter">Cozinha Vazia</h3>
                     <p className="text-sm font-bold uppercase tracking-widest mt-4 italic">Novos pedidos aparecerão aqui instantaneamente</p>
                  </motion.div>
               )}
            </div>
         </ScrollArea>
      </main>

      {/* Footer / Status Bar */}
      <footer className="h-10 px-8 border-t border-white/5 bg-slate-950 flex items-center justify-between shrink-0">
         <div className="flex items-center gap-6">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">{business?.nome || "DocesGestão System"}</p>
         </div>
         <div className="flex items-center gap-3">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">{format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
         </div>
      </footer>
    </div>
  )
}
