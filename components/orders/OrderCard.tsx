"use client"

import { motion } from "framer-motion"
import { ShoppingBag, Flame, CheckCircle2, Truck, X, FileText, MessageCircle, MoreVertical, DollarSign, Clock, Calendar, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Order {
  id: string
  customer_id: string
  product_name: string
  total: number
  deposit_value: number
  status: string
  delivery_date: string
  payment_method: string
  precisa_troco?: boolean
  valor_pago?: number
  troco?: number
  customers?: { name: string }
}

const statusConfig: Record<string, { label: string, color: string, icon: any, bg: string, iconBg: string, border: string }> = {
  novo: { label: "Novo", color: "text-amber-600", icon: ShoppingBag, bg: "bg-amber-50", iconBg: "bg-amber-500", border: "border-amber-100" },
  em_preparo: { label: "Em Preparo", color: "text-blue-600", icon: Flame, bg: "bg-blue-50", iconBg: "bg-blue-500", border: "border-blue-100" },
  pronto: { label: "Pronto", color: "text-emerald-600", icon: CheckCircle2, bg: "bg-emerald-50", iconBg: "bg-emerald-500", border: "border-emerald-100" },
  saiu_entrega: { label: "Saindo", color: "text-orange-600", icon: Truck, bg: "bg-orange-50", iconBg: "bg-orange-500", border: "border-orange-100" },
  entregue: { label: "Entregue", color: "text-slate-400", icon: CheckCircle2, bg: "bg-slate-50", iconBg: "bg-slate-400", border: "border-slate-100" },
  cancelado: { label: "Cancelado", color: "text-rose-600", icon: X, bg: "bg-rose-50", iconBg: "bg-rose-500", border: "border-rose-100" },
  orcamento: { label: "Orçamento", color: "text-slate-500", icon: FileText, bg: "bg-slate-100", iconBg: "bg-slate-400", border: "border-slate-200" },
  confirmado: { label: "Confirmado", color: "text-sky-600", icon: CheckCircle2, bg: "bg-sky-50", iconBg: "bg-sky-500", border: "border-sky-100" },
}

export function OrderCard({ 
  order, 
  onUpdateStatus, 
  onDelete, 
  onShare 
}: { 
  order: Order, 
  onUpdateStatus: (id: string, s: any) => void,
  onDelete: (id: string) => void,
  onShare: (order: any) => void
}) {
  const config = statusConfig[order.status] || statusConfig.novo
  const balance = (order.total || 0) - (order.deposit_value || 0)
  const isPaid = balance <= 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col rounded-[32px] border border-slate-100 bg-white p-6 shadow-premium transition-all hover:shadow-2xl hover:-translate-y-1"
    >
      {/* Premium Status Badge (Top Right) */}
      <div className="absolute top-6 right-6">
        <Badge className={cn("rounded-full px-3 py-1 font-black uppercase text-[8px] tracking-widest border-none shadow-sm", config.bg, config.color)}>
          {config.label}
        </Badge>
      </div>

      <div className="flex items-start gap-4 mb-6">
        <div className={cn("size-14 rounded-2xl flex items-center justify-center text-white shadow-lg", config.iconBg)}>
          <config.icon size={24} />
        </div>
        <div className="flex flex-col">
          <h3 className="text-base font-black text-slate-900 uppercase italic tracking-tighter leading-none pr-12">
            {order.product_name}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
            <User size={10} className="text-slate-300" />
            {order.customers?.name || "Cliente sem nome"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Data Entrega</p>
          <div className="flex items-center gap-2 text-slate-700">
            <Calendar size={12} className="text-slate-400" />
            <span className="text-[11px] font-black italic">{format(new Date(order.delivery_date), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Total Pedido</p>
          <div className="flex items-center gap-2 text-slate-900">
            <DollarSign size={12} className="text-emerald-500" />
            <span className="text-xs font-black italic">R$ {order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Progress / Payment Info */}
      <div className="space-y-3 mb-6">
         <div className="flex justify-between items-end">
            <span className="text-[9px] font-black uppercase text-slate-400 italic">Pagamento</span>
            <span className={cn("text-[9px] font-black uppercase italic", isPaid ? "text-emerald-500" : "text-amber-500")}>
               {isPaid ? "Quitado" : `Pendente: R$ ${balance.toFixed(2)}`}
            </span>
         </div>
         <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${Math.min(100, (order.deposit_value / order.total) * 100)}%` }}
               className={cn("h-full rounded-full transition-all duration-1000", isPaid ? "bg-emerald-500" : "bg-amber-500")}
            />
         </div>
      </div>

      {/* Troco Destaque (Merchant UX) */}
      {order.payment_method === 'dinheiro' && (
        <div className="mb-6">
           {!order.precisa_troco ? (
             <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3 shadow-inner">
                <div className="size-8 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500">
                   <DollarSign size={14} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Sem necessidade de troco</p>
             </div>
           ) : (
             <div className="p-5 rounded-[24px] bg-amber-50 border-2 border-amber-200 flex flex-col gap-4 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-2 -top-2 opacity-5 scale-150 rotate-12 group-hover:scale-[1.7] transition-transform duration-700 text-amber-500">
                   <DollarSign size={60} />
                </div>
                
                <div className="flex items-center justify-between relative z-10">
                   <div className="flex items-center gap-2">
                      <div className="size-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-200">
                         <DollarSign size={16} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 italic">Pagamento em Dinheiro</p>
                   </div>
                   <Badge className="bg-amber-500 text-white border-none text-[8px] font-black tracking-[0.2em]">TROCO</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 relative z-10">
                   <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-amber-100">
                      <p className="text-[8px] font-black text-amber-800/40 uppercase tracking-widest mb-1.5">Troco para</p>
                      <p className="text-lg font-black text-amber-900 italic tracking-tighter leading-none">R$ {order.valor_pago?.toFixed(2)}</p>
                   </div>
                   <div className="bg-amber-500 p-4 rounded-2xl shadow-lg shadow-amber-200">
                      <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-1.5">Troco a entregar</p>
                      <p className="text-lg font-black text-white italic tracking-tighter leading-none">R$ {order.troco?.toFixed(2)}</p>
                   </div>
                </div>
             </div>
           )}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-50 pt-4">
        <div className="flex gap-2">
           <Button 
             variant="ghost" 
             size="icon" 
             onClick={() => onShare(order)}
             className="size-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
           >
             <MessageCircle size={18} />
           </Button>
           <Button 
             variant="ghost" 
             size="icon"
             className="size-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100"
           >
             <MoreVertical size={18} />
           </Button>
        </div>
        
        <div className="flex items-center gap-2">
           {order.status === 'novo' && (
             <Button 
               onClick={() => onUpdateStatus(order.id, 'em_preparo')}
               className="h-10 px-4 rounded-xl bg-blue-600 text-white font-black italic uppercase text-[9px] tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
             >
                Iniciar Preparo
             </Button>
           )}
           {order.status === 'em_preparo' && (
             <Button 
               onClick={() => onUpdateStatus(order.id, 'pronto')}
               className="h-10 px-4 rounded-xl bg-emerald-600 text-white font-black italic uppercase text-[9px] tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
             >
                Tudo Pronto!
             </Button>
           )}
           {order.status === 'pronto' && (
             <Button 
               onClick={() => onUpdateStatus(order.id, 'saiu_entrega')}
               className="h-10 px-4 rounded-xl bg-orange-600 text-white font-black italic uppercase text-[9px] tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
             >
                Despachar
             </Button>
           )}
        </div>
      </div>
    </motion.div>
  )
}
