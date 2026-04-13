"use client"

import { motion } from "framer-motion"
import { Bike, Hand, X, Globe } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface OrderNotificationProps {
    order: any
    onClose: () => void
}

export function OrderNotification({ order, onClose }: OrderNotificationProps) {
    const isDelivery = order.delivery_type === "entrega"

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="bg-white border-2 border-slate-50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] rounded-[32px] p-6 w-[380px] flex items-start gap-5 relative overflow-hidden"
        >
            {/* Icon Area */}
            <div className={cn(
                "size-16 rounded-[24px] flex items-center justify-center shrink-0 shadow-inner",
                isDelivery ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"
            )}>
                {isDelivery ? <Bike className="size-10" /> : <Hand className="size-10" />}
            </div>

            {/* Content Area */}
            <div className="flex-1 space-y-2.5">
                <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                        <h4 className="text-[17px] font-black text-slate-900 leading-none tracking-tighter italic uppercase">
                            Novo pedido <span className="text-rose-500">#{order.id?.slice(0, 4)}</span>
                        </h4>
                        <p className="text-[14px] font-bold text-slate-500 truncate">
                            {order.customers?.name || "Cliente Teste"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-300 hover:text-slate-500 transition-colors p-1 -mt-1 -mr-1"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2">
                    <div className="bg-[#FFEAD8] text-[#D87D31] rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                        Pendente
                    </div>
                    <div className="bg-rose-50 text-rose-500 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                        Não pago
                    </div>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agora • {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    <div className="flex items-center gap-1.5 bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                        <Globe className="size-3 text-rose-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest">WEB</span>
                    </div>
                </div>
            </div>

            {/* Pulsating Border for Attention */}
            <div className={cn(
                "absolute inset-0 border-2 rounded-[32px] pointer-events-none animate-pulse",
                isDelivery ? "border-rose-500/10" : "border-emerald-500/10"
            )} />
        </motion.div>
    )
}
