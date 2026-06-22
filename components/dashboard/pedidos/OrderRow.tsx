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
  Download,
  Package
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
  isNew?: boolean
}

export function OrderRow({ order, onAccept, onUpdateStatus, onOpenPayment, onOpenDetails, isNew }: OrderRowProps) {
  const timer = useOrderTimer(order.createdAt)
  const isDelivery = order.delivery?.type === 'delivery'
  const isPendente = order.status === 'novo'
  
  const customerPhone = order.customer?.phone || order.customerPhone || order.cliente_phone || order.telefoneCliente || order.cliente?.telefone || ""
  const customerName = order.customer?.name || order.customerName || order.cliente_name || order.nomeCliente || order.cliente?.nome || (customerPhone ? `TEL: ${customerPhone}` : "Cliente não identificado")
  
  // Diagnostic log
  console.log('ORDER ROW DATA:', {
    id: order.id,
    customerName: order.customer?.name,
    customerPhone: order.customer?.phone,
    status: order.status,
    paymentMethod: order.payment?.method,
    total: order.total,
  })

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
  const timerColor = timer.isVeryLate ? 'text-red-600' : (timer.isLate ? 'text-orange-500' : 'text-[#f97316]')

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={onOpenDetails}
      className={cn(
        "group relative flex items-center px-4 h-[110px] border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer shrink-0",
        isNew && "animate-border-flash"
      )}
    >
      {/* Indicador de Status lateral (3px) */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: borderColor }} />

      {/* 📅 Coluna DATA (160px) */}
      <div className="w-[160px] pl-4 flex flex-col gap-0.5">
         <div className="flex items-center gap-1.5">
            <span className="font-black text-[#1a56db] text-sm uppercase italic tracking-tighter">
               {order.code ? `#${order.code}` : `#${order.id.slice(-4).toUpperCase()}`}
            </span>
            {isNew && (
              <Badge className="bg-[#dc2626] text-white border-none text-[8px] font-black uppercase tracking-widest px-1 h-3.5 animate-pulse leading-none flex items-center justify-center">
                NOVO
              </Badge>
            )}
         </div>
         
         <div className={cn("flex items-center gap-1 text-[11px] font-black italic leading-none my-0.5", timerColor)}>
            <span>🕐 {timer.display}</span>
         </div>
         
         <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-tighter">
            {format(new Date(order.createdAt), "dd/MM/yy HH:mm")}
         </span>
      </div>

      {/* 🏷️ Coluna ESTADO (140px) */}
      <div className="w-[140px] flex flex-col gap-1 pr-2">
         <div className={cn(
            "w-fit rounded-full px-2 py-0.5 text-[9px] font-black uppercase italic tracking-wider text-center leading-none",
            order.status === 'novo' && "bg-orange-100 text-[#f97316]",
            order.status === 'pendente' && "bg-orange-100 text-[#f97316]",
            order.status === 'preparo' && "bg-green-100 text-[#16a34a]",
            order.status === 'pronto' && "bg-blue-100 text-[#1a56db]",
            order.status === 'finalizado' && "bg-blue-100 text-[#1a56db]",
            order.status === 'cancelado' && "bg-red-100 text-[#dc2626]"
          )}>
            {order.status === 'novo' ? 'PENDENTE' : 
             order.status === 'preparo' ? 'EM PREPARAÇÃO' : 
             order.status === 'pronto' ? 'PRONTO' : 
             order.status === 'finalizado' ? 'FINALIZADO' : 'CANCELADO'}
         </div>
         
         <div className={cn(
            "w-fit flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase italic tracking-wider",
            isDelivery ? "bg-[#eff6ff] text-[#1a56db]" : 
            (order.delivery?.type === 'retirada' || order.delivery?.type === 'pickup') ? "bg-orange-50 text-orange-600" :
            "bg-[#f0fdf4] text-[#16a34a]"
         )}>
            {isDelivery ? <Truck size={8} /> : 
             (order.delivery?.type === 'retirada' || order.delivery?.type === 'pickup') ? <Package size={8} /> :
             <ShoppingBag size={8} />}
            {isDelivery ? 'Delivery' : 
             (order.delivery?.type === 'retirada' || order.delivery?.type === 'pickup') ? 'Retirada' :
             'Balcão'}
         </div>
      </div>

      {/* 💰 Coluna TOTAL (120px) */}
      <div className="w-[120px] pr-2">
         <span className="font-black text-slate-800 text-sm italic tracking-tighter">R$ {Number(order.total).toFixed(2)}</span>
      </div>

      {/* 👤 Coluna CLIENTE (200px) */}
      <div className="w-[200px] flex flex-col gap-0.5 pr-2">
         <span className="font-black text-slate-800 text-[11px] uppercase italic tracking-tighter truncate block w-full">
            {customerName}
         </span>
         {customerPhone && (
           <button 
             onClick={(e) => handleActionClick(e, () => {
               window.open(`https://wa.me/55${customerPhone.replace(/\D/g, '')}`, '_blank')
             })}
             className="w-fit flex items-center gap-1 px-1.5 py-0.5 bg-[#dcfce7] text-[#16a34a] rounded-full font-black text-[8px] uppercase italic transition-all hover:scale-105"
           >
              <MessageCircle size={8} fill="currentColor" />
              {customerPhone}
           </button>
         )}
         {isDelivery && (
           <span className="text-[9px] text-slate-400 font-bold italic truncate block w-full uppercase" title={order.delivery?.address}>
              {order.delivery?.address || "Sem endereço"}
           </span>
         )}
      </div>

      {/* 🌐 Coluna ORIGEM (110px) */}
      <div className="w-[110px] pr-2">
         {(() => {
            const channel = (order.channel || 'web').toLowerCase();
            const configMap: Record<string, { label: string, color: string }> = {
               pdv: { label: 'PDV', color: 'bg-purple-100 text-purple-700 border-purple-200' },
               web: { label: 'SITE WEB', color: 'bg-blue-100 text-blue-700 border-blue-200' },
               checkout: { label: 'CHECKOUT', color: 'bg-blue-100 text-blue-700 border-blue-200' },
               menu: { label: 'CARDÁPIO', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
               ifood: { label: 'IFOOD', color: 'bg-red-100 text-red-700 border-red-200' },
               app: { label: 'APP CLIENTE', color: 'bg-orange-100 text-orange-700 border-orange-200' },
               delivery_app: { label: 'APP DELIVERY', color: 'bg-orange-100 text-orange-700 border-orange-200' }
            };
            const config = configMap[channel] || { label: 'WEB', color: 'bg-blue-100 text-blue-700 border-blue-200' };
            return (
               <Badge className={cn("border font-black text-[8px] uppercase italic tracking-wider rounded-md px-1.5 py-0.5 shadow-none", config.color)}>
                  {config.label}
               </Badge>
            );
         })()}
      </div>

      {/* 💳 Coluna PAGAMENTO (140px) */}
      <div className="w-[140px] flex flex-col gap-1 pr-2">
         <Badge className={cn(
            "w-fit border-none rounded-full font-black text-[8px] uppercase italic px-1.5 h-3.5 leading-none flex items-center justify-center shadow-none",
            order.payment?.status === 'paid' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-500"
         )}>
            {order.payment?.status === 'paid' ? 'PAGO' : 'NÃO PAGO'}
         </Badge>
         <span className="text-[10px] font-black text-slate-400 italic flex items-center gap-0.5 uppercase">
            {order.payment?.method || 'Dinheiro'}
         </span>
      </div>

      {/* 🛵 Coluna ENTREGADOR (160px) */}
      <div className="w-[160px] pr-2">
         {isDelivery ? (
            order.driver ? (
               <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 italic uppercase">
                  <span className="shrink-0 text-emerald-600">🛵</span>
                  <span className="truncate block max-w-[120px]" title={order.driver.name}>{order.driver.name}</span>
               </div>
            ) : (
               <button 
                 onClick={(e) => handleActionClick(e, onOpenDetails)}
                 className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-blue-100 bg-white text-[#1a56db] font-black text-[8px] uppercase italic tracking-wider hover:bg-blue-50 transition-colors"
               >
                  🛵 Atribuir
               </button>
            )
         ) : (
            <span className="text-[10px] font-bold text-slate-300 italic">-</span>
         )}
      </div>

      {/* ⚡ Coluna AÇÕES (flex-1) */}
      <div className="flex-1 flex items-center justify-end gap-1.5 pr-4">
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
