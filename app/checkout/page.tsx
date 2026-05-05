"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useBusiness } from "@/hooks/useBusiness"
import { supabase } from "@/lib/supabase"
import { PaymentFormMP } from "@/components/checkout/PaymentFormMP"
import { AddressAutocomplete } from "@/components/checkout/AddressAutocomplete"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  ShoppingBag, 
  Truck, 
  CreditCard, 
  DollarSign,
  CheckCircle2, 
  ChevronRight,
  MapPin,
  Clock,
  AlertCircle,
  Zap,
  RefreshCcw,
  Copy,
  Check,
  QrCode,
  ArrowRight,
  Loader2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { isStoreOpen } from "@/lib/storeStatus"

export default function CheckoutPage() {
  const router = useRouter()
  const { business, profile, loadingBusiness } = useBusiness()
   const [address, setAddress] = useState<any>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null)
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null)
  const [deliveryFee, setDeliveryFee] = useState<number>(0)
  const [cart, setCart] = useState<any[]>([])
  const [isCalculating, setIsCalculating] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
    payment_method: "pix", // pix, money, card_on_delivery, stripe
    change_for: 0 as number | string,
    complement: ""
  })
  const [step, setStep] = useState(1) // 1: Identificação, 2: Entrega, 3: Pagamento
  const [isManualAddress, setIsManualAddress] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [businessFromMenu, setBusinessFromMenu] = useState<any>(null)

  const storeStatus = isStoreOpen(business || businessFromMenu)

  // Load cart and business from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('checkout_cart')
    const savedBusiness = localStorage.getItem('checkout_company')
    
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
    if (savedBusiness) {
      setBusinessFromMenu(JSON.parse(savedBusiness))
    }
  }, [])

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart])
  const total = subtotal + deliveryFee

  const calculateFee = useCallback(async (selectedAddress: any) => {
    if (!selectedAddress) {
      console.warn("calculateFee called without address");
      return;
    }

    try {
      setIsCalculating(true)
      
      const hasCoords = selectedAddress.lat != null && selectedAddress.lng != null;

      if (!hasCoords) {
        // Manual address fallback
        setDistance(null)
        setDeliveryFee(0)
        setAddress({
          ...selectedAddress,
          estimated_time: "45-60"
        })
        toast.info("Endereço manual: Taxa de entrega zerada (ajuste se necessário).")
        return
      }

      const res = await fetch('/api/calculate-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lat: selectedAddress.lat, 
          lng: selectedAddress.lng,
          city: selectedAddress.city 
        })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP ${res.status}`);
      }

      const data = await res.json()

      setDistance(data.distance)
      setDeliveryFee(data.fee)
      setEstimatedTime(data.time)
      setDurationMinutes(data.durationMinutes)
      
      setAddress({
        ...selectedAddress,
        estimated_time: data.time
      })
      
    } catch (err: any) {
      console.error("Fee calculation error:", err)
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Erro ao calcular frete: ${msg !== "undefined" ? msg : "Erro desconhecido"}`)
    } finally {
      setIsCalculating(false)
    }
  }, [])

  const validateForm = () => {
    if (!customerInfo.name.trim()) {
      toast.error("Por favor, informe seu nome completo")
      return false
    }
    if (!customerInfo.phone.trim() || customerInfo.phone.length < 10) {
      toast.error("Por favor, informe um WhatsApp válido")
      return false
    }
    if (!address) {
      toast.error("Por favor, informe seu endereço de entrega")
      setStep(2) // Jump to address step if missing
      return false
    }
    if (cart.length === 0) {
      toast.error("Sua sacola está vazia")
      return false
    }
    return true
  }

  const handleFinalizeOrder = async () => {
    if (!storeStatus.isOpen) {
      toast.error(storeStatus.reason)
      return
    }
    if (!validateForm()) return

    try {
      setIsSubmitting(true)

      const effectiveTenantId = businessFromMenu?.id || business?.id || profile?.tenant_id
      if (!effectiveTenantId) {
        throw new Error("ID da loja não encontrado. Recarregue a página.")
      }

      // 1. Prepare data for the Transactional RPC (Relational Model v12)
      const rpcParams = {
        p_tenant_id: effectiveTenantId,
        p_customer: {
          name: customerInfo.name,
          phone: customerInfo.phone,
          email: customerInfo.email
        },
        p_address: {
          street: address.street,
          number: address.number,
          neighborhood: address.neighborhood,
          city: address.city,
          complement: customerInfo.complement,
          zip: address.zip
        },
        p_order: {
          total: total,
          status: 'pending',
          order_type: (distance || 0) > 0 ? 'delivery' : 'pickup',
          notes: customerInfo.notes,
          delivery_fee: deliveryFee,
          discount: 0
        },
        p_items: cart.map(item => ({
          product_id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          variation: item.variation,
          extras: item.extras,
          observation: item.observation
        })),
        p_payment: {
          amount: total,
          method: customerInfo.payment_method,
          status: 'pending',
          needs_change: customerInfo.payment_method === 'money' && Number(customerInfo.change_for || 0) > total,
          change_for: customerInfo.payment_method === 'money' ? Number(customerInfo.change_for || 0) : 0
        }
      }

      // Address is now handled by RPC

      // 2. Call Transactional RPC
      const { data: result, error: rpcError } = await supabase.rpc('create_complete_order', rpcParams)

      if (rpcError) {
        console.error("RPC Error calling create_complete_order:", rpcError)
        throw new Error(`Erro ao criar pedido (RPC): ${rpcError.message}`)
      }

      if (!result.success) {
        console.error("Transactional Error in create_complete_order:", result.error, result.detail)
        throw new Error(`Erro transacional ao processar pedido: ${result.error}`)
      }

      const newOrderId = result.order_id
      const order = { id: newOrderId, ...rpcParams.p_order } // Mock order object for webhook

      // 5. External Actions (n8n Webhook)
      const n8nUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
      if (n8nUrl) {
        fetch(n8nUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order,
            items: cart,
            customer: customerInfo,
            address: address
          })
        }).catch(err => console.error("Webhook error:", err))
      }

      // 6. Handle Payment Redirection or PIX Generation
      if (customerInfo.payment_method === 'pix') {
        const response = await fetch('/api/payment/pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: order.id,
            tenant_id: effectiveTenantId,
            amount: total,
            customer_email: customerInfo.email,
            customer_name: customerInfo.name
          })
        })
        
        const pixResult = await response.json()
        
        if (!response.ok) {
           throw new Error(pixResult.error || pixResult.details || "Erro ao gerar PIX");
        }

        if (pixResult.qr_code) {
          localStorage.removeItem('checkout_cart')
          router.push(`/checkout/pagamento?orderId=${order.id}`)
          return
        }
      }

      if (customerInfo.payment_method === 'mercadopago_card') {
        localStorage.removeItem('checkout_cart')
        router.push(`/checkout/pagamento?orderId=${order.id}`)
        return
      }

      // Default Success (Cash on delivery or manual payment)
      toast.success("Pedido realizado com sucesso!")
      localStorage.removeItem('checkout_cart')
      router.push(`/pedido-confirmado?orderId=${order.id}`)

    } catch (err: any) {
      console.error("Full Finalization Error Object:", err)
      const errorMsg = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err))
      toast.error(`Erro ao finalizar pedido: ${errorMsg}`)
    } finally {
      setIsSubmitting(false)
    }
  }


  if (loadingBusiness) return <div className="h-screen flex items-center justify-center font-black animate-pulse bg-white text-pink-500">CARREGANDO...</div>

  return (
    <div className="min-h-screen bg-[#FFF5F8] flex flex-col font-sans selection:bg-pink-100 selection:text-pink-600">
      {/* Checkout Navbar - Refined */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 p-6 flex flex-col items-center justify-between sticky top-0 z-50 shadow-sm gap-4">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => router.push('/')}>
            <div className="size-12 bg-gradient-to-br from-[#FF2F81] to-[#FF6B6B] rounded-2xl flex items-center justify-center shadow-lg shadow-pink-200 group-hover:scale-110 transition-transform">
              <ShoppingBag className="text-white size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black italic uppercase tracking-tighter leading-none">
                FINALIZAR <span className="text-[#FF2F81]">PEDIDO</span>
              </h1>
              <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mt-1">Sua confeitaria favorita</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="text-xs font-black uppercase text-slate-400 hover:text-pink-500 hover:bg-pink-50 rounded-full px-6"
          >
             Voltar ao Menu
          </Button>
        </div>

        {/* Improved Progress Bar */}
        <div className="w-full max-w-md bg-slate-100 h-2 rounded-full overflow-hidden flex relative">
           <div 
            className="absolute h-full bg-[#FF2F81] transition-all duration-500 ease-out shadow-[0_0_10px_#FF2F81]"
            style={{ width: `${(step / 3) * 100}%` }}
           />
           <div className="flex-1 text-[8px] font-black uppercase tracking-widest text-center py-0.5 relative z-10 text-white mix-blend-difference">
              Passo {step} de 3
           </div>
        </div>

        {/* STORE CLOSED BANNER - iFood Standard */}
        {!storeStatus.isOpen && !loadingBusiness && (
          <div className={cn(
            "w-full p-4 flex flex-col items-center justify-center gap-1 transition-all",
            storeStatus.status === 'OUTSIDE_HOURS' ? "bg-amber-500 text-white" : "bg-rose-500 text-white"
          )}>
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 animate-pulse" />
              <span className="text-sm font-black uppercase tracking-tighter">{storeStatus.message}</span>
            </div>
            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{storeStatus.reason}</p>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start relative z-10">
        
        {/* Left Column: Form Details (Col 7/12) */}
        <div className="lg:col-span-7 space-y-8 w-full min-w-0">

          {/* Section 1: Customer Info */}
          {step === 1 && (
            <motion.section 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 md:p-10 rounded-[40px] md:rounded-[56px] border border-pink-50 shadow-[0_30px_60px_rgba(255,47,129,0.05)] w-full"
            >
              <div className="flex items-center gap-6 mb-10">
                 <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-[#FF2F81] to-[#FF6B6B] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-pink-200">1</div>
                 <div className="space-y-1">
                   <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800 leading-none">Seus Dados</h2>
                   <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">Identificação do cliente</p>
                 </div>
              </div>
              
              <div className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    <div className="space-y-3">
                       <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Nome Completo</Label>
                       <Input 
                          placeholder="Ex: João Silva" 
                          value={customerInfo.name} 
                          onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                          className="h-16 rounded-[28px] bg-slate-50 border-2 border-transparent focus:border-pink-200 focus:bg-white transition-all font-bold px-8 text-slate-700"
                       />
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">WhatsApp</Label>
                       <Input 
                          placeholder="(00) 00000-0000" 
                          value={customerInfo.phone} 
                          onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                          className="h-16 rounded-[28px] bg-slate-50 border-2 border-transparent focus:border-pink-200 focus:bg-white transition-all font-bold px-8 text-slate-700"
                       />
                    </div>
                 </div>
                 <div className="space-y-3">
                    <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Email (Opcional)</Label>
                    <Input 
                       placeholder="seu@email.com" 
                       value={customerInfo.email} 
                       onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})}
                       className="h-16 rounded-[28px] bg-slate-50 border-2 border-transparent focus:border-pink-200 focus:bg-white transition-all font-bold px-8 text-slate-700"
                    />
                 </div>
                 <div className="space-y-3">
                    <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Observações do Pedido</Label>
                    <Input 
                       placeholder="Ex: Sem cebola, apartamento..." 
                       value={customerInfo.notes} 
                       onChange={e => setCustomerInfo({...customerInfo, notes: e.target.value})}
                       className="h-16 rounded-[28px] bg-slate-50 border-2 border-transparent focus:border-pink-200 focus:bg-white transition-all font-bold px-8 text-slate-700"
                    />
                 </div>
              </div>

              <div className="mt-10 flex justify-end">
                <Button 
                  onClick={() => {
                    if (!customerInfo.name || !customerInfo.phone) {
                      toast.error("Preencha seu nome e WhatsApp")
                      return
                    }
                    setStep(2)
                  }}
                  className="bg-slate-900 text-white h-16 px-10 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#FF2F81] transition-all"
                >
                  Confirmar Dados
                </Button>
              </div>
            </motion.section>
          )}

          {/* Section 2: Delivery */}
          {step === 2 && (
            <motion.section 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 md:p-10 rounded-[40px] md:rounded-[56px] border border-pink-50 shadow-[0_30px_60px_rgba(255,47,129,0.05)] w-full"
            >
              <div className="flex items-center gap-6 mb-10">
                 <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-[#FF2F81] to-[#FF6B6B] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-pink-200">2</div>
                 <div className="space-y-1">
                   <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800 leading-none">Onde Entregar</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Endereço de entrega</p>
                 </div>
              </div>
              
              <div className="space-y-6">
                <AddressAutocomplete 
                  onAddressSelect={calculateFee} 
                  onManualToggle={setIsManualAddress}
                  className="shadow-sm bg-slate-50 rounded-[28px] border-2 border-transparent focus-within:border-pink-200 focus-within:bg-white transition-all h-16 px-8"
                />

                <AnimatePresence>
                  {address && address.formatted_address && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="mt-4 p-8 bg-slate-900 rounded-[32px] text-white space-y-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF2F81] rounded-full blur-[100px] opacity-10 -translate-y-1/2 translate-x-1/2" />
                        
                        <div className="flex items-center gap-4 relative z-10">
                          <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                            <MapPin className="size-5 text-pink-400" />
                          </div>
                          <p className="text-sm font-bold truncate pr-4">{address.formatted_address}</p>
                        </div>

                        <div className="flex flex-wrap gap-4 relative z-10">
                          {distance && (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10">
                                <Zap className="size-3 text-pink-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{distance.toFixed(1)} km (por rota)</span>
                              </div>
                            </div>
                          )}
                            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10">
                              <Clock className="size-3 text-pink-400" />
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                {estimatedTime || "30-45"} min
                              </span>
                            </div>
                        </div>
                      </div>

                      {/* Complemento - New Field */}
                      <div className="mt-6 space-y-3">
                        <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Complemento (Opcional)</Label>
                        <Input 
                            placeholder="Ex: Apartamento 402, Bloco B" 
                            value={customerInfo.complement} 
                            onChange={e => setCustomerInfo({...customerInfo, complement: e.target.value})}
                            className="h-16 rounded-[28px] bg-slate-50 border-2 border-transparent focus:border-pink-200 focus:bg-white transition-all font-bold px-8 text-slate-700"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-10 flex justify-between gap-4">
                <Button 
                  onClick={() => setStep(1)}
                  variant="ghost"
                  className="h-16 px-10 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-400"
                >
                  Voltar
                </Button>
                <Button 
                  onClick={() => {
                    if (!address) {
                      toast.error("Informe o endereço de entrega")
                      return
                    }
                    setStep(3)
                  }}
                  className="bg-slate-900 text-white h-16 px-10 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#FF2F81] transition-all"
                >
                  Confirmar Endereço
                </Button>
              </div>
            </motion.section>
          )}

          {/* Section 3: Payment */}
          {step === 3 && (
            <motion.section 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 md:p-10 rounded-[40px] md:rounded-[56px] border border-pink-50 shadow-[0_30px_60px_rgba(255,47,129,0.05)] w-full"
            >
              <div className="flex items-center gap-6 mb-10">
                 <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-[#FF2F81] to-[#FF6B6B] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-pink-200">3</div>
                 <div className="space-y-1">
                   <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800 leading-none">Como Pagar</h2>
                   <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">Forma de pagamento</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <button 
                  onClick={() => setCustomerInfo({...customerInfo, payment_method: "pix"})}
                  className={cn(
                    "p-8 rounded-[32px] md:rounded-[40px] border-4 flex flex-col items-center gap-4 transition-all duration-300 relative overflow-hidden group",
                    customerInfo.payment_method === "pix" 
                      ? "border-[#FF2F81] bg-pink-50/50 shadow-xl shadow-pink-100/50 scale-[1.02]" 
                      : "border-slate-50 bg-slate-50 hover:border-pink-100"
                  )}
                >
                    <div className={cn(
                      "size-16 rounded-2xl flex items-center justify-center transition-all",
                      customerInfo.payment_method === "pix" ? "bg-[#FF2F81] text-white shadow-lg shadow-pink-200" : "bg-white text-slate-300 shadow-sm border border-slate-100"
                    )}>
                       <Zap className="size-8" />
                    </div>
                    <div className="text-center">
                      <span className={cn(
                        "text-sm font-black uppercase tracking-widest block",
                        customerInfo.payment_method === "pix" ? "text-[#FF2F81]" : "text-slate-500"
                      )}>Pagar via PIX</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 block">Rápido e Seguro</span>
                    </div>
                </button>

                <button 
                  onClick={() => setCustomerInfo({...customerInfo, payment_method: "mercadopago_card"})}
                  className={cn(
                    "p-8 rounded-[32px] md:rounded-[40px] border-4 flex flex-col items-center gap-4 transition-all duration-300 relative overflow-hidden group",
                    customerInfo.payment_method === "mercadopago_card" 
                      ? "border-[#FF2F81] bg-pink-50/50 shadow-xl shadow-pink-100/50 scale-[1.02]" 
                      : "border-slate-50 bg-slate-50 hover:border-pink-100"
                  )}
                >
                    <div className={cn(
                      "size-16 rounded-2xl flex items-center justify-center transition-all",
                      customerInfo.payment_method === "mercadopago_card" ? "bg-[#FF2F81] text-white shadow-lg shadow-pink-200" : "bg-white text-slate-300 shadow-sm border border-slate-100"
                    )}>
                       <CreditCard className="size-8" />
                    </div>
                    <div className="text-center">
                      <span className={cn(
                        "text-sm font-black uppercase tracking-widest block",
                        customerInfo.payment_method === "mercadopago_card" ? "text-[#FF2F81]" : "text-slate-500"
                      )}>Cartão Online</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 block">Rápido e Seguro</span>
                    </div>
                </button>

                <button 
                  onClick={() => setCustomerInfo({...customerInfo, payment_method: "money"})}
                  className={cn(
                    "p-8 rounded-[32px] md:rounded-[40px] border-4 flex flex-col items-center gap-4 transition-all duration-300 relative overflow-hidden group",
                    customerInfo.payment_method === "money" 
                      ? "border-[#FF2F81] bg-pink-50/50 shadow-xl shadow-pink-100/50 scale-[1.02]" 
                      : "border-slate-50 bg-slate-50 hover:border-pink-100"
                  )}
                >
                    <div className={cn(
                      "size-16 rounded-2xl flex items-center justify-center transition-all",
                      customerInfo.payment_method === "money" ? "bg-[#FF2F81] text-white shadow-lg shadow-pink-200" : "bg-white text-slate-300 shadow-sm border border-slate-100"
                    )}>
                       <ShoppingBag className="size-8" />
                    </div>
                    <div className="text-center">
                      <span className={cn(
                        "text-sm font-black uppercase tracking-widest block",
                        customerInfo.payment_method === "money" ? "text-[#FF2F81]" : "text-slate-500"
                      )}>Dinheiro</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 block">Rápido e Seguro</span>
                    </div>
                </button>

                {/* Change For (Troco) - Sub-Step if Cash */}
                <AnimatePresence>
                  {customerInfo.payment_method === 'money' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="md:col-span-2 overflow-hidden"
                    >
                      <div className="p-8 bg-amber-50 rounded-[32px] border-2 border-amber-100 mt-4">
                        <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600 block mb-4 ml-2">Precisa de troco?</Label>
                        <div className="flex items-center gap-4">
                           <div className="relative flex-1">
                              <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-amber-500" />
                              <Input 
                                type="number"
                                placeholder="Troco para quanto?" 
                                value={customerInfo.change_for} 
                                onChange={e => setCustomerInfo({...customerInfo, change_for: e.target.value})}
                                className="h-16 rounded-[24px] bg-white border-none focus:ring-2 focus:ring-amber-200 font-bold pl-14 text-slate-700 md:text-xl"
                              />
                           </div>
                           <div className="text-right shrink-0 pr-2">
                              <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">Seu Total</p>
                              <p className="text-xl font-black text-amber-600 leading-none">R$ {total.toFixed(2)}</p>
                           </div>
                        </div>
                        {customerInfo.change_for && Number(customerInfo.change_for) > total && (
                           <p className="text-[10px] font-bold text-amber-500 mt-4 ml-2 uppercase italic flex items-center gap-2 animate-pulse">
                              <RefreshCcw className="size-3" />
                              Levaremos R$ {(Number(customerInfo.change_for) - total).toFixed(2)} de troco
                           </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

               <button 
                  onClick={() => setCustomerInfo({...customerInfo, payment_method: "card_on_delivery"})}
                  className={cn(
                    "p-8 rounded-[32px] md:rounded-[40px] border-4 flex flex-col items-center gap-4 transition-all duration-300 relative overflow-hidden group",
                    customerInfo.payment_method === "card_on_delivery" 
                      ? "border-[#FF2F81] bg-pink-50/50 shadow-xl shadow-pink-100/50 scale-[1.02]" 
                      : "border-slate-50 bg-slate-50 hover:border-pink-100"
                  )}
                >
                    <div className={cn(
                      "size-16 rounded-2xl flex items-center justify-center transition-all",
                      customerInfo.payment_method === "card_on_delivery" ? "bg-[#FF2F81] text-white shadow-lg shadow-pink-200" : "bg-white text-slate-300 shadow-sm border border-slate-100"
                    )}>
                       <CreditCard className="size-8" />
                    </div>
                    <div className="text-center">
                      <span className={cn(
                        "text-sm font-black uppercase tracking-widest block",
                        customerInfo.payment_method === "card_on_delivery" ? "text-[#FF2F81]" : "text-slate-500"
                      )}>Cartão Entrega</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 block">Maquininha</span>
                    </div>
                </button>
              </div>

              <div className="mt-10 flex justify-between gap-4">
                 <Button 
                  onClick={() => setStep(2)}
                  variant="ghost"
                  className="h-16 px-10 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-400"
                >
                  Voltar
                </Button>
                <Button 
                  onClick={handleFinalizeOrder}
                  disabled={isSubmitting}
                  className="bg-[#FF2F81] text-white h-16 px-10 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-pink-200 hover:scale-105 transition-all flex items-center gap-3"
                >
                  {isSubmitting ? <Loader2 className="animate-spin size-4" /> : <Check className="size-4" />}
                  Finalizar Pedido
                </Button>
              </div>
            </motion.section>
          )}

        </div>

        {/* Right Column: Order Summary Card (Col 5/12) */}
        <aside className="lg:col-span-5 w-full lg:sticky lg:top-36">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="rounded-[40px] md:rounded-[60px] border-none shadow-[0_40px_100px_rgba(255,47,129,0.1)] bg-white overflow-hidden group">
              <CardContent className="p-8 md:p-12">
                <div className="flex items-center justify-between mb-10">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-800">Resumo</h3>
                    <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">Seu pedido selecionado</p>
                  </div>
                  <div className="bg-[#FFF5F8] text-[#FF2F81] font-black border-2 border-pink-50 px-5 py-2 rounded-2xl text-[10px] uppercase tracking-widest">
                    {cart.length} ITENS
                  </div>
                </div>

                <div className="space-y-6 mb-10 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                  {cart.length > 0 ? (
                    <AnimatePresence mode="popLayout">
                      {cart.map((item: any, idx: number) => (
                        <motion.div 
                          key={item.id} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-between items-center p-3 rounded-2xl hover:bg-slate-50 transition-colors group/item"
                        >
                          <div className="flex items-center gap-4">
                            <div className="size-14 rounded-2xl bg-white border-2 border-slate-50 flex items-center justify-center font-black text-[#FF2F81] shadow-sm transform group-hover/item:rotate-3 transition-transform">
                              {item.quantity}x
                            </div>
                            <div className="space-y-1">
                              <span className="text-sm font-black text-slate-800 uppercase italic tracking-tighter block">{item.name}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">R$ {item.price.toFixed(2)}</span>
                            </div>
                          </div>
                          <span className="text-base font-black text-slate-800 italic tracking-tighter">R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  ) : (
                    <div className="text-center py-16 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-100 flex flex-col items-center gap-4">
                       <ShoppingBag className="size-12 text-slate-200 stroke-1" />
                       <p className="font-black uppercase tracking-widest text-[10px] text-slate-300 px-8 text-center">Sua sacola está vazia por enquanto.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-5 pt-8 border-t-2 border-slate-50">
                   <div className="flex justify-between items-center text-slate-500 font-bold text-[11px] uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span className="text-slate-800">R$ {subtotal.toFixed(2)}</span>
                   </div>
                   <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-slate-500 font-bold text-[11px] uppercase tracking-widest">
                        <span className="flex items-center gap-2">
                          Taxa de Entrega 
                          {isCalculating && <RefreshCcw className="size-3 animate-spin text-pink-400" />}
                        </span>
                        <span className={cn(
                          "font-black tracking-tighter",
                          deliveryFee === 0 ? "text-emerald-500" : "text-slate-800"
                        )}>
                          {isCalculating ? (
                              <div className="flex items-center gap-2 text-[10px] text-pink-500 animate-pulse">
                                  <Loader2 className="size-3 animate-spin" />
                                  CALCULANDO...
                              </div>
                          ) : (
                              deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2)}` : 'Grátis'
                          )}
                        </span>
                      </div>
                      {distance && !isCalculating && (
                        <p className="text-[9px] font-bold text-pink-400 uppercase tracking-widest italic leading-none">
                          {distance.toFixed(1)} km • {estimatedTime}
                        </p>
                      )}
                    </div>
                   
                   <div className="pt-6 relative">
                      <div className="absolute inset-0 bg-pink-50/10 blur-2xl -z-10" />
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF2F81] block ml-1 leading-none">Total à Pagar</span>
                          <span className="text-5xl md:text-6xl font-black italic tracking-tighter text-slate-900 block leading-none">
                            R$ {total.toFixed(2).split('.')[0]}
                            <span className="text-2xl align-top mt-1 ml-0.5 opacity-40">,{total.toFixed(2).split('.')[1]}</span>
                          </span>
                        </div>
                      </div>
                   </div>
                </div>

                <Button 
                  onClick={handleFinalizeOrder}
                  disabled={!address || isCalculating || isSubmitting || cart.length === 0 || !storeStatus.isOpen}
                  className={cn(
                    "w-full h-20 md:h-24 rounded-[32px] md:rounded-[40px] text-white font-black uppercase text-lg md:text-xl tracking-[0.2em] shadow-xl shadow-pink-100 mt-10 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40",
                    storeStatus.isOpen ? "bg-gradient-to-r from-[#FF2F81] to-[#FF6B6B]" : "bg-slate-400"
                  )}
                >
                  {isSubmitting ? (
                    <RefreshCcw className="size-8 animate-spin" />
                  ) : !storeStatus.isOpen ? (
                    <div className="flex flex-col items-center">
                      <span className="text-lg md:text-xl font-black uppercase tracking-widest">Loja Fechada</span>
                      <span className="text-[10px] opacity-80 font-bold uppercase tracking-[0.2em]">
                        {storeStatus.status === 'OUTSIDE_HOURS' ? `Abrimos às ${storeStatus.nextOpening}` : 'Pausa Operacional'}
                      </span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-4">
                      Finalizar Agora
                      <ArrowRight className="size-6 md:size-8" />
                    </span>
                  )}
                </Button>

                <div className="mt-8 flex items-center justify-center gap-4 p-6 bg-slate-50 rounded-[28px] border border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-snug">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  Ambiente Seguro Cryptografado
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </aside>
      </main>


      {/* STICKY BOTTOM BAR (IFOOD STYLE) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-pink-100 p-4 md:p-6 z-[60] shadow-[0_-20px_40px_rgba(0,0,0,0.05)] md:hidden">
         <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="space-y-1">
               <span className="text-[9px] font-black uppercase tracking-widest text-[#FF2F81] block">Total</span>
               <span className="text-2xl font-black italic tracking-tighter text-slate-900 leading-none">
                 R$ {total.toFixed(2)}
               </span>
            </div>
            
            {step < 3 ? (
              <Button 
                onClick={() => setStep(step + 1)}
                className="bg-slate-900 text-white h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#FF2F81] transition-all flex items-center gap-2"
              >
                Próximo <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleFinalizeOrder}
                disabled={isSubmitting || cart.length === 0}
                className="bg-[#FF2F81] text-white h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-pink-200 hover:scale-105 transition-all flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin size-4" /> : <Check className="size-4" />}
                Finalizar
              </Button>
            )}
         </div>
      </div>
    </div>
  )
}
