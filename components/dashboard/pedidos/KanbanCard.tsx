"use client"

import { Clock, MapPin, ShoppingBag, User, CreditCard, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface KanbanCardProps {
  order: any
  onClick: () => void
}

export function KanbanCard({ order, onClick }: KanbanCardProps) {
  const isDelivery = order.order_type === 'delivery' || order.order_type === 'entrega'
  
  const statusColors: Record<string, string> = {
    novo: "bg-amber-500",
    preparo: "bg-blue-500",
    entrega: "bg-purple-500",
    finalizado: "bg-emerald-500",
    cancelado: "bg-rose-500",
  }

  const statusColor = statusColors[order.status] || "bg-slate-400"

  const isNew = order.status === 'novo'

  return (
    <motion.div
      layoutId={order.id}
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "bg-white p-6 rounded-[32px] border transition-all cursor-pointer group relative flex flex-col gap-4",
        isNew 
          ? "border-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-100" 
          : "border-slate-100 shadow-sm hover:shadow-xl"
      )}
    >
      {/* New Order Highlight Pulse */}
      {isNew && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest italic animate-bounce shadow-lg shadow-amber-200">
           <div className="size-1.5 rounded-full bg-white animate-pulse" />
           Novo Pedido
        </div>
      )}

      {/* Type & Time */}
      <div className="flex items-center justify-between">
        <Badge className={cn(
          "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-none italic",
          isDelivery ? "bg-pink-100 text-pink-600" : "bg-blue-100 text-blue-600"
        )}>
          {isDelivery ? "Delivery" : "Retirada"}
        </Badge>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock size={12} className={cn(isNew && "animate-pulse text-amber-500")} />
          <span className={cn("text-[10px] font-bold uppercase tracking-widest italic", isNew && "text-amber-500")}>
            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ptBR })}
          </span>
        </div>
      </div>

      {/* Client Info */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "size-10 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110",
          statusColor
        )}>
          <User size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-black text-slate-800 tracking-tighter truncate uppercase italic text-base leading-none">
            {order.customer_name || "Cliente"}
          </h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic leading-none">
            #{order.id.slice(-5).toUpperCase()}
          </p>
        </div>
      </div>

      {/* Items Summary */}
      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 group-hover:bg-white transition-colors">
         <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5 italic">Resumo do Pedido</p>
         <p className="text-xs font-bold text-slate-600 line-clamp-2 leading-relaxed italic">
           {order.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(", ") || "Sem itens"}
         </p>
      </div>

      {/* Footer: Price & Status Indicator */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest italic">Valor Total</span>
          <span className="text-xl font-black text-slate-800 tracking-tighter italic leading-none">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={cn("size-3 rounded-full shadow-sm", statusColor)} />
          <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform group-hover:text-slate-600" />
        </div>
      </div>
    </motion.div>
  )
}
