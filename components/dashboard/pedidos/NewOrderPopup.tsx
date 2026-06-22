"use client"

import { X, ShoppingBag, Truck, Check } from "lucide-react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface NewOrderPopupProps {
  order: any
  onClose: () => void
  onClick: () => void
}

export function NewOrderPopup({ order, onClose, onClick }: NewOrderPopupProps) {
  const isDelivery = order.order_type === 'delivery'
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className="fixed top-6 right-6 z-[100] w-[380px] bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Foto/Ícone */}
          <div className="size-14 rounded-2xl bg-[#eff6ff] flex items-center justify-center text-[#1a56db] shadow-inner shrink-0">
             {isDelivery ? <Truck size={28} /> : <ShoppingBag size={28} />}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-800 text-sm italic tracking-tighter uppercase">Novo pedido - #{order.id.slice(-4).toUpperCase()}</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase italic">Hoje {format(new Date(), "HH:mm aa")}</span>
            </div>

            <div className="flex flex-col">
               <span className="font-black text-slate-600 uppercase italic text-[13px] tracking-tight truncate">{order.customer_name || "William De Souza"}</span>
               {/* Comprador Repetido Tag */}
               <span className="w-fit text-[#1a56db] font-black uppercase italic text-[9px] tracking-widest mt-0.5">Comprador Repetido</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
               <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 rounded-lg font-black text-[9px] uppercase italic px-2">Pendente</Badge>
               <Badge className="bg-orange-50 text-[#f57c00] hover:bg-orange-50 rounded-lg font-black text-[9px] uppercase italic px-2">Não pago</Badge>
               <Badge className="bg-slate-100 text-slate-400 hover:bg-slate-100 rounded-lg font-black text-[9px] uppercase italic px-2">WEB</Badge>
            </div>
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-1 hover:bg-slate-50 rounded-full text-slate-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Botão de Ação Rápida */}
      <button 
        onClick={onClick}
        className="w-full h-14 bg-[#1a56db] text-white font-black uppercase italic tracking-widest text-[11px] hover:bg-[#1e40af] transition-colors flex items-center justify-center gap-2"
      >
        Visualizar Pedido <Check size={14} strokeWidth={4} />
      </button>
    </motion.div>
  )
}
