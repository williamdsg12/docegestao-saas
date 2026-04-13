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
}

export function CheckoutFlow({ isOpen, onClose, subtotal, deliveryFee, total, tenantId, onSubmit }: CheckoutFlowProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    cep: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    tax_id: "",
    notes: "",
    payment_method: "pix",
    tenant_id: tenantId,
    cliente_id: ""
  })
  const [deliveryType, setDeliveryType] = useState<"entrega" | "retirada">("entrega")
  const [paymentMode, setPaymentMode] = useState<"online" | "entrega">("online")
  const [showTrocoModal, setShowTrocoModal] = useState(false)
  const [changeData, setChangeData] = useState({
    precisa_troco: false,
    valor_pago: 0,
    troco: 0
  })


  // Payment states
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "pending_pix" | "awaiting_card" | "success" | "error">("idle")
  const [pixData, setPixData] = useState<any>(null)
  const [orderCreated, setOrderCreated] = useState<any>(null)
  const [paymentProvider, setPaymentProvider] = useState<"mercadopago" | "tuna">("mercadopago")

  const router = useRouter()
  const [isPolling, setIsPolling] = useState(false)

  // Polling for PIX payment status
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (paymentStatus === "pending_pix" && orderCreated) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/payments/status?orderId=${orderCreated.id}`);
          const data = await res.json();

          if (data.status === 'approved') {
            clearInterval(interval);
            setPaymentStatus("success");
            toast.success("Pagamento aprovado!");
            // Finalize order automatically
            setTimeout(() => handleFinalize(orderCreated.id), 2000);
          }
        } catch (error) {
          console.error("Polling error:", error);
        }
      }, 5000); // Check every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    }
  }, [paymentStatus, orderCreated]);

  const handleNext = () => setStep(prev => prev + 1)
  const handleBack = () => setStep(prev => prev - 1)

  // Fetch payment provider
  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const res = await fetch(`/api/payments/pix?tenant_id=${tenantId}&check_only=true`);
        const data = await res.json();
        if (data.provider) {
          setPaymentProvider(data.provider);
        }
      } catch (err) {
        console.error("Error fetching provider:", err);
      }
    };
    if (tenantId) fetchProvider();
  }, [tenantId]);


  const handleFinalize = (orderId: string) => {
    // 1. Clear cart in localStorage
    const slug = window.location.pathname.split('/')[2];
    if (slug) {
      localStorage.removeItem(`cart_${slug}`);
    }

    // 2. Format WhatsApp message
    const message = `Olá! Acabei de fazer um pedido.\nPedido ID: ${orderId}\nNome: ${customerInfo.name}\nTotal: R$ ${total.toFixed(2)}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/55${customerInfo.phone.replace(/\D/g, '')}?text=${encodedMessage}`;

    // 3. Close modal and redirect
    onClose();
    window.location.href = whatsappUrl;
  };


  const handleSubmit = async () => {
    setIsSubmitting(true)
    setPaymentStatus("processing")
    try {
      const orderData = {
        ...customerInfo,
        delivery_type: deliveryType,
        precisa_troco: changeData.precisa_troco,
        valor_pago: changeData.valor_pago,
        troco: changeData.troco,
        items: [] // This should be passed from parent or handled by onSubmit prop
      }

      // If online payment, we first create the order, then handle payment
      // However, the 'onSubmit' prop from the parent likely handles order creation
      // We need to check what 'onSubmit' returns

      const result: any = await onSubmit(orderData)

      if (result?.orderId) {
        setOrderCreated({ id: result.orderId, total: total, tenantId: customerInfo.tenant_id || (window as any).__TENANT_ID__ })

        if (customerInfo.payment_method === 'pix_online') {
          // Generate Pix
          const pixRes = await fetch('/api/payments/pix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: result.orderId,
              amount: total,
              tenant_id: customerInfo.tenant_id || (window as any).__TENANT_ID__,
              customer_email: `${customerInfo.phone}@docegestao.com.br`,
              customer_name: customerInfo.name
            })
          })

          const pixJson = await pixRes.json()
          if (pixJson.qr_code_base64) {
            setPixData(pixJson)
            setPaymentStatus("pending_pix")
          } else {
            toast.error("Erro ao gerar PIX")
            setPaymentStatus("error")
          }
        } else if (customerInfo.payment_method === 'credit_card_online') {
          // Show Card Form step
          setPaymentStatus("awaiting_card")
        } else {
          // Offline payment - direct success after order creation
          setPaymentStatus("success")
          setTimeout(() => {
            handleFinalize(result.orderId);
          }, 1500);
        }
      }
    } catch (err) {
      console.error("Order error:", err)
      setPaymentStatus("error")
      toast.error("Erro ao processar pedido")
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { title: "Identificação", icon: <Info className="size-4" /> },
    { title: "Entrega", icon: <MapPin className="size-4" /> },
    { title: "Pagamento", icon: <CreditCard className="size-4" /> }
  ]

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && (paymentStatus === "pending_pix" || paymentStatus === "awaiting_card" || isSubmitting)) {
          return // Block closing
        }
        if (!open) onClose()
      }}
    >
      <DialogContent
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement;
          // Block click outside if in critical payment state
          if (paymentStatus === "pending_pix" || paymentStatus === "awaiting_card" || isSubmitting) {
            e.preventDefault();
            return;
          }
          if (target?.closest('.pac-container')) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (paymentStatus === "pending_pix" || paymentStatus === "awaiting_card" || isSubmitting) {
            e.preventDefault();
            return;
          }
          if (target?.closest('.pac-container')) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (paymentStatus === "pending_pix" || paymentStatus === "awaiting_card" || isSubmitting) {
            e.preventDefault();
          }
        }}
        className="sm:max-w-xl p-0 overflow-hidden border-none shadow-2xl bg-white flex flex-col max-h-[90vh] rounded-[32px]"
      >
        {/* Header */}
        <div className="p-6 md:p-8 bg-slate-900 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 size-40 bg-red-500 rounded-full blur-[80px] opacity-20" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <DialogTitle className="text-xl md:text-2xl font-black italic uppercase tracking-tighter leading-none">
                Finalizar <span className="text-red-500">Pedido</span>
              </DialogTitle>
              <VisuallyHidden.Root>
                <DialogDescription>Fluxo de finalização de pedido com dados do cliente e pagamento.</DialogDescription>
              </VisuallyHidden.Root>
              {!isSubmitting && (
                <Button variant="ghost" size="icon" className="bg-white/10 hover:bg-white/20 text-white rounded-full size-8 transition-all" onClick={onClose}>
                  <X className="size-4" />
                </Button>
              )}
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center justify-between gap-4 mt-6">
              {steps.map((s, i) => {
                const num = i + 1
                return (
                  <div key={num} className="flex-1 flex flex-col gap-2">
                    <div className={cn(
                      "h-1 w-full rounded-full transition-all duration-500",
                      step >= num ? "bg-red-500" : "bg-slate-800"
                    )} />
                    <div className="flex items-center gap-1">
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-widest transition-colors duration-500",
                        step >= num ? "text-red-500" : "text-slate-500"
                      )}>
                        {s.title}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 flex-1 overflow-y-auto no-scrollbar relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {paymentStatus === "idle" ? (
              <div key="steps-wrapper" className="space-y-6">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Seu Nome</Label>
                        <Input
                          placeholder="Como podemos te chamar?"
                          className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6 focus-visible:ring-2 focus-visible:ring-red-500/20 shadow-inner"
                          value={customerInfo.name}
                          onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">WhatsApp</Label>
                        <Input
                          placeholder="(00) 00000-0000"
                          className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6 focus-visible:ring-2 focus-visible:ring-red-500/20 shadow-inner"
                          value={customerInfo.phone}
                          onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <Button
                      disabled={!customerInfo.name || !customerInfo.phone}
                      onClick={handleNext}
                      className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase italic tracking-[0.1em] shadow-xl mt-8 transition-all active:scale-95 flex items-center justify-between px-6"
                    >
                      Continuar <ArrowRight className="size-4" />
                    </Button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo de Pedido</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setDeliveryType('entrega')}
                          className={cn(
                            "flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all gap-2",
                            deliveryType === 'entrega' ? "border-red-500 bg-red-50 text-red-500 shadow-md scale-[1.02]" : "border-slate-100 bg-slate-50 text-slate-400"
                          )}
                        >
                          <ShoppingCart className="size-5 mb-1" />
                          <span className="font-black uppercase text-[10px] tracking-widest leading-none">Entrega</span>
                        </button>

                        <button
                          onClick={() => setDeliveryType('retirada')}
                          className={cn(
                            "flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all gap-2",
                            deliveryType === 'retirada' ? "border-red-500 bg-red-50 text-red-500 shadow-md scale-[1.02]" : "border-slate-100 bg-slate-50 text-slate-400"
                          )}
                        >
                          <ShoppingBag className="size-5 mb-1" />
                          <span className="font-black uppercase text-[10px] tracking-widest leading-none">Retirada</span>
                        </button>
                      </div>
                    </div>

                    {deliveryType === 'entrega' ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Buscar Endereço e Número</Label>
                          <AddressAutocomplete
                            onAddressSelect={(addr) => {
                              setCustomerInfo(prev => ({
                                ...prev,
                                address: addr.street || addr.formatted_address,
                                neighborhood: addr.neighborhood,
                                cep: addr.zip,
                                number: addr.number || prev.number
                              }))
                            }}
                            placeholder="Ex: Rua das Flores, 123"
                            className="h-14 rounded-2xl bg-white border-2 border-slate-100 px-6 font-bold text-slate-700 focus:border-red-200"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Número</Label>
                            <Input
                              placeholder="Nº"
                              className="h-12 rounded-xl bg-slate-50 border-none font-bold px-4"
                              value={customerInfo.number}
                              onChange={e => setCustomerInfo({ ...customerInfo, number: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Bairro</Label>
                            <Input
                              placeholder="Ex: Centro"
                              className="h-12 rounded-xl bg-slate-50 border-none font-bold px-4"
                              value={customerInfo.neighborhood}
                              onChange={e => setCustomerInfo({ ...customerInfo, neighborhood: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Complemento / Ref. (Opcional)</Label>
                          <Input
                            placeholder="Ex: Bloco A, Apt 101"
                            className="h-12 rounded-xl bg-slate-50 border-none font-bold px-4"
                            value={customerInfo.complement}
                            onChange={e => setCustomerInfo({ ...customerInfo, complement: e.target.value })}
                          />
                        </div>
                      </motion.div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
                        <CheckCircle2 className="size-6 text-emerald-500 mx-auto mb-2" />
                        <h4 className="text-sm font-black text-emerald-700 uppercase italic tracking-tighter">Retirar no Balcão</h4>
                        <p className="text-[11px] text-emerald-600/70 font-bold max-w-[200px] mx-auto mt-1 leading-relaxed">Você economiza a taxa de entrega!</p>
                      </div>
                    )}

                    <div className="flex gap-4 pt-4">
                      <Button variant="ghost" className="h-14 px-6 rounded-2xl text-slate-400 font-black uppercase text-[10px] tracking-widest shadow-sm border border-slate-50" onClick={handleBack}>Voltar</Button>
                      <Button
                        disabled={deliveryType === "entrega" && (!customerInfo.address || !customerInfo.number)}
                        onClick={handleNext}
                        className="flex-1 h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase italic tracking-[0.1em] shadow-xl transition-all active:scale-95 flex items-center justify-between px-6"
                      >
                        Pagamento <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex border-b border-slate-100 mb-2">
                      <button onClick={() => setPaymentMode('online')} className={cn("flex-1 pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative", paymentMode === 'online' ? "text-red-500" : "text-slate-400")}>
                        Pague pelo site
                        {paymentMode === 'online' && <motion.div layoutId="modeBar" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />}
                      </button>
                      <button onClick={() => setPaymentMode('entrega')} className={cn("flex-1 pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative", paymentMode === 'entrega' ? "text-red-500" : "text-slate-400")}>
                        Pague na entrega
                        {paymentMode === 'entrega' && <motion.div layoutId="modeBar" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />}
                      </button>
                    </div>

                    <AnimatePresence mode="wait">
                      {paymentMode === 'online' ? (
                        <motion.div key="online" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                          <button onClick={() => setCustomerInfo({ ...customerInfo, payment_method: 'pix_online' })} className={cn("w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all group", customerInfo.payment_method === 'pix_online' ? "border-red-500 bg-red-50/50 shadow-sm" : "border-slate-50 bg-white hover:border-slate-100")}>
                            <div className="size-12 bg-white rounded-xl shadow-sm border border-slate-50 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform"><QrCode className="size-6" /></div>
                            <div className="flex-1 text-left"><p className="font-black uppercase text-[11px] text-slate-900 tracking-wider">Pague com Pix</p><p className="text-[10px] font-bold text-slate-400 leading-tight">Use o QR Code ou copie e cole o código</p></div>
                            <div className={cn("size-5 rounded-full border-2 flex items-center justify-center transition-all", customerInfo.payment_method === 'pix_online' ? "border-red-500 bg-red-500" : "border-slate-200")}>{customerInfo.payment_method === 'pix_online' && <div className="size-1.5 rounded-full bg-white" />}</div>
                          </button>
                          <button onClick={() => setCustomerInfo({ ...customerInfo, payment_method: 'credit_card_online' })} className={cn("w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all group", customerInfo.payment_method === 'credit_card_online' ? "border-red-500 bg-red-50/50 shadow-sm" : "border-slate-50 bg-white hover:border-slate-100")}>
                            <div className="size-12 bg-white rounded-xl shadow-sm border border-slate-50 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform"><CreditCard className="size-6" /></div>
                            <div className="flex-1 text-left"><p className="font-black uppercase text-[11px] text-slate-900 tracking-wider">Cartão de Crédito</p><p className="text-[10px] font-bold text-slate-400 leading-tight">Pague agora com total segurança</p></div>
                            <div className={cn("size-5 rounded-full border-2 flex items-center justify-center transition-all", customerInfo.payment_method === 'credit_card_online' ? "border-red-500 bg-red-500" : "border-slate-200")}>{customerInfo.payment_method === 'credit_card_online' && <div className="size-1.5 rounded-full bg-white" />}</div>
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div key="delivery" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'dinheiro', name: 'Dinheiro', icon: <Banknote className="size-4" /> },
                            { id: 'master_debito', name: 'Mastercard - Débito', icon: <Wallet className="size-4" /> },
                            { id: 'visa_debito', name: 'Visa - Débito', icon: <Wallet className="size-4" /> },
                            { id: 'elo_debito', name: 'Elo - Débito', icon: <Wallet className="size-4" /> },
                            { id: 'visa_credito', name: 'Visa - Crédito', icon: <CreditCard className="size-4" /> },
                            { id: 'master_credito', name: 'Mastercard - Crédito', icon: <CreditCard className="size-4" /> },
                            { id: 'elo_credito', name: 'Elo - Crédito', icon: <CreditCard className="size-4" /> },
                          ].map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => { setCustomerInfo({ ...customerInfo, payment_method: opt.id }); if (opt.id === 'dinheiro') setShowTrocoModal(true); }}
                              className={cn("flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all", customerInfo.payment_method === opt.id ? "border-red-500 bg-red-50/50 text-red-600 shadow-sm" : "border-slate-50 bg-slate-50 text-slate-400")}
                            >
                              <div className={cn("shrink-0 transition-colors", customerInfo.payment_method === opt.id ? "text-red-500" : "text-slate-400")}>{opt.icon}</div>
                              <span className="font-black uppercase text-[9px] tracking-widest leading-tight">{opt.name}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-600"><span>Resumo</span><span>{total.toFixed(2)}</span></div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200"><span className="text-xs font-black uppercase text-slate-900">Total</span><span className="text-3xl font-black italic text-red-500">R$ {total.toFixed(2)}</span></div>
                    </div>

                    <div className="space-y-4">
                      <Input placeholder="CPF na nota" className="h-14 rounded-2xl bg-white border-2 border-slate-100 px-6 font-bold" value={customerInfo.tax_id} onChange={e => setCustomerInfo({ ...customerInfo, tax_id: e.target.value })} />
                      <Textarea placeholder="Observações" className="min-h-[80px] rounded-2xl bg-white border-2 border-slate-100 font-medium p-4 text-xs" value={customerInfo.notes} onChange={e => setCustomerInfo({ ...customerInfo, notes: e.target.value })} />
                    </div>

                    <div className="flex gap-4 pt-4 pb-4">
                      <Button variant="ghost" className="h-14 px-6 rounded-2xl text-slate-400 font-black uppercase text-[10px] tracking-widest" onClick={handleBack}>Voltar</Button>
                      <Button disabled={isSubmitting || !customerInfo.payment_method} onClick={handleSubmit} className="flex-1 h-14 md:h-16 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black uppercase italic tracking-[0.1em] shadow-xl flex items-center justify-center gap-3">
                        {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 className="size-5" />}Fazer Pedido
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <motion.div key="status-screens" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
                {paymentStatus === "processing" && (
                  <div className="flex flex-col items-center gap-4"><Loader2 className="size-12 animate-spin text-red-500" /><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Processando...</p></div>
                )}
                {paymentStatus === "pending_pix" && pixData && (
                  <div className="flex flex-col items-center text-center space-y-6 w-full">
                    <div className="size-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500"><QrCode className="size-10" /></div>
                    <div className="space-y-2"><h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Aguardando Pagamento</h3><p className="text-[10px] font-bold text-slate-400 max-w-xs mx-auto">Escaneie o código Pix abaixo.</p></div>
                    <div className="p-4 bg-white rounded-3xl border-4 border-slate-50 shadow-xl mx-auto"><QRCodeSVG value={pixData.qr_code} size={200} /></div>
                    <div className="w-full space-y-3 px-4">
                      <Button onClick={() => { navigator.clipboard.writeText(pixData.qr_code); toast.success("Copiado!"); }} className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest">Copiar Chave Pix</Button>
                      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic animate-pulse">Confirmado automaticamente após o pagamento</p>
                    </div>
                  </div>
                )}
                {paymentStatus === "awaiting_card" && orderCreated && (
                  <div className="w-full">
                    {paymentProvider === "tuna" ? (
                      <PaymentFormTuna
                        amount={total}
                        orderId={orderCreated.id}
                        tenantId={orderCreated.tenantId}
                        customerEmail={`${customerInfo.phone}@docegestao.com.br`}
                        customerName={customerInfo.name}
                        onSuccess={() => {
                          setPaymentStatus("success");
                          toast.success("Pagamento aprovado!");
                          setTimeout(() => handleFinalize(orderCreated.id), 2000);
                        }}
                        onCancel={() => {
                          setPaymentStatus("idle");
                        }}
                      />
                    ) : (
                      <PaymentFormMP
                        amount={total}
                        orderId={orderCreated.id}
                        tenantId={orderCreated.tenantId}
                        customerEmail={`${customerInfo.phone}@docegestao.com.br`}
                        onSuccess={() => {
                          setPaymentStatus("success");
                          toast.success("Pagamento aprovado!");
                          setTimeout(() => handleFinalize(orderCreated.id), 2000);
                        }}
                        onCancel={() => {
                          setOrderCreated(null);
                          setPaymentStatus("idle");
                        }}
                      />
                    )}
                  </div>
                )}
                {paymentStatus === "success" && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center space-y-6 py-12 w-full">
                    <div className="size-24 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-100"><CheckCircle2 className="size-12" /></div>
                    <div className="space-y-2"><h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">Sucesso!</h3><p className="text-[11px] font-bold text-slate-400 max-w-xs mx-auto">Seu pedido já está sendo preparado.</p></div>
                    <Button onClick={onClose} className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black uppercase italic tracking-widest">Acompanhar Pedido</Button>
                  </motion.div>
                )}
                {paymentStatus === "error" && (
                  <div className="flex flex-col items-center text-center space-y-4"><div className="size-20 bg-red-100 rounded-full flex items-center justify-center text-red-500"><X className="size-10" /></div><h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Erro</h3><p className="text-[10px] font-bold text-slate-400">Problema ao processar pedido.</p><Button onClick={() => setPaymentStatus("idle")} variant="outline" className="rounded-xl font-black uppercase text-[10px] tracking-widest">Tentar Novamente</Button></div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>

      {/* Modern Change (Troco) Modal */}
      <Dialog open={showTrocoModal} onOpenChange={setShowTrocoModal}>
        <DialogContent className="sm:max-w-md rounded-[40px] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <TrocoContent total={total} onComplete={(data) => {
            setChangeData(data)
            setShowTrocoModal(false)
          }} />
        </DialogContent>
      </Dialog>
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
