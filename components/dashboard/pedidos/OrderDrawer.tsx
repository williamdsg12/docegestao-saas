"use client"

import { useState } from "react"
import { 
  X, 
  ArrowLeft, 
  Phone, 
  MapPin, 
  CreditCard, 
  ShoppingBag, 
  Truck, 
  Check, 
  Printer, 
  MessageCircle,
  Clock,
  ChevronRight,
  AlertCircle
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { formatDateTimeSP } from "@/lib/formatters"


interface OrderDrawerProps {
  order: any
  isOpen: boolean
  onClose: () => void
  onUpdateStatus: (params: { orderId: string, newStatus: string }) => Promise<void>
}

export function OrderDrawer({ order, isOpen, onClose, onUpdateStatus }: OrderDrawerProps) {
  if (!order) return null

  const isDelivery = order.order_type === 'delivery' || order.order_type === 'entrega'
  const items = order.items || []
  const total = Number(order.total || 0)

  const statusMap: Record<string, { label: string, color: string }> = {
    novo: { label: "Pendente", color: "bg-amber-100 text-amber-700" },
    preparo: { label: "Em Preparo", color: "bg-blue-100 text-blue-700" },
    entrega: { label: "Em Rota", color: "bg-purple-100 text-purple-700" },
    finalizado: { label: "Finalizado", color: "bg-emerald-100 text-emerald-700" },
    cancelado: { label: "Cancelado", color: "bg-rose-100 text-rose-700" },
  }

  const currentStatus = statusMap[order.status] || { label: order.status, color: "bg-slate-100 text-slate-700" }

  const handlePrint = () => {
    // Basic print logic - in a real app this would use a hidden iframe or a library like react-to-print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Comanda - #${order.id.slice(-5).toUpperCase()}</title>
            <style>
              body { font-family: 'Courier New', Courier, monospace; padding: 20px; font-size: 14px; }
              .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
              .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
              .footer { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; text-align: right; font-weight: bold; }
              .obs { font-style: italic; font-size: 12px; margin-top: 2px; color: #555; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>COMANDA DE COZINHA</h2>
              <p>#${order.id.slice(-5).toUpperCase()}</p>
              <p>${formatDateTimeSP(order.created_at, 'long')}</p>
              <p>${order.customer_name}</p>
            </div>
            <div class="items">
              ${items.map((i: any) => `
                <div class="item">
                  <span>${i.quantity}x ${i.name}</span>
                </div>
                ${i.observation ? `<div class="obs">Obs: ${i.observation}</div>` : ''}
              `).join('')}
            </div>
            <div class="footer">
              <p>TOTAL: R$ ${total.toFixed(2)}</p>
            </div>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await onUpdateStatus({ orderId: order.id, newStatus })
      toast.success(`Pedido movido para ${statusMap[newStatus]?.label || newStatus}`)
      if (newStatus === 'finalizado' || newStatus === 'cancelado') {
          onClose()
      }
    } catch (error) {
      toast.error("Erro ao atualizar status")
    }
  }

  const openWhatsApp = () => {
    if (!order.customer_phone) return
    const phone = order.customer_phone.replace(/\D/g, '')
    window.open(`https://wa.me/55${phone}`, '_blank')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" 
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:max-w-[550px] bg-[#FDFDFD] shadow-2xl z-[110] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
               <div className="flex items-center gap-4">
                  <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                    <X size={24} />
                  </button>
                  <div className="flex flex-col">
                     <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">Pedido #{order.id.slice(-5).toUpperCase()}</h2>
                        <Badge className={cn("border-none px-3 py-0.5 rounded-full text-[10px] font-black uppercase italic", currentStatus.color)}>
                          {currentStatus.label}
                        </Badge>
                     </div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                       {formatDateTimeSP(order.created_at, 'long')}
                     </p>
                  </div>
               </div>
               <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrint}
                className="rounded-full border-slate-200 text-slate-600 font-bold gap-2 px-4 hover:bg-slate-50"
               >
                 <Printer size={16} />
                 <span>Imprimir</span>
               </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6 space-y-8 pb-32">
                
                {/* Dados do Cliente */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="h-px flex-1 bg-slate-100" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cliente</span>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>

                  <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center">
                          <ShoppingBag size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase leading-none">{order.customer_name}</h3>
                          <p className="text-[11px] font-bold text-slate-400 mt-1">{order.customer_phone || "Sem telefone"}</p>
                        </div>
                      </div>
                      <button 
                        onClick={openWhatsApp}
                        className="p-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-emerald-500/20"
                      >
                        <MessageCircle size={20} fill="currentColor" />
                      </button>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="p-2 bg-white rounded-xl text-slate-400 border border-slate-100">
                        <MapPin size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Endereço de {isDelivery ? 'Entrega' : 'Retirada'}</p>
                        <p className="text-sm font-bold text-slate-700 leading-snug">
                          {order.address || "Não informado"}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Detalhes do Pedido */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="h-px flex-1 bg-slate-100" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Itens do Pedido</span>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>

                  <div className="space-y-3">
                    {items.map((item: any, idx: number) => (
                      <div key={idx} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex items-start gap-4">
                        <div className="size-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm shrink-0">
                          {item.quantity}x
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight truncate italic">{item.name}</h4>
                            <span className="font-black text-slate-900 text-sm shrink-0 italic">R$ {(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                          {item.variation && (
                            <p className="text-[10px] font-bold text-pink-500 uppercase mt-1">● {item.variation.name}</p>
                          )}
                          {item.extras && item.extras.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {item.extras.map((ex: any, i: number) => (
                                <p key={i} className="text-[9px] font-bold text-slate-400 uppercase">+ {ex.quantity}x {ex.name}</p>
                              ))}
                            </div>
                          )}
                          {item.observation && (
                            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                               <p className="text-[10px] font-bold text-slate-500 italic leading-relaxed">"{item.observation}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Pagamento */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="h-px flex-1 bg-slate-100" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Pagamento</span>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>

                  <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 size-32 bg-pink-500/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 size-32 bg-blue-500/10 rounded-full blur-3xl" />
                    
                    <div className="relative z-10 space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-2xl bg-white/10 flex items-center justify-center text-pink-400">
                            <CreditCard size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 italic">Método / Origem</p>
                            <p className="text-base font-black italic uppercase tracking-tighter leading-tight">
                              {order.payment_method || "Não inf."} 
                              <span className="text-[10px] font-bold text-slate-400 normal-case block mt-0.5">
                                Origem: {order.payment_origin === 'ONLINE' ? 'Online' : 
                                         order.payment_origin === 'NA ENTREGA' ? 'Entrega' : 
                                         order.payment_origin === 'NO BALCÃO' ? 'Balcão' : 'Entrega'}
                              </span>
                            </p>
                          </div>
                        </div>
                        <Badge className={cn(
                          "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-none shadow-lg",
                          order.payment_status === 'paid' || order.payment_status === 'pago' || order.payment_status === 'PAGO' ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                        )}>
                          {order.payment_status === 'paid' || order.payment_status === 'pago' || order.payment_status === 'PAGO' 
                            ? "Pago" 
                            : (order.payment_origin === 'ONLINE' ? "Pendente" : "Receber na Entrega")}
                        </Badge>
                      </div>

                      {Boolean(order.change_needed || (order.change_for && Number(order.change_for) > 0)) && (
                        <div className="pt-4 border-t border-white/10 flex justify-between items-center text-slate-400">
                          <span className="text-[10px] font-black uppercase tracking-widest italic">Troco para</span>
                          <span className="text-sm font-bold text-amber-500">R$ {Number(order.change_for).toFixed(2)}</span>
                        </div>
                      )}

                      <div className="pt-6 border-t border-white/10 space-y-3">
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="text-[10px] font-black uppercase tracking-widest italic">Subtotal</span>
                          <span className="text-sm font-bold">R$ {(total - (Number(order.delivery_fee) || 0)).toFixed(2)}</span>
                        </div>
                        {isDelivery && (
                          <div className="flex justify-between items-center text-slate-400">
                            <span className="text-[10px] font-black uppercase tracking-widest italic">Taxa de Entrega</span>
                            <span className="text-sm font-bold text-pink-400">+ R$ {(Number(order.delivery_fee) || 0).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-xs font-black uppercase tracking-widest italic">Total Final</span>
                          <span className="text-4xl font-black text-white italic tracking-tighter">R$ {total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                
                {order.notes && (
                  <div className="p-6 bg-amber-50 rounded-[32px] border border-amber-100 flex items-start gap-4">
                     <AlertCircle size={20} className="text-amber-500 shrink-0 mt-1" />
                     <div>
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 italic">Notas Internas</p>
                        <p className="text-sm font-bold text-amber-900 leading-relaxed italic">{order.notes}</p>
                     </div>
                  </div>
                )}

              </div>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="p-6 bg-white border-t border-slate-100 shrink-0 absolute bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl z-20">
               <div className="flex flex-col gap-3">
                  {order.status === 'novo' && (
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => handleStatusUpdate('preparo')}
                        className="flex-1 h-16 rounded-[24px] bg-[#1a56db] hover:bg-[#1e40af] text-white font-black uppercase italic tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                      >
                        Aceitar Pedido
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleStatusUpdate('cancelado')}
                        className="h-16 px-6 rounded-[24px] border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-rose-50 hover:text-rose-500 transition-all"
                      >
                        Rejeitar
                      </Button>
                    </div>
                  )}

                  {order.status === 'preparo' && (
                    <Button 
                      onClick={() => handleStatusUpdate(isDelivery ? 'entrega' : 'finalizado')}
                      className="w-full h-16 rounded-[24px] bg-[#1a56db] hover:bg-[#1e40af] text-white font-black uppercase italic tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                    >
                      {isDelivery ? 'Saiu para Entrega' : 'Finalizar Pedido'}
                    </Button>
                  )}

                  {order.status === 'entrega' && (
                    <Button 
                      onClick={() => handleStatusUpdate('finalizado')}
                      className="w-full h-16 rounded-[24px] bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase italic tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      Entregue & Finalizar
                    </Button>
                  )}
                  
                  {(order.status === 'finalizado' || order.status === 'cancelado') && (
                    <Button 
                      variant="outline"
                      onClick={onClose}
                      className="w-full h-14 rounded-[20px] border-slate-200 text-slate-400 font-black uppercase tracking-widest text-[11px]"
                    >
                      Fechar Detalhes
                    </Button>
                  )}
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
