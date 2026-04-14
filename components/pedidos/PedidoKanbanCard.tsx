"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Clock, 
  MapPin, 
  Check, 
  X, 
  DollarSign, 
  Bike,
  CreditCard,
  MessageCircle,
  Timer as TimerIcon,
  ChevronRight,
  Package,
  User,
  ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency, formatPhone, formatAddress } from "@/lib/formatters"
import { Button } from "@/components/ui/button"
import { usePedidoStore } from "@/store/pedidoStore"

interface PedidoKanbanCardProps {
  pedido: any
  onAccept?: (id: string) => Promise<void>
  onReject?: (id: string) => Promise<void>
  onNextStep?: (id: string, currentStatus: string) => Promise<void>
}

export function PedidoKanbanCard({ pedido, onAccept, onReject, onNextStep }: PedidoKanbanCardProps) {
  const [minutesElapsed, setMinutesElapsed] = useState(0)
  const setSelecionado = usePedidoStore(s => s.selecionarPedido)
  const config = usePedidoStore(s => s.config)

  useEffect(() => {
    const update = () => {
      const isFinished = ['finalizado', 'delivered', 'done', 'cancelado', 'cancelled'].includes(pedido.status)
      
      // UTC Robust Parsing
      const start = new Date(pedido.created_at).getTime()
      const now = Date.now()
      
      const endTime = isFinished 
        ? new Date(pedido.updated_at || now).getTime() 
        : now
        
      setMinutesElapsed(Math.floor((endTime - start) / 60000))
    }
    update()
    const interval = setInterval(() => {
      const isFinished = ['finalizado', 'delivered', 'done', 'cancelado', 'cancelled'].includes(pedido.status)
      if (!isFinished) update()
    }, 10000) // Update every 10s is enough for Kanban view
    return () => clearInterval(interval)
  }, [pedido.created_at, pedido.status, pedido.updated_at])

  const isFinished = ['finalizado', 'delivered', 'done', 'cancelado', 'cancelled'].includes(pedido.status)
  
  const getUrgencyStyles = () => {
    if (isFinished) return "border-slate-200 opacity-80"
    if (minutesElapsed >= 15) return "border-rose-300 bg-rose-50/50"
    if (minutesElapsed >= 5) return "border-amber-300 bg-amber-50/50"
    return "border-emerald-200 bg-emerald-50/20"
  }

  const getTimerStyles = () => {
    if (isFinished) return "bg-slate-100 text-slate-500"
    if (minutesElapsed >= 15) return "bg-rose-500 text-white"
    if (minutesElapsed >= 5) return "bg-amber-400 text-white"
    return "bg-emerald-500 text-white"
  }

  const isNew = ['novo', 'pending'].includes(pedido.status)
  const isDelivery = !['retirada', 'pickup', 'balcao', 'mesa'].includes((pedido.delivery_type || pedido.order_type || '').toLowerCase())
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => setSelecionado(pedido)}
      className={cn(
        "group relative bg-white rounded-xl cursor-pointer transition-all border hover:shadow-md active:scale-95 p-2.5",
        getUrgencyStyles(),
        isNew && "shadow-lg border-orange-300 ring-2 ring-orange-400/20"
      )}
    >
      {/* Header: ID & Urgency */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400">
            #{pedido.id.slice(0, 4).toUpperCase()}
          </span>
          <div className={cn(
             "size-1.5 rounded-full",
             isDelivery ? "bg-blue-500" : "bg-purple-500"
          )} title={isDelivery ? "Delivery" : "Retirada"} />
        </div>
        
        <div className={cn(
          "px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1",
          getTimerStyles()
        )}>
          {minutesElapsed}m
        </div>
      </div>

      {/* Content: Customer & Price */}
      <div className="mb-2">
        <h4 className="font-bold text-slate-800 truncate text-[11px] pr-2">
            {pedido.customers?.name || "Cliente Final"}
        </h4>
        <div className="flex items-center justify-between mt-0.5">
            <span className="font-bold text-emerald-600 text-sm tracking-tight">
                {formatCurrency(pedido.total)}
            </span>
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md">
                {pedido.payment_method === 'pix' ? (
                   <span className="text-[8px] font-black text-emerald-500 uppercase">PIX</span>
                ) : pedido.payment_method === 'money' ? (
                   <DollarSign className="size-2.5 text-amber-500" />
                ) : (
                   <CreditCard className="size-2.5 text-blue-500" />
                )}
            </div>
        </div>
      </div>

      {/* Footer: Actions - Always visible on mobile, hover-only on desktop */}
      <div className={cn(
          "flex gap-1.5 border-t border-slate-100 pt-1.5 mt-1.5 transition-all",
          "md:opacity-0 md:group-hover:opacity-100 md:translate-y-1 md:group-hover:translate-y-0"
      )} onClick={(e) => e.stopPropagation()}>
         {isNew ? (
            <div className="flex w-full gap-1">
                 <Button 
                   size="sm" 
                   className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg h-8 md:h-7 p-0"
                   onClick={() => onAccept?.(pedido.id)}
                 >
                   <Check className="size-4 md:size-3.5" />
                 </Button>
                 <Button 
                   size="sm" 
                   variant="ghost"
                   className="rounded-lg h-8 md:h-7 w-8 md:w-7 text-rose-500 p-0"
                   onClick={() => onReject?.(pedido.id)}
                 >
                   <X className="size-4 md:size-3.5" />
                 </Button>
            </div>
         ) : !isFinished && (
            <Button 
              size="sm" 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg h-9 md:h-7 text-[11px] md:text-[10px] p-0 font-black uppercase tracking-widest italic"
              onClick={() => onNextStep?.(pedido.id, pedido.status)}
            >
              {['preparando', 'em_preparo', 'preparing'].includes(pedido.status) ? 'Despachar' : 'Finalizar'}
              <ArrowRight className="ml-2 size-3.5 md:size-3" />
            </Button>
         )}
      </div>

      {/* Address pop-up on hover */}
      {isDelivery && !isFinished && (
          <div className="absolute left-0 bottom-[110%] w-full transition-all z-[60] opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 pointer-events-none">
              <div className="bg-slate-900 shadow-xl text-white text-[9px] font-medium p-2 rounded-lg flex items-center gap-2 mx-1 border border-white/10">
                  <MapPin className="size-3 text-emerald-400 shrink-0" />
                  <span className="truncate">{formatAddress(pedido)}</span>
              </div>
          </div>
      )}
    </motion.div>
  )
}
