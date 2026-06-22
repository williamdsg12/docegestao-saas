"use client"

import { useState, useEffect } from "react"
import { 
  X, 
  ArrowLeft, 
  Check, 
  DollarSign, 
  QrCode, 
  CreditCard, 
  ChevronDown,
  Info,
  Plus,
  Trash2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

interface OrderPaymentPanelProps {
  order: any
  isOpen: boolean
  onClose: () => void
  onUpdateStatus: (params: { orderId: string, newStatus: string }) => Promise<void>
}

interface PaymentEntry {
  method: 'dinheiro' | 'pix' | 'cartao';
  amount: number;
  change_for?: number;
  needs_change?: boolean;
}

export function OrderPaymentPanel({ order, isOpen, onClose, onUpdateStatus }: OrderPaymentPanelProps) {
  const queryClient = useQueryClient()
  
  // List of payments currently prepared for the order
  const [paymentList, setPaymentList] = useState<PaymentEntry[]>([])
  
  // State for the payment currently being added in the form
  const [currentMethod, setCurrentMethod] = useState<'dinheiro' | 'pix' | 'cartao'>('dinheiro')
  const [inputAmount, setInputAmount] = useState<string>('')
  const [needsChange, setNeedsChange] = useState(false)
  const [changeForInput, setChangeForInput] = useState<string>('')

  // Load existing payments from order if available
  useEffect(() => {
    if (order) {
      if (order.payments && order.payments.length > 0) {
        setPaymentList(
          order.payments.map((p: any) => ({
            method: (p.method || p.payment_method || 'dinheiro') as any,
            amount: Number(p.amount || 0),
            change_for: p.payment_cash?.[0]?.change_for || undefined,
            needs_change: !!p.payment_cash?.[0]?.needs_change
          }))
        )
      } else {
        setPaymentList([])
      }
    }
  }, [order, isOpen])

  if (!order) return null

  const orderTotal = Number(order.total || 0)
  const totalPaid = paymentList.reduce((sum, item) => sum + item.amount, 0)
  const remaining = Math.max(0, orderTotal - totalPaid)

  // Default input amount to remaining balance
  useEffect(() => {
    setInputAmount(remaining > 0 ? remaining.toFixed(2) : '')
  }, [remaining])

  const handleAddPayment = () => {
    const amount = Number(inputAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Por favor, informe um valor válido maior que zero.")
      return
    }

    if (amount > remaining) {
      toast.error("O valor do pagamento não pode ser maior que o saldo restante.")
      return
    }

    const entry: PaymentEntry = {
      method: currentMethod,
      amount
    }

    if (currentMethod === 'dinheiro' && needsChange) {
      const changeFor = Number(changeForInput)
      if (isNaN(changeFor) || changeFor < amount) {
        toast.error("O valor de troco deve ser maior ou igual ao valor pago em dinheiro.")
        return
      }
      entry.needs_change = true
      entry.change_for = changeFor
    }

    setPaymentList(prev => [...prev, entry])
    
    // Reset inputs
    setNeedsChange(false)
    setChangeForInput('')
    toast.success("Pagamento adicionado à lista!")
  }

  const handleRemovePayment = (index: number) => {
    setPaymentList(prev => prev.filter((_, i) => i !== index))
    toast.success("Pagamento removido.")
  }

  const handleSavePayments = async (finalize: boolean) => {
    try {
      const response = await fetch(`/api/orders/${order.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payments: paymentList,
          finalize
        })
      })

      if (!response.ok) {
        throw new Error("Erro de resposta da API")
      }

      const resData = await response.json()
      if (resData.error) throw new Error(resData.error)

      toast.success(finalize ? "Pagamentos salvos e pedido finalizado!" : "Pagamentos salvos com sucesso!")
      
      // Invalidate queries to refresh dashboard data
      if (order.tenant_id) {
        queryClient.invalidateQueries({ queryKey: ["orders", order.tenant_id] })
      }

      // Call parent update if status changed to finalized
      if (finalize) {
        await onUpdateStatus({ orderId: order.id, newStatus: "finalizado" })
      }

      onClose()
    } catch (error: any) {
      console.error("Erro ao registrar pagamentos:", error)
      toast.error(error.message || "Erro ao registrar pagamentos")
    }
  }

  // Calculate change (Troco) for display
  const cashChangeTotal = paymentList
    .filter(p => p.method === 'dinheiro' && p.needs_change && p.change_for)
    .reduce((sum, p) => sum + ((p.change_for || 0) - p.amount), 0)

  // Status mapping
  const isFullyPaid = totalPaid >= orderTotal
  const isPartiallyPaid = totalPaid > 0 && totalPaid < orderTotal

  const methodIcons = {
    dinheiro: DollarSign,
    pix: QrCode,
    cartao: CreditCard
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
            className="fixed inset-0 bg-black/35 z-[100] backdrop-blur-[2px]" 
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:max-w-[440px] bg-slate-50 shadow-2xl z-[110] flex flex-col border-l border-slate-200"
          >
            {/* Header */}
            <div className="p-6 bg-white border-b border-slate-100 flex items-center gap-4 shrink-0 shadow-sm">
               <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"><ArrowLeft size={24} /></button>
               <div className="flex flex-col">
                  <h2 className="text-xl font-black tracking-tighter uppercase italic text-slate-800 leading-none">Fluxo de Caixa / Pagamentos</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-black text-[#1a56db] uppercase">#{order.id.slice(-4).toUpperCase()}</span>
                    <Badge variant="outline" className="text-[9px] font-black uppercase italic h-4 border-slate-200 text-slate-400">
                      {order.order_type === 'delivery' ? '🛵 DELIVERY' : '🛍️ BALCÃO'}
                    </Badge>
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
               {/* Financial Summary */}
               <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Resumo Financeiro</span>
                     {isFullyPaid ? (
                       <Badge className="bg-emerald-50 text-emerald-600 border-none text-[9px] font-black uppercase italic px-3 py-1">PAGO</Badge>
                     ) : isPartiallyPaid ? (
                       <Badge className="bg-amber-50 text-amber-600 border-none text-[9px] font-black uppercase italic px-3 py-1">PARCIAL</Badge>
                     ) : (
                       <Badge className="bg-orange-50 text-orange-600 border-none text-[9px] font-black uppercase italic px-3 py-1">PENDENTE</Badge>
                     )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total do Pedido</p>
                        <p className="text-2xl font-black text-slate-800 italic">R$ {orderTotal.toFixed(2)}</p>
                     </div>
                     <div className="space-y-0.5 text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Pago</p>
                        <p className="text-2xl font-black text-emerald-500 italic">R$ {totalPaid.toFixed(2)}</p>
                     </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                     <span className="text-xs font-bold text-slate-500">Saldo Restante:</span>
                     <span className={cn("text-xl font-black italic", remaining > 0 ? "text-orange-500" : "text-emerald-500")}>
                        R$ {remaining.toFixed(2)}
                     </span>
                  </div>

                  {cashChangeTotal > 0 && (
                     <div className="bg-amber-50/50 border border-amber-100/70 p-3 rounded-2xl flex justify-between items-center text-amber-700">
                        <span className="text-[10px] font-black uppercase tracking-wider">Troco à Devolver</span>
                        <span className="font-black italic text-lg">R$ {cashChangeTotal.toFixed(2)}</span>
                     </div>
                  )}
               </div>

               {/* Current Payments List */}
               <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Pagamentos Registrados</h3>
                  {paymentList.length === 0 ? (
                     <div className="bg-slate-100/50 border-2 border-dashed border-slate-200/60 p-6 rounded-[24px] text-center">
                        <Info size={20} className="text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-500 text-xs font-medium">Nenhum pagamento registrado ainda para este pedido.</p>
                     </div>
                  ) : (
                     <div className="space-y-2">
                        {paymentList.map((entry, index) => {
                           const Icon = methodIcons[entry.method] || DollarSign;
                           return (
                              <div key={index} className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-slate-200 transition-all">
                                 <div className="flex items-center gap-3">
                                    <div className="size-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
                                       <Icon size={18} />
                                    </div>
                                    <div>
                                       <p className="text-xs font-black uppercase italic tracking-tighter text-slate-700 leading-none mb-1">
                                          {entry.method === 'dinheiro' ? 'Dinheiro' : entry.method === 'pix' ? 'PIX' : 'Cartão'}
                                       </p>
                                       {entry.needs_change && entry.change_for && (
                                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                             Troco para R$ {entry.change_for.toFixed(2)} (Troco: R$ {(entry.change_for - entry.amount).toFixed(2)})
                                          </p>
                                       )}
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <span className="font-black text-slate-800 italic text-sm">R$ {entry.amount.toFixed(2)}</span>
                                    <button 
                                       onClick={() => handleRemovePayment(index)}
                                       className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                       <Trash2 size={15} />
                                    </button>
                                 </div>
                              </div>
                           )
                        })}
                     </div>
                  )}
               </div>

               {/* Add Payment Form (Show only if remaining balance > 0) */}
               {remaining > 0 && (
                  <div className="bg-white p-5 rounded-[28px] border border-slate-200/80 shadow-md space-y-4">
                     <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Adicionar Pagamento</h3>
                     
                     {/* Method selector */}
                     <div className="grid grid-cols-3 gap-2">
                        {[
                           { id: 'dinheiro', label: 'Dinheiro', icon: DollarSign },
                           { id: 'pix', label: 'PIX', icon: QrCode },
                           { id: 'cartao', label: 'Cartão', icon: CreditCard },
                        ].map((item) => (
                           <button
                              key={item.id}
                              type="button"
                              onClick={() => setCurrentMethod(item.id as any)}
                              className={cn(
                                 "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
                                 currentMethod === item.id 
                                    ? "border-[#1a56db] bg-blue-50/50 text-[#1a56db]" 
                                    : "border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50/40"
                              )}
                           >
                              <item.icon size={20} />
                              <span className="font-black uppercase italic text-[9px] tracking-wider leading-none">{item.label}</span>
                           </button>
                        ))}
                     </div>

                     {/* Value to register */}
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Valor do Pagamento</label>
                        <Input 
                           type="number"
                           step="0.01"
                           placeholder="0.00"
                           className="h-12 bg-slate-50 border-slate-200 rounded-2xl px-4 font-black italic text-lg text-slate-800"
                           value={inputAmount}
                           onChange={(e) => setInputAmount(e.target.value)}
                        />
                     </div>

                     {/* Cash details */}
                     {currentMethod === 'dinheiro' && (
                        <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                           <div className="flex items-center gap-2 cursor-pointer" onClick={() => setNeedsChange(!needsChange)}>
                              <div className={cn(
                                 "size-5 rounded border flex items-center justify-center transition-all",
                                 needsChange ? "bg-[#1a56db] border-[#1a56db]" : "border-slate-300"
                              )}>
                                 {needsChange && <Check size={12} className="text-white" strokeWidth={4} />}
                              </div>
                              <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Cliente precisa de troco</span>
                           </div>

                           {needsChange && (
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Troco para quanto?</label>
                                 <Input 
                                    type="number"
                                    step="0.01"
                                    placeholder="R$ 100.00"
                                    className="h-10 bg-white border-slate-200 rounded-xl px-3 font-bold text-slate-800"
                                    value={changeForInput}
                                    onChange={(e) => setChangeForInput(e.target.value)}
                                 />
                              </div>
                           )}
                        </div>
                     )}

                     <Button 
                        type="button" 
                        onClick={handleAddPayment}
                        className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black uppercase text-[10px] tracking-wider gap-2 transition-all"
                     >
                        <Plus size={14} /> Adicionar Pagamento
                     </Button>
                  </div>
               )}
            </div>

            {/* Actions */}
            <div className="p-6 bg-white border-t border-slate-100 space-y-3 shrink-0 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.08)]">
               <Button 
                 variant="outline" 
                 disabled={paymentList.length === 0}
                 onClick={() => handleSavePayments(false)}
                 className="w-full h-13 rounded-2xl border-slate-200 text-slate-500 font-black uppercase italic tracking-widest text-[10px] hover:bg-slate-50 transition-colors shadow-sm"
               >
                  Salvar pagamentos (Parcial/Pendente)
               </Button>
               <Button 
                 disabled={paymentList.length === 0}
                 onClick={() => handleSavePayments(true)}
                 className="w-full h-15 rounded-[20px] bg-[#1a56db] hover:bg-[#1e40af] text-white font-black uppercase italic tracking-widest text-base shadow-lg shadow-blue-100 active:scale-95 transition-all"
               >
                  Registrar e Finalizar Pedido
               </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
