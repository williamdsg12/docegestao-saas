"use client"

import { useState } from "react"
import { 
  X, 
  ArrowLeft, 
  Check, 
  DollarSign, 
  QrCode, 
  CreditCard, 
  ChevronDown,
  Info
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface OrderPaymentPanelProps {
  order: any
  isOpen: boolean
  onClose: () => void
  onUpdateStatus: (params: { orderId: string, newStatus: string }) => Promise<void>
}

export function OrderPaymentPanel({ order, isOpen, onClose, onUpdateStatus }: OrderPaymentPanelProps) {
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix' | 'cartao'>('dinheiro')
  const [amountReceived, setAmountReceived] = useState<string>('')
  const [isPendenteChecked, setIsPendenteChecked] = useState(false)
  
  if (!order) return null

  const subtotal = Number(order.total || 0)
  const pixTax = paymentMethod === 'pix' ? subtotal * 0.01 : 0
  const total = subtotal + pixTax
  
  const received = amountReceived ? Number(amountReceived) : total
  const troco = received > total ? received - total : 0

  const handlePayment = async (finalize: boolean) => {
    try {
      // In a real app, you'd call an API to register the payment
      if (finalize) {
        await onUpdateStatus({ orderId: order.id, newStatus: "finalizado" })
      }
      
      toast.success(finalize ? "Pagamento registrado e pedido finalizado!" : "Pagamento registrado!")
      onClose()
    } catch (error) {
      toast.error("Erro ao registrar pagamento")
    }
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
            className="fixed inset-0 bg-black/30 z-[100] backdrop-blur-[1px]" 
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:max-w-[420px] bg-white shadow-2xl z-[110] flex flex-col border-l border-slate-200"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center gap-4 shrink-0">
               <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"><ArrowLeft size={24} /></button>
               <div className="flex flex-col">
                  <h2 className="text-xl font-black tracking-tighter uppercase italic text-slate-800 leading-none">Registrar pagamento</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-black text-[#1a56db] uppercase">#{order.id.slice(-4).toUpperCase()}</span>
                    <Badge variant="outline" className="text-[9px] font-black uppercase italic h-4 border-slate-200 text-slate-400">
                      {order.order_type === 'delivery' ? '🛵 DELIVERY' : '🛍️ BALCÃO'}
                    </Badge>
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10">
               {/* Resumo Financeiro */}
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest italic">Total</span>
                     <Badge className="bg-orange-50 text-[#ea580c] border-none text-[9px] font-black uppercase italic px-3 py-1">NÃO PAGO</Badge>
                  </div>
                  <div className="flex justify-between items-start">
                     <div className="space-y-1">
                        <p className="text-5xl font-black text-slate-800 tracking-tighter italic leading-none">R$ {total.toFixed(2)}</p>
                        {pixTax > 0 && <p className="text-[10px] font-bold text-[#1a56db] uppercase italic">+ Taxa PIX (1%): R$ {pixTax.toFixed(2)}</p>}
                     </div>
                     <div className="text-right space-y-1 pt-1">
                        <p className="text-[11px] font-black text-emerald-500 uppercase italic leading-none">Pago: R$ 0,00</p>
                        <p className="text-[11px] font-black text-[#ea580c] uppercase italic leading-none">Resta: R$ {total.toFixed(2)}</p>
                     </div>
                  </div>
               </div>

               {/* Salvar como pendente */}
               <div 
                onClick={() => setIsPendenteChecked(!isPendenteChecked)}
                className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors shadow-sm"
               >
                  <div className="flex items-center gap-4">
                     <div className={cn(
                        "size-6 rounded-lg border-2 flex items-center justify-center transition-all",
                        isPendenteChecked ? "bg-[#1a56db] border-[#1a56db]" : "border-slate-200"
                     )}>
                        {isPendenteChecked && <Check size={14} className="text-white" strokeWidth={4} />}
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800 uppercase italic text-[11px] tracking-widest leading-none">Salvar como pendente</span>
                        <Info size={16} className="text-slate-300" />
                     </div>
                  </div>
                  <X size={20} className="text-slate-300" />
               </div>

               {/* Formas de Pagamento */}
               <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-3">
                     {[
                        { id: 'dinheiro', label: 'Dinheiro', icon: DollarSign },
                        { id: 'pix', label: 'PIX +1%', icon: QrCode },
                        { id: 'cartao', label: 'Cartão', icon: CreditCard },
                     ].map((item) => (
                        <button
                           key={item.id}
                           onClick={() => setPaymentMethod(item.id as any)}
                           className={cn(
                              "flex flex-col items-center gap-3 p-5 rounded-[24px] border-2 transition-all",
                              paymentMethod === item.id 
                                 ? "border-[#1a56db] bg-blue-50 text-[#1a56db] shadow-xl shadow-blue-900/5" 
                                 : "border-slate-100 text-slate-400 hover:border-slate-200"
                           )}
                        >
                           <div className="relative">
                              <item.icon size={28} />
                              {paymentMethod === item.id && (
                                 <div className="absolute -top-1 -right-1 size-5 bg-[#1a56db] text-white rounded-full flex items-center justify-center border-2 border-white">
                                    <Check size={10} strokeWidth={4} />
                                 </div>
                              )}
                           </div>
                           <span className="font-black uppercase italic text-[10px] tracking-widest leading-none">{item.label}</span>
                        </button>
                     ))}
                  </div>
                  <button className="w-full h-14 rounded-2xl border-2 border-slate-100 flex items-center justify-between px-8 text-slate-400 hover:bg-slate-50 transition-colors">
                     <span className="font-black uppercase italic text-[10px] tracking-widest">Outras formas de pagamento</span>
                     <ChevronDown size={20} />
                  </button>
               </div>

               {/* Campos de Valor */}
               <div className="space-y-8">
                  <div className="space-y-3">
                     <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest italic ml-1">Pagar</label>
                     <div className="flex items-center gap-2 bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden pr-4 focus-within:ring-2 ring-blue-100 transition-all">
                        <Input 
                           className="h-16 border-none bg-transparent font-black italic text-3xl text-slate-800 px-8"
                           value={total.toFixed(2)}
                           readOnly
                        />
                        <button className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-400 flex items-center gap-1.5 shadow-sm">
                           <span className="font-black text-base">÷</span>
                           <ChevronDown size={14} />
                        </button>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest italic ml-1">Quantidade entregue</label>
                     <Input 
                        className="h-16 bg-slate-50 border-slate-100 rounded-3xl px-8 font-black italic text-3xl text-slate-800 focus:ring-2 ring-blue-100 transition-all"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        placeholder={total.toFixed(2)}
                     />
                  </div>

                  <div className="p-6 bg-orange-50 rounded-[32px] border border-orange-100 flex items-center justify-between shadow-sm">
                     <span className="text-[#ea580c] font-black uppercase italic text-xs tracking-widest">Troco</span>
                     <span className="text-[#ea580c] font-black text-4xl italic tracking-tighter">R$ {troco.toFixed(2)}</span>
                  </div>
               </div>
            </div>

            {/* Ações Finais */}
            <div className="p-8 bg-white border-t border-slate-100 space-y-4 shrink-0 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
               <Button 
                variant="outline" 
                onClick={() => handlePayment(false)}
                className="w-full h-14 rounded-2xl border-slate-200 text-slate-500 font-black uppercase italic tracking-widest text-[11px] hover:bg-slate-50 transition-colors"
               >
                  Registrar pagamento
               </Button>
               <Button 
                onClick={() => handlePayment(true)}
                className="w-full h-18 rounded-[28px] bg-[#1a56db] hover:bg-[#1e40af] text-white font-black uppercase italic tracking-widest text-lg shadow-2xl shadow-blue-100 active:scale-95 transition-all"
               >
                  Registrar pagamento e finalizar
               </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
