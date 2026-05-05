"use client"

import { 
  Truck, 
  ShoppingBag, 
  Clock, 
  Check, 
  X, 
  DollarSign, 
  Printer, 
  MessageCircle, 
  MapPin, 
  ChevronDown,
  Globe,
  MoreVertical,
  ChevronRight,
  Settings2,
  RotateCw,
  FileText,
  Download
} from "lucide-react"
import { 
  generateNF, 
  printKitchenTicket, 
  downloadClientPDF, 
  printClientTicket 
} from "@/lib/printActions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useOrderTimer } from "@/hooks/useOrderTimer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion } from "framer-motion"

interface OrderRowProps {
  order: any
  onAccept: () => void
  onUpdateStatus: (status: string) => void
  onOpenPayment: () => void
  onOpenDetails: () => void
  onOpenDetails: () => void
}

export function OrderRow({ order, onAccept, onUpdateStatus, onOpenPayment, onOpenDetails }: OrderRowProps) {
  const timer = useOrderTimer(order.created_at)
  const isDelivery = order.order_type === 'delivery'
  const isPendente = order.status === 'novo'
  
  // Status colors for left border (OlaClick exact hex)
  const statusColors: Record<string, string> = {
    novo: "#f97316",
    pendente: "#f97316",
    preparo: "#16a34a",
    pronto: "#1a56db",
    finalizado: "#1a56db",
    cancelado: "#dc2626"
  }
  const borderColor = statusColors[order.status] || "#e5e7eb"
  
  const statusSteps = [
    { id: 'preparo', label: 'Em preparação' },
    { id: 'pronto', label: 'Pronto / Saiu' },
    { id: 'finalizado', label: 'Finalizado' },
    { id: 'cancelado', label: 'Cancelado' },
  ]

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation()
    action()
  }

  // Timer color logic
  const timerColor = timer.severity === 'critical' ? 'text-red-600' : (timer.severity === 'warning' ? 'text-orange-500' : 'text-[#f97316]')

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={onOpenDetails}
      className="group relative flex items-center px-4 h-[110px] border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
    >
      {/* Indicador de Status lateral (3px) */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: borderColor }} />

      {/* 📅 Coluna DATA (250px) */}
      <div className="w-[250px] pl-4 flex flex-col gap-0.5">
         <div className="flex items-center gap-2">
            <span className="font-black text-[#1a56db] text-base uppercase italic tracking-tighter">
               #{order.id.slice(-4).toUpperCase()}
            </span>
            <div className={cn(
               "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase italic tracking-wider",
               isDelivery ? "bg-[#eff6ff] text-[#1a56db]" : "bg-[#f0fdf4] text-[#16a34a]"
            )}>
               {isDelivery ? <Truck size={10} /> : <ShoppingBag size={10} />}
               {isDelivery ? 'Delivery' : 'Balcão'}
            </div>
         </div>
         
         <div className={cn("flex items-center gap-1.5 text-sm font-black italic leading-none my-0.5", timerColor)}>
            <div className={cn("size-1.5 rounded-full animate-pulse", timer.severity === 'critical' ? 'bg-red-600' : 'bg-[#f97316]')} />
            🕐 {timer.elapsed}
         </div>

         <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="secondary" className="bg-slate-100 text-slate-400 border-none text-[8px] font-black uppercase tracking-widest px-1.5 h-4">WEB</Badge>
            <span className="text-[10px] font-bold text-slate-300 italic tracking-tighter leading-none">BR-{order.id.slice(0, 8)}...</span>
         </div>
         
         <span className="text-[10px] font-bold text-slate-300 uppercase mt-0.5 tracking-tighter">
            {format(new Date(order.created_at), "dd/MM/yy HH:mm")}
         </span>
      </div>

      {/* 🏷️ Coluna ESTADO (220px) */}
      <div className="w-[220px] flex flex-col gap-2">
         <div className={cn(
            "w-fit rounded-full px-3 py-1 text-[10px] font-black uppercase italic tracking-widest",
            order.status === 'novo' && "bg-orange-100 text-[#f97316]",
            order.status === 'pendente' && "bg-orange-100 text-[#f97316]",
            order.status === 'preparo' && "bg-green-100 text-[#16a34a]",
            order.status === 'pronto' && "bg-blue-100 text-[#1a56db]",
            order.status === 'finalizado' && "bg-blue-100 text-[#1a56db]",
            order.status === 'cancelado' && "bg-red-100 text-[#dc2626]"
          )}>
            {order.status === 'novo' ? 'PENDENTE' : 
             order.status === 'preparo' ? 'EM PREPARAÇÃO' : 
             order.status === 'pronto' ? 'PRONTO / SAIU' : 
             order.status === 'finalizado' ? 'FINALIZADO' : 'CANCELADO'}
         </div>
         
         <div className="flex items-center gap-2">
            <Badge className={cn(
               "border-none rounded-full font-black text-[9px] uppercase italic px-2 h-4",
               order.paid ? "bg-green-100 text-green-600" : "bg-orange-50 text-orange-500"
            )}>
               {order.paid ? 'PAGO' : 'NÃO PAGO'}
            </Badge>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 italic">
               <DollarSign size={10} />
               {order.payment_method || 'Dinheiro'} {Number(order.total).toFixed(2)}...
            </div>
         </div>
      </div>

      {/* 💰 Coluna TOTAL (150px) */}
      <div className="w-[150px]">
         <span className="font-black text-slate-800 text-base italic tracking-tighter">R$ {Number(order.total).toFixed(2)}</span>
      </div>

      {/* 👤 Coluna CLIENTE (flex-1) */}
      <div className="flex-1 flex flex-col gap-1">
         <div className="flex items-center gap-2">
            <span className="font-black text-slate-800 text-[11px] uppercase italic tracking-tighter">{order.customer_name || "Cliente"}</span>
            <button 
              onClick={(e) => handleActionClick(e, () => {
                if (!order.customer_phone) return
                window.open(`https://wa.me/55${order.customer_phone.replace(/\D/g, '')}`, '_blank')
              })}
              className="flex items-center gap-1.5 px-2 py-0.5 bg-[#dcfce7] text-[#16a34a] rounded-full font-black text-[9px] uppercase italic transition-all hover:scale-105"
            >
               <MessageCircle size={10} fill="currentColor" />
               {order.customer_phone || "+55 00 00000-0000"}
               <ChevronDown size={8} strokeWidth={3} />
            </button>
         </div>
         {isDelivery && (
           <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] italic">
              <MapPin size={12} className="text-[#1a56db]" />
              <span className="truncate uppercase">{order.address || "Endereço não informado"}</span>
           </div>
         )}
         <button 
          onClick={(e) => handleActionClick(e, () => {})}
          className="w-fit flex items-center gap-2 px-3 py-1 rounded-full border border-blue-100 bg-white text-[#1a56db] font-black text-[9px] uppercase italic tracking-widest mt-1 hover:bg-blue-50 transition-colors"
         >
            {isDelivery ? '🛵 Escolher entregador' : '🍽️ Atribuir Mesa'}
            <ChevronRight size={12} strokeWidth={3} />
         </button>
      </div>

      {/* ⚡ Coluna AÇÕES (320px) */}
      <div className="w-[320px] flex items-center justify-end gap-2 pr-4">
         {isPendente ? (
           <>
             <Button 
              variant="outline" 
              onClick={(e) => handleActionClick(e, () => onUpdateStatus('cancelado'))}
              className="h-10 px-3 rounded-xl border-red-500 text-red-500 font-black uppercase italic text-[10px] tracking-widest gap-2 hover:bg-red-50"
             >
                <X size={16} /> Rejeitar
             </Button>

             <DropdownMenu>
               <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                 <Button variant="outline" className="h-10 px-3 rounded-xl border-slate-200 text-slate-400 font-black uppercase italic text-[10px] tracking-widest gap-2">
                   <RotateCw size={16} /> Status
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent className="w-48 rounded-2xl border-none shadow-2xl p-2 z-[100]">
                 {statusSteps.map(s => (
                   <DropdownMenuItem key={s.id} onClick={() => onUpdateStatus(s.id)} className="font-bold text-xs uppercase italic">{s.label}</DropdownMenuItem>
                 ))}
               </DropdownMenuContent>
             </DropdownMenu>

             <Button 
                variant="outline" 
                className="h-10 px-3 rounded-xl border-[#1a56db] text-[#1a56db] font-black uppercase italic text-[10px] tracking-widest gap-2 hover:bg-blue-50"
                onClick={(e) => handleActionClick(e, onOpenPayment)}
              >
                <DollarSign size={16} /> Pagar
              </Button>

             <Button 
              className="h-10 px-6 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black uppercase italic text-[10px] tracking-widest gap-2 shadow-lg shadow-emerald-100"
              onClick={(e) => handleActionClick(e, onAccept)}
             >
                <Check size={16} strokeWidth={3} /> Aceitar
             </Button>
           </>
         ) : (
           <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="flex items-center justify-center w-[36px] h-[36px] bg-[#ffffff] border border-[#d0d0d0] rounded-[6px] cursor-pointer text-[#555555] hover:bg-[#f5f5f5] transition-colors outline-none"
                  >
                    <Printer size={16} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[240px] bg-[#ffffff] border border-[#e8e8e8] rounded-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-0 overflow-hidden z-[1000]">
                   <DropdownMenuItem 
                    onClick={() => generateNF(order)}
                    className="flex items-center gap-[10px] h-[44px] px-[16px] text-[13px] text-[#333333] cursor-pointer border-b border-[#f0f0f0] hover:bg-[#f5f5f5] rounded-none focus:bg-[#f5f5f5]"
                   >
                      <FileText className="size-[15px] text-[#1a56db]" />
                      Emitir nota fiscal
                   </DropdownMenuItem>
                   <DropdownMenuItem 
                    onClick={() => printKitchenTicket(order)}
                    className="flex items-center gap-[10px] h-[44px] px-[16px] text-[13px] text-[#333333] cursor-pointer border-b border-[#f0f0f0] hover:bg-[#f5f5f5] rounded-none focus:bg-[#f5f5f5]"
                   >
                      <Printer className="size-[15px] text-[#555555]" />
                      Ticket de cozinha
                   </DropdownMenuItem>
                   <DropdownMenuItem 
                    onClick={() => downloadClientPDF(order)}
                    className="flex items-center gap-[10px] h-[44px] px-[16px] text-[13px] text-[#333333] cursor-pointer border-b border-[#f0f0f0] hover:bg-[#f5f5f5] rounded-none focus:bg-[#f5f5f5]"
                   >
                      <Download className="size-[15px] text-[#555555]" />
                      Baixar o ticket do cliente em PDF
                   </DropdownMenuItem>
                   <DropdownMenuItem 
                    onClick={() => printClientTicket(order)}
                    className="flex items-center gap-[10px] h-[44px] px-[16px] text-[13px] text-[#333333] cursor-pointer hover:bg-[#f5f5f5] rounded-none focus:bg-[#f5f5f5]"
                   >
                      <Printer className="size-[15px] text-[#555555]" />
                      Ticket do cliente
                   </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" className="h-10 px-3 rounded-xl border-slate-200 text-slate-400 font-black uppercase italic text-[10px] tracking-widest gap-2">
                    <RotateCw size={16} /> Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 rounded-2xl border-none shadow-2xl p-2 z-[100]">
                  {statusSteps.map(s => (
                    <DropdownMenuItem key={s.id} onClick={() => onUpdateStatus(s.id)} className="font-bold text-xs uppercase italic">{s.label}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                variant="outline" 
                className="h-10 px-4 rounded-xl border-[#1a56db] text-[#1a56db] font-black uppercase italic text-[10px] tracking-widest gap-2 hover:bg-blue-50"
                onClick={(e) => handleActionClick(e, onOpenPayment)}
              >
                <DollarSign size={16} /> Pagar
              </Button>

              <Button 
                onClick={(e) => handleActionClick(e, () => onUpdateStatus('finalizado'))}
                className="h-10 px-6 rounded-xl bg-[#1a56db] hover:bg-[#1e40af] text-white font-black uppercase italic text-[10px] tracking-widest gap-2 shadow-lg shadow-blue-100"
              >
                <Check size={16} strokeWidth={3} /> Finalizar
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" className="h-10 w-8 p-0 rounded-xl border-slate-200 text-slate-300">
                    <MoreVertical size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 w-48 z-[100]">
                   <DropdownMenuItem className="text-slate-500 font-bold text-xs" onClick={() => onUpdateStatus('cancelado')}>⊘ Cancelar Pedido</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
           </>
         )}
      </div>
    </motion.div>
  )
}
