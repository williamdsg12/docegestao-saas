"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowRight, ArrowLeft, MapPin, ShoppingBag, ShoppingCart, CreditCard, QrCode, CheckCircle2, Loader2, Info, Banknote, Wallet, Plus, Smartphone } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { AddressAutocomplete } from "@/components/checkout/AddressAutocomplete"
import { PaymentFormMP } from "@/components/checkout/PaymentFormMP"
import { PaymentFormTuna } from "@/components/checkout/PaymentFormTuna"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"

interface CheckoutFlowProps {
  isOpen: boolean
  onClose: () => void
  subtotal: number
  deliveryFee: number
  total: number
   tenantId: string
  onSubmit: (data: any) => Promise<void>
  onFeeUpdate: (fee: number) => void
}

export function CheckoutFlow({ isOpen, onClose, subtotal, deliveryFee, total, tenantId, onSubmit, onFeeUpdate }: CheckoutFlowProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [phoneError, setPhoneError] = useState("")

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    cep: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    reference_point: "",
    tax_id: "",
    notes: "",
    payment_method: "pix",
    tenant_id: tenantId
  })

  const [deliveryType, setDeliveryType] = useState<"entrega" | "retirada">("entrega")
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  
  const [addressesList, setAddressesList] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [isSearchingPhone, setIsSearchingPhone] = useState(false)
  const [isNewCustomer, setIsNewCustomer] = useState(true)
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)

  const router = useRouter()

  // Trigger lookup automatically when phone reaches 11 digits
  useEffect(() => {
    const clean = customerInfo.phone.replace(/\D/g, "")
    if (clean.length === 11) {
      handleSearchCustomer(clean)
    }
  }, [customerInfo.phone])

  const handleSearchCustomer = async (cleanPhone: string) => {
    setIsSearchingPhone(true)
    try {
      const res = await fetch(`/api/customers?phone=${cleanPhone}&storeId=${tenantId}`)
      if (!res.ok) throw new Error("Search failed")
      const customer = await res.json()
      
      if (customer) {
        toast.success(`Bem-vindo de volta, ${customer.name || 'Cliente'}! 🎉`)
        
        setCustomerInfo(prev => ({
          ...prev,
          name: customer.name || "",
          phone: formatPhone(customer.phone) || prev.phone,
          cep: customer.cep || "",
          address: customer.address || "",
          number: customer.number || "",
          complement: customer.complement || "",
          neighborhood: customer.neighborhood || "",
          city: customer.city || "",
          state: customer.state || "",
          reference_point: customer.reference_point || "",
          tax_id: customer.cpf_cnpj || ""
        }))

        const list = customer.addresses || []
        setAddressesList(list)
        
        if (list.length > 0) {
          const mainAddr = list.find((a: any) => a.id !== 'synthetic-addr') || list[0]
          setSelectedAddressId(mainAddr.id)
          setCustomerInfo(prev => ({
            ...prev,
            cep: mainAddr.zip || prev.cep,
            address: mainAddr.street || prev.address,
            number: mainAddr.number || prev.number,
            complement: mainAddr.complement || prev.complement,
            neighborhood: mainAddr.neighborhood || prev.neighborhood,
            city: mainAddr.city || prev.city,
            state: mainAddr.state || prev.state,
            reference_point: mainAddr.reference || prev.reference_point
          }))
          setShowNewAddressForm(false)
        } else {
          setSelectedAddressId("customer-main")
          setShowNewAddressForm(false)
        }

        setIsNewCustomer(false)
        setStep(2)
      } else {
        setIsNewCustomer(true)
        setAddressesList([])
        setSelectedAddressId("")
        setShowNewAddressForm(true)
        setStep(2)
      }
    } catch (err) {
      console.error("Error searching customer:", err)
      toast.error("Erro ao buscar cadastro")
    } finally {
      setIsSearchingPhone(false)
    }
  }

  const logAbandonedCart = async () => {
    try {
      const slug = window.location.pathname.split('/')[2] || ""
      const cartLink = `${window.location.origin}/menu/${slug}?cart=recovered`
      await fetch('/api/checkout/abandoned-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          phone: customerInfo.phone,
          clientName: customerInfo.name,
          cartLink
        })
      })
    } catch (err) {
      console.warn("Failed to log abandoned cart:", err)
    }
  }

  const handleStep1Submit = async () => {
    const clean = customerInfo.phone.replace(/\D/g, "")
    if (clean.length < 10) {
      setPhoneError("Telefone inválido. Deve conter DDD + número.")
      return
    }
    setPhoneError("")
    await handleSearchCustomer(clean)
  }

  const handleStep2Submit = async () => {
    if (!customerInfo.name) {
      toast.error("Nome é obrigatório")
      return
    }
    if (!customerInfo.address || !customerInfo.number) {
      toast.error("Endereço e número são obrigatórios")
      return
    }
    await logAbandonedCart()
    setStep(3)
  }

  const handleBack = () => setStep(prev => prev - 1)

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 11) {
      let masked = numbers
      if (numbers.length > 2) masked = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
      if (numbers.length > 7) masked = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
      return masked
    }
    return value
  }

  const handleFinalize = (orderId: string, items: any[]) => {
    const slug = window.location.pathname.split('/')[2]
    if (slug) localStorage.removeItem(`cart_${slug}`)

    const itemsText = items.map(i => `- ${i.quantity}x ${i.name} (R$ ${i.totalItemPrice.toFixed(2)})`).join('\n')
    
    const message = `*📦 NOVO PEDIDO - DOCE GESTÃO*\n` +
      `------------------------------\n` +
      `*Pedido:* #${orderId.slice(-4).toUpperCase()}\n` +
      `*Cliente:* ${customerInfo.name}\n` +
      `*WhatsApp:* ${customerInfo.phone}\n\n` +
      `*ITENS:*\n${itemsText}\n\n` +
      `*RESUMO:*\n` +
      `Subtotal: R$ ${subtotal.toFixed(2)}\n` +
      `Taxa Entrega: R$ ${deliveryFee.toFixed(2)}\n` +
      `*TOTAL: R$ ${total.toFixed(2)}*\n\n` +
      `*PAGAMENTO:*\n` +
      `${customerInfo.payment_method.toUpperCase()}\n\n` +
      `*ENDEREÇO:*\n` +
      `${customerInfo.address}, ${customerInfo.number} - ${customerInfo.neighborhood}`

    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://api.whatsapp.com/send?phone=55${customerInfo.phone.replace(/\D/g, '')}&text=${encodedMessage}`

    onClose()
    window.location.href = whatsappUrl
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setPaymentStatus("processing")
    try {
      const slug = window.location.pathname.split('/')[2]
      const cartData = JSON.parse(localStorage.getItem(`cart_${slug}`) || "[]")

      const orderData = {
        ...customerInfo,
        delivery_type: deliveryType,
        items: cartData
      }

      const result: any = await onSubmit(orderData)
      if (result?.orderId) {
        try {
          await fetch('/api/checkout/abandoned-cart', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenantId,
              phone: customerInfo.phone
            })
          })
        } catch (recoverErr) {
          console.warn("Failed to update recovered cart:", recoverErr)
        }

        setPaymentStatus("success")
        setTimeout(() => handleFinalize(result.orderId, cartData), 1500)
      }
    } catch (err) {
      setPaymentStatus("error")
      toast.error("Erro ao processar pedido")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-xl p-0 overflow-hidden border-none shadow-2xl bg-[#F7F7F7] flex flex-col h-[100dvh] sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-[24px]">
        
        {/* 🔝 HEADER */}
        <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-20">
           <div className="flex items-center gap-3">
              {step > 1 && !isSubmitting && (
                <button onClick={handleBack} className="text-slate-400 hover:text-slate-900 transition-colors">
                   <ArrowLeft className="size-5" />
                </button>
              )}
              <DialogTitle className="text-lg font-bold text-slate-900">
                {step === 1 ? "Identificação" : step === 2 ? "Seus dados e endereço" : "Pagamento"}
              </DialogTitle>
           </div>
           {!isSubmitting && (
             <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
                <X className="size-5" />
             </Button>
           )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 text-center">
                   <div className="space-y-2">
                      <Smartphone className="size-12 mx-auto text-[#1a56db] animate-bounce" />
                      <h3 className="text-xl font-bold text-slate-900">Informe seu telefone (WhatsApp)</h3>
                      <p className="text-xs text-slate-500">Para recuperar seus dados automaticamente em futuras compras.</p>
                   </div>
                   <div className="space-y-4 text-left">
                      <div className="space-y-1.5">
                         <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Telefone (WhatsApp)</Label>
                         <Input 
                           placeholder="(00) 00000-0000" 
                           className={cn("h-14 rounded-xl bg-white border-slate-200 font-bold text-center text-lg", phoneError && "border-red-500")} 
                           value={customerInfo.phone} 
                           disabled={isSearchingPhone}
                           onChange={e => setCustomerInfo({...customerInfo, phone: formatPhone(e.target.value)})} 
                         />
                         {phoneError && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-1 text-center">{phoneError}</p>}
                      </div>
                   </div>
                   <Button 
                      disabled={customerInfo.phone.length < 14 || isSearchingPhone} 
                      onClick={handleStep1Submit} 
                      className="w-full h-14 rounded-xl bg-[#1a56db] text-white font-bold uppercase tracking-widest shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                   >
                      {isSearchingPhone ? (
                        <>
                          <Loader2 className="size-5 animate-spin" /> Buscando cadastro...
                        </>
                      ) : (
                        <>
                          Continuar <ArrowRight className="size-4" />
                        </>
                      )}
                   </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                   
                   {/* Personal Info */}
                   <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
                      <div className="flex items-center gap-3 text-slate-400">
                         <Info className="size-4" />
                         <span className="text-[10px] font-bold uppercase tracking-widest">Informações Pessoais</span>
                      </div>
                      <div className="space-y-4">
                         <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Nome Completo</Label>
                            <Input 
                              placeholder="Ex: João Silva" 
                              className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
                              value={customerInfo.name} 
                              onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} 
                            />
                         </div>
                         <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">CPF / CNPJ (Opcional)</Label>
                            <Input 
                              placeholder="000.000.000-00" 
                              className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
                              value={customerInfo.tax_id} 
                              onChange={e => setCustomerInfo({...customerInfo, tax_id: e.target.value})} 
                            />
                         </div>
                      </div>
                   </div>

                   {/* Address Selection / input */}
                   <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3 text-slate-400">
                            <MapPin className="size-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Endereço de Entrega</span>
                         </div>
                         {!isNewCustomer && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs font-bold text-[#1a56db] hover:bg-blue-50/50"
                              onClick={() => {
                                setShowNewAddressForm(prev => !prev);
                                if (!showNewAddressForm) {
                                  setSelectedAddressId("new-address");
                                } else {
                                  if (addressesList.length > 0) setSelectedAddressId(addressesList[0].id);
                                }
                              }}
                            >
                               {showNewAddressForm ? "Ver Meus Endereços" : "+ Adicionar Novo"}
                            </Button>
                         )}
                      </div>

                      {/* Display address list if returning customer */}
                      {!isNewCustomer && !showNewAddressForm && addressesList.length > 0 && (
                         <div className="space-y-2">
                            {addressesList.map((addr) => (
                               <button
                                 key={addr.id}
                                 type="button"
                                 onClick={() => {
                                   setSelectedAddressId(addr.id);
                                   setCustomerInfo(prev => ({
                                     ...prev,
                                     cep: addr.zip || prev.cep,
                                     address: addr.street || prev.address,
                                     number: addr.number || prev.number,
                                     complement: addr.complement || prev.complement,
                                     neighborhood: addr.neighborhood || prev.neighborhood,
                                     city: addr.city || prev.city,
                                     state: addr.state || prev.state,
                                     reference_point: addr.reference || prev.reference_point
                                   }));
                                 }}
                                 className={cn(
                                   "w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-start gap-3",
                                   selectedAddressId === addr.id ? "border-[#1a56db] bg-blue-50/30 text-[#1a56db]" : "border-slate-100 bg-slate-50 text-slate-600"
                                 )}
                               >
                                 <div className={cn("size-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0", selectedAddressId === addr.id ? "border-[#1a56db]" : "border-slate-300")}>
                                    {selectedAddressId === addr.id && <div className="size-2.5 rounded-full bg-[#1a56db]" />}
                                 </div>
                                 <div className="text-xs">
                                    <p className="font-bold text-slate-800">{addr.street}, {addr.number}</p>
                                    <p className="text-[10px] text-slate-500 font-medium">{addr.neighborhood} - {addr.city} {addr.complement ? `(${addr.complement})` : ''}</p>
                                 </div>
                               </button>
                            ))}
                         </div>
                      )}

                      {/* Show form when new customer or showNewAddressForm is toggled */}
                      {(isNewCustomer || showNewAddressForm) && (
                         <div className="space-y-4">
                            <div className="space-y-1.5">
                               <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Buscar Endereço</Label>
                               <AddressAutocomplete
                                 onAddressSelect={(addr) => {
                                   setCustomerInfo(prev => ({
                                     ...prev,
                                     address: addr.street || addr.formatted_address,
                                     neighborhood: addr.neighborhood,
                                     cep: addr.zip,
                                     city: addr.city,
                                     state: addr.state || prev.state,
                                     number: addr.number || prev.number
                                   }))
                                   if (addr.lat && addr.lng) onFeeUpdate(5.00) // Dummy fee
                                 }}
                                 placeholder="Digite rua, número, bairro..."
                                 className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                               />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1.5">
                                 <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Número</Label>
                                 <Input 
                                   placeholder="Número" 
                                   className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
                                   value={customerInfo.number} 
                                   onChange={e => setCustomerInfo({...customerInfo, number: e.target.value})} 
                                 />
                               </div>
                               <div className="space-y-1.5">
                                 <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Bairro</Label>
                                 <Input 
                                   placeholder="Bairro" 
                                   className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
                                   value={customerInfo.neighborhood} 
                                   onChange={e => setCustomerInfo({...customerInfo, neighborhood: e.target.value})} 
                                 />
                               </div>
                            </div>
                            <div className="space-y-1.5">
                               <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Complemento</Label>
                               <Input 
                                 placeholder="Complemento (Opcional)" 
                                 className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
                                 value={customerInfo.complement} 
                                 onChange={e => setCustomerInfo({...customerInfo, complement: e.target.value})} 
                               />
                            </div>
                            <div className="space-y-1.5">
                               <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Ponto de Referência</Label>
                               <Input 
                                 placeholder="Ponto de referência (Opcional)" 
                                 className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
                                 value={customerInfo.reference_point} 
                                 onChange={e => setCustomerInfo({...customerInfo, reference_point: e.target.value})} 
                               />
                            </div>
                         </div>
                      )}

                   </div>

                   <Button 
                      disabled={!customerInfo.name || !customerInfo.address || !customerInfo.number} 
                      onClick={handleStep2Submit} 
                      className="w-full h-14 rounded-xl bg-[#1a56db] text-white font-bold uppercase tracking-widest shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                   >
                      Confirmar informações <ArrowRight className="size-4" />
                   </Button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                   <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
                      <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                         <span className="text-sm font-bold text-slate-900">Resumo do pedido</span>
                         <span className="text-xs text-[#1a56db] font-bold cursor-pointer">Ver mais</span>
                      </div>
                      <div className="space-y-2">
                         <div className="flex justify-between text-xs text-slate-500">
                            <span>Subtotal</span>
                            <span>R$ {subtotal.toFixed(2)}</span>
                         </div>
                         <div className="flex justify-between text-xs text-slate-500">
                            <span>Taxa de entrega</span>
                            <span>R$ {deliveryFee.toFixed(2)}</span>
                         </div>
                         <div className="flex justify-between text-lg font-black italic pt-2 border-t border-slate-50">
                            <span>Total</span>
                            <span className="text-[#1a56db]">R$ {total.toFixed(2)}</span>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Como você quer pagar?</Label>
                      <div className="grid grid-cols-1 gap-3">
                         {[
                           { id: 'pix', name: 'PIX (+1% taxa)', icon: <QrCode className="size-5" /> },
                           { id: 'credit', name: 'Cartão de Crédito', icon: <CreditCard className="size-5" /> },
                           { id: 'cash', name: 'Dinheiro na entrega', icon: <Banknote className="size-5" /> }
                         ].map(opt => (
                           <button
                             key={opt.id}
                             onClick={() => setCustomerInfo({...customerInfo, payment_method: opt.id})}
                             className={cn(
                               "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left",
                               customerInfo.payment_method === opt.id ? "border-[#1a56db] bg-blue-50 text-[#1a56db]" : "border-white bg-white text-slate-400"
                             )}
                           >
                             <div className={cn("size-10 rounded-xl flex items-center justify-center", customerInfo.payment_method === opt.id ? "bg-[#1a56db] text-white" : "bg-slate-100 text-slate-400")}>
                                {opt.icon}
                             </div>
                             <span className="font-bold text-sm">{opt.name}</span>
                             <div className={cn("ml-auto size-5 rounded-full border-2 flex items-center justify-center", customerInfo.payment_method === opt.id ? "border-[#1a56db]" : "border-slate-200")}>
                                {customerInfo.payment_method === opt.id && <div className="size-2.5 rounded-full bg-[#1a56db]" />}
                             </div>
                           </button>
                         ))}
                      </div>
                   </div>

                   <Textarea 
                      placeholder="Observações (Opcional)" 
                      className="min-h-[100px] rounded-2xl bg-white border-slate-200 font-medium p-4 text-xs" 
                      value={customerInfo.notes} 
                      onChange={e => setCustomerInfo({...customerInfo, notes: e.target.value})} 
                   />

                   <Button 
                      disabled={isSubmitting || !customerInfo.payment_method} 
                      onClick={handleSubmit} 
                      className="w-full h-16 rounded-xl bg-[#1a56db] text-white font-bold uppercase tracking-widest shadow-lg shadow-blue-100 flex items-center justify-center gap-3"
                   >
                      {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <ShoppingBag className="size-5" />} Finalizar pedido
                   </Button>
                </motion.div>
              )}
           </AnimatePresence>
        </div>

      </DialogContent>
    </Dialog>
  )
}

