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
    if (isFinished) return "border-[var(--border)] opacity-60"
    if (minutesElapsed >= 15) return "border-[var(--danger)]/30 bg-[var(--danger)]/5"
    if (minutesElapsed >= 5) return "border-[var(--accent)]/30 bg-[var(--accent)]/5"
    return "border-[var(--border)] bg-[var(--accent-light)]/30"
  }

  const getTimerStyles = () => {
    if (isFinished) return "bg-[var(--accent-light)] text-[var(--text-muted)]"
    if (minutesElapsed >= 15) return "bg-[var(--danger)] text-white"
    if (minutesElapsed >= 5) return "bg-[var(--accent)] text-white"
    return "bg-[var(--secondary)] text-white"
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
        "group relative bg-[var(--bg-card)] rounded-xl cursor-pointer transition-all border hover:shadow-md active:scale-95 p-2.5",
        getUrgencyStyles(),
        isNew && "shadow-lg border-[var(--secondary)] ring-2 ring-[var(--secondary)]/20"
      )}
    >
      {/* Header: ID & Urgency */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-[var(--text-muted)]">
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
        <h4 className="font-black text-[var(--text-primary)] uppercase italic truncate text-[11px] pr-2">
            {pedido.customers?.name || pedido.customer?.name || pedido.customerName || pedido.cliente_name || pedido.nomeCliente || pedido.cliente?.nome || "Cliente Final"}
        </h4>
        <div className="flex items-center justify-between mt-0.5">
            <span className="font-black text-[var(--text-primary)] text-sm tracking-tight italic">
                {formatCurrency(pedido.total)}
            </span>
            <div className="flex items-center gap-1 bg-[var(--accent-light)] border border-[var(--border)] px-1.5 py-0.5 rounded-md">
                {pedido.payment_method === 'pix' ? (
                   <span className="text-[8px] font-black text-[var(--secondary)] uppercase">PIX</span>
                ) : pedido.payment_method === 'money' ? (
                   <DollarSign className="size-2.5 text-[var(--accent)]" />
                ) : (
                   <CreditCard className="size-2.5 text-[var(--primary)]" />
                )}
            </div>
        </div>
      </div>

      {/* Footer: Actions */}
      <div className={cn(
          "flex gap-2 border-t border-[var(--border)] pt-2 mt-2 transition-all",
          "md:opacity-0 md:group-hover:opacity-100 md:translate-y-1 md:group-hover:translate-y-0"
      )} onClick={(e) => e.stopPropagation()}>
         {isNew ? (
            <div className="flex w-full gap-2">
                 <Button 
                   size="sm" 
                   className="flex-1 bg-[var(--secondary)] hover:bg-[var(--accent)] text-white rounded-xl h-12 md:h-8 p-0 shadow-sm active:scale-95"
                   onClick={() => onAccept?.(pedido.id)}
                 >
                   <Check className="size-5 md:size-4" />
                   <span className="md:hidden ml-2 font-black uppercase text-[10px] tracking-widest italic">Aceitar</span>
                 </Button>
                 <Button 
                   size="sm" 
                   variant="ghost"
                   className="rounded-xl h-12 md:h-8 w-12 md:w-8 text-[var(--danger)] p-0 border border-[var(--border)] bg-[var(--bg-app)]/50"
                   onClick={() => onReject?.(pedido.id)}
                 >
                   <X className="size-5 md:size-4" />
                 </Button>
            </div>
         ) : !isFinished && (
            <Button 
              size="sm" 
              className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] rounded-xl h-12 md:h-8 text-[11px] md:text-[10px] p-0 font-black uppercase tracking-widest italic shadow-lg active:scale-95 transition-all"
              onClick={() => onNextStep?.(pedido.id, pedido.status)}
            >
              {['preparando', 'em_preparo', 'preparing'].includes(pedido.status) ? 'Despachar' : 'Finalizar'}
              <ArrowRight className="ml-2 size-4 md:size-3" />
            </Button>
         )}
      </div>

      {/* Address pop-up on hover */}
      {isDelivery && !isFinished && (
          <div className="absolute left-0 bottom-[110%] w-full transition-all z-[60] opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 pointer-events-none">
              <div className="bg-[var(--primary)] shadow-xl text-[var(--primary-foreground)] text-[9px] font-black uppercase italic p-2 rounded-lg flex items-center gap-2 mx-1 border border-[var(--border)]">
                  <MapPin className="size-3 text-[var(--secondary)] shrink-0" />
                  <span className="truncate">{formatAddress(pedido)}</span>
              </div>
          </div>
      )}
    </motion.div>
  )
}
