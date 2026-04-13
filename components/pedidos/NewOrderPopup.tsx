"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Check, Truck, Package, X, Bike, User, DollarSign, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatAddress } from "@/lib/formatters"
import { cn } from "@/lib/utils"

interface NewOrderPopupProps {
  order: any
  onAccept: (id: string) => void
  onDismiss: () => void
}

export function NewOrderPopup({ order, onAccept, onDismiss }: NewOrderPopupProps) {
  if (!order) return null

  const isDelivery = !['retirada', 'pickup', 'balcao', 'mesa'].includes((order.delivery_type || order.order_type || '').toLowerCase())

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.8, x: "-50%" }}
        animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-[400px]"
      >
        <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)] border-4 border-emerald-500 relative overflow-hidden ring-8 ring-emerald-500/10">
          
          {/* Background Highlight */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

          {/* Header with Animated Icon */}
          <div className="flex items-center gap-4 mb-6">
            <motion.div
              animate={{ 
                rotate: isDelivery ? [0, -10, 10, 0] : [0, 0, 0],
                x: isDelivery ? [0, 5, -5, 0] : [0, 0, 0],
                y: !isDelivery ? [0, -5, 0] : [0, 0, 0]
              }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className={cn(
                "size-16 rounded-3xl flex items-center justify-center text-white shadow-lg",
                isDelivery ? "bg-blue-500 shadow-blue-200" : "bg-purple-500 shadow-purple-200"
              )}
            >
              {isDelivery ? <Bike size={32} strokeWidth={2.5} /> : <Package size={32} strokeWidth={2.5} />}
            </motion.div>
            
            <div className="flex-1">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-800 leading-none mb-1">Novo Pedido!</h3>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest",
                  isDelivery ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                )}>
                  {isDelivery ? "Delivery" : "Retirada"}
                </span>
                <span className="text-[10px] font-bold text-slate-400">#{order.id.slice(0, 6).toUpperCase()}</span>
              </div>
            </div>

            <Button variant="ghost" size="icon" className="rounded-full text-slate-300" onClick={onDismiss}>
              <X size={20} />
            </Button>
          </div>

          {/* Customer & Total */}
          <div className="bg-slate-50 rounded-3xl p-5 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-400 shrink-0">
                    <User size={20} />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Cliente</p>
                    <p className="text-sm font-black text-slate-800 truncate uppercase italic">{order.customers?.name || "Cliente Final"}</p>
                </div>
            </div>
            <div className="text-right shrink-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total</p>
                <p className="text-xl font-black text-emerald-600 italic tracking-tighter">{formatCurrency(order.total)}</p>
            </div>
          </div>

          {/* Address Display (Crucial for decision) */}
          <div className="bg-slate-900/5 rounded-2xl px-5 py-3 mb-6 flex items-start gap-3 border border-slate-100">
             <MapPin className="size-4 text-emerald-500 mt-0.5 shrink-0" />
             <div className="min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Local de Entrega</p>
                <p className="text-[11px] font-bold text-slate-600 line-clamp-2 leading-snug italic">
                    {formatAddress(order)}
                </p>
             </div>
          </div>

          {/* Action Button */}
          <Button 
            className="w-full h-16 rounded-3xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-200 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-3"
            onClick={() => onAccept(order.id)}
          >
            <Check size={20} strokeWidth={3} />
            Aceitar Pedido
          </Button>

          <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-4">Clique para processar agora</p>

        </div>
      </motion.div>
    </AnimatePresence>
  )
}