function TrocoContent({ total, onComplete }: { total: number, onComplete: (data: any) => void }) {
  const [step, setStep] = useState(1)
  const [valorPago, setValorPago] = useState("")
  const [error, setError] = useState("")

  const diff = Number(valorPago) - total
  const troco = diff > 0 ? diff : 0

  const handleFinish = () => {
    if (step === 1) {
      onComplete({ precisa_troco: false, valor_pago: total, troco: 0 })
    } else {
      const val = Number(valorPago)
      if (val <= total) {
        setError("O valor deve ser maior que o total")
        return
      }
      onComplete({ precisa_troco: true, valor_pago: val, troco: troco })
    }
  }

  return (
    <div className="flex flex-col">
      <div className="p-8 bg-slate-900 text-white text-center space-y-2">
        <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Precisa de <span className="text-red-500">Troco?</span></DialogTitle>
        <VisuallyHidden.Root>
          <DialogDescription>Opção para informar se o cliente precisa de troco para pagamento em dinheiro.</DialogDescription>
        </VisuallyHidden.Root>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Informe se você precisa de troco para o pagamento era dinheiro</p>
      </div>

      <div className="p-8 space-y-6">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="q" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex flex-col items-center justify-center p-8 rounded-[32px] border-2 border-slate-100 hover:border-red-500 hover:bg-red-50 transition-all gap-3 group"
              >
                <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-red-500 transition-colors">
                  <CheckCircle2 className="size-6" />
                </div>
                <span className="font-black uppercase text-[11px] tracking-widest text-slate-900">Sim, Preciso</span>
              </button>
              <button
                onClick={handleFinish}
                className="flex flex-col items-center justify-center p-8 rounded-[32px] border-2 border-slate-100 hover:border-slate-900 hover:bg-slate-50 transition-all gap-3 group"
              >
                <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-slate-900 transition-colors">
                  <X className="size-6" />
                </div>
                <span className="font-black uppercase text-[11px] tracking-widest text-slate-900">Não Preciso</span>
              </button>
            </motion.div>
          ) : (
            <motion.div key="input" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Troco para quanto?</Label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300">R$</div>
                  <Input
                    type="number"
                    autoFocus
                    placeholder="Ex: 50.00"
                    value={valorPago}
                    onChange={e => {
                      setValorPago(e.target.value)
                      setError("")
                    }}
                    className="h-20 rounded-[32px] bg-slate-50 border-none pl-14 text-2xl font-black italic"
                  />
                </div>
                {error && <p className="text-[10px] font-bold text-red-500 text-center uppercase tracking-widest">{error}</p>}
              </div>

              {troco > 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-6 rounded-[24px] bg-emerald-50 border border-emerald-100 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Seu troco será de</p>
                  <p className="text-4xl font-black italic tracking-tighter text-emerald-700">R$ {troco.toFixed(2)}</p>
                </motion.div>
              )}

              <div className="flex gap-4">
                <Button variant="ghost" className="flex-1 h-16 rounded-2xl font-black uppercase text-[11px] tracking-widest" onClick={() => setStep(1)}>Voltar</Button>
                <Button
                  onClick={handleFinish}
                  disabled={!valorPago || Number(valorPago) <= total}
                  className="flex-[2] h-16 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black uppercase italic tracking-widest shadow-xl"
                >
                  PRONTO
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
