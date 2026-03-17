"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useBusiness } from "@/hooks/useBusiness"
import { supabase } from "@/lib/supabase"
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
  ArrowRight
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

export default function CheckoutPage() {
  const router = useRouter()
  const { business, loadingBusiness } = useBusiness()
  const [address, setAddress] = useState<any>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [deliveryFee, setDeliveryFee] = useState<number>(0)
  const [cart, setCart] = useState<any[]>([])
  const [isCalculating, setIsCalculating] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
    payment_method: "pix"
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pixData, setPixData] = useState<any>(null)
  const [isPixDialogOpen, setIsPixDialogOpen] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)

  // Load cart from menu
  useEffect(() => {
    const savedCart = localStorage.getItem('checkout_cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }, [])

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart])
  const total = subtotal + deliveryFee

  const calculateFee = async (selectedAddress: any) => {
    if (!business || !selectedAddress) return

    try {
      setIsCalculating(true)
      
      const service = new google.maps.DistanceMatrixService()
      const origin = { lat: business.address_lat || -23.5505, lng: business.address_lng || -46.6333 }
      const destination = { lat: selectedAddress.lat, lng: selectedAddress.lng }

      service.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
      }, (response, status) => {
        if (status === 'OK' && response) {
          const element = response.rows[0].elements[0]
          if (element.status === 'OK') {
            const distanceInKm = element.distance.value / 1000
            setDistance(distanceInKm)

            const baseFee = business.delivery_fee || 5
            const ratePerKm = (business.config as any)?.rate_per_km || 2
            const calculatedFee = baseFee + (distanceInKm * ratePerKm)
            
            setDeliveryFee(calculatedFee)
            setAddress(selectedAddress)
          } else {
            toast.error("Não foi possível calcular a rota para este endereço.")
          }
        } else {
          toast.error("Erro ao calcular distância")
        }
        setIsCalculating(false)
      })

    } catch (err) {
      console.error("Fee check error:", err)
      setIsCalculating(false)
    }
  }

  const handleFinalizeOrder = async () => {
    if (!address) {
      toast.error("Por favor, informe o endereço de entrega")
      return
    }

    if (!customerInfo.name || !customerInfo.phone) {
      toast.error("Por favor, preencha seu nome e telefone")
      return
    }

    try {
      setIsSubmitting(true)

      // 1. Save Order in Supabase
      const { data: order, error: orderError } = await supabase.from('pedidos').insert({
        company_id: business?.id,
        status: 'novo',
        valor_total: total,
        taxa_entrega: deliveryFee,
        endereco_entrega: address.formatted_address,
        tipo_pedido: 'delivery',
        payment_method: customerInfo.payment_method,
        observacoes: customerInfo.notes,
        cliente_nome: customerInfo.name,
        cliente_telefone: customerInfo.phone
      }).select().single()

      if (orderError) throw orderError

      // 2. Save Order Items
      const { error: itemsError } = await supabase.from('itens_pedido').insert(
        cart.map(item => ({
          pedido_id: order.id,
          produto_id: item.id,
          quantidade: item.quantity,
          preco: item.price
        }))
      )

      if (itemsError) throw itemsError

      // 3. Handle PIX Payment
      if (customerInfo.payment_method === 'pix') {
        const pixRes = await fetch('/api/payments/pix', {
          method: 'POST',
          body: JSON.stringify({
            pedidoId: order.id,
            companyId: business?.id,
            total: total,
            customerEmail: customerInfo.email,
            customerName: customerInfo.name
          })
        })

        const pixJson = await pixRes.json()
        if (pixJson.error) throw new Error(pixJson.error)

        setPixData(pixJson)
        setIsPixDialogOpen(true)
      } else {
        toast.success("Pedido realizado com sucesso!")
        localStorage.removeItem('checkout_cart')
        router.push(`/pedido-confirmado?id=${order.id}`)
      }

    } catch (err: any) {
      toast.error(`Erro ao criar pedido: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyPix = () => {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code)
      setHasCopied(true)
      toast.success("Código PIX copiado!")
      setTimeout(() => setHasCopied(false), 2000)
    }
  }

  if (loadingBusiness) return <div className="h-screen flex items-center justify-center font-black animate-pulse">CARREGANDO...</div>

  return (
    <div className="min-h-screen bg-[#FFF5F8] flex flex-col font-sans selection:bg-pink-100 selection:text-pink-600">
      {/* Checkout Navbar - Refined */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 p-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
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
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start relative z-10">
        
        {/* Left Column: Form Details (Col 7/12) */}
        <div className="lg:col-span-7 space-y-8 w-full min-w-0">

          {/* Section 1: Customer Info */}
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
          </motion.section>


          {/* Section 2: Delivery */}
          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 md:p-10 rounded-[40px] md:rounded-[56px] border border-pink-50 shadow-[0_30px_60px_rgba(255,47,129,0.05)] w-full"
          >
            <div className="flex items-center gap-6 mb-10">
               <div className="w-14 h-14 shrink-0 rounded-2xl bg-[#F8FAFC] border-4 border-white shadow-md flex items-center justify-center text-slate-300 font-black text-xl">2</div>
               <div className="space-y-1">
                 <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800 leading-none">Onde Entregar</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Endereço de entrega</p>
               </div>
            </div>
            
            <div className="space-y-6">
              <AddressAutocomplete 
                onAddressSelect={calculateFee} 
                className="shadow-sm bg-slate-50 rounded-[28px] border-2 border-transparent focus-within:border-pink-200 focus-within:bg-white transition-all h-16 px-8"
              />

              <AnimatePresence>
                {address && (
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
                          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10">
                            <Zap className="size-3 text-pink-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{distance.toFixed(1)} km</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10">
                          <Clock className="size-3 text-pink-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest">30-45 min</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>


          {/* Section 3: Payment */}
          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 md:p-10 rounded-[40px] md:rounded-[56px] border border-pink-50 shadow-[0_30px_60px_rgba(255,47,129,0.05)] w-full"
          >
            <div className="flex items-center gap-6 mb-10">
               <div className="w-14 h-14 shrink-0 rounded-2xl bg-[#F8FAFC] border-4 border-white shadow-md flex items-center justify-center text-slate-300 font-black text-xl">3</div>
               <div className="space-y-1">
                 <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800 leading-none">Como Pagar</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Forma de pagamento</p>
               </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
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
                    )}>Pagar via Pix</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 block">Rápido e Seguro</span>
                  </div>
                  {customerInfo.payment_method === "pix" && (
                    <div className="absolute top-4 right-4 bg-[#FF2F81] text-white p-1 rounded-full">
                       <Check className="size-3 stroke-[3px]" />
                    </div>
                  )}
               </button>

               <button 
                onClick={() => setCustomerInfo({...customerInfo, payment_method: "cart"})}
                className={cn(
                  "p-8 rounded-[32px] md:rounded-[40px] border-4 flex flex-col items-center gap-4 transition-all duration-300 relative overflow-hidden group",
                  customerInfo.payment_method === "cart" 
                    ? "border-[#FF2F81] bg-pink-50/50 shadow-xl shadow-pink-100/50 scale-[1.02]" 
                    : "border-slate-50 bg-slate-50 hover:border-pink-100"
                )}
               >
                  <div className={cn(
                    "size-16 rounded-2xl flex items-center justify-center transition-all",
                    customerInfo.payment_method === "cart" ? "bg-[#FF2F81] text-white shadow-lg shadow-pink-200" : "bg-white text-slate-300 shadow-sm border border-slate-100"
                  )}>
                     <CreditCard className="size-8" />
                  </div>
                  <div className="text-center">
                    <span className={cn(
                      "text-sm font-black uppercase tracking-widest block",
                      customerInfo.payment_method === "cart" ? "text-[#FF2F81]" : "text-slate-500"
                    )}>Outras Opções</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 block">Cartão ou Dinheiro</span>
                  </div>
                  {customerInfo.payment_method === "cart" && (
                    <div className="absolute top-4 right-4 bg-[#FF2F81] text-white p-1 rounded-full">
                       <Check className="size-3 stroke-[3px]" />
                    </div>
                  )}
               </button>
            </div>
          </motion.section>
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
                   <div className="flex justify-between items-center text-slate-500 font-bold text-[11px] uppercase tracking-widest">
                      <span className="flex items-center gap-2">
                        Taxa de Entrega 
                        {isCalculating && <RefreshCcw className="size-3 animate-spin text-pink-400" />}
                      </span>
                      <span className={cn(
                        "font-black tracking-tighter",
                        deliveryFee === 0 ? "text-emerald-500" : "text-slate-800"
                      )}>
                        {deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2)}` : 'Grátis'}
                      </span>
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
                  disabled={!address || isCalculating || isSubmitting || cart.length === 0}
                  className="w-full h-20 md:h-24 rounded-[32px] md:rounded-[40px] bg-gradient-to-r from-[#FF2F81] to-[#FF6B6B] hover:shadow-[0_20px_50px_rgba(255,47,129,0.3)] text-white font-black uppercase text-lg md:text-xl tracking-[0.2em] shadow-xl shadow-pink-100 mt-10 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <RefreshCcw className="size-8 animate-spin" />
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



      {/* PIX MODAL DIALOG */}
      <Dialog open={isPixDialogOpen} onOpenChange={setIsPixDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[50px] p-0 border-none overflow-hidden shadow-2xl">
          <div className="p-10 bg-slate-900 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 size-40 bg-primary rounded-full blur-[100px] opacity-20" />
            <div className="relative z-10">
              <div className="size-16 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
                <QrCode className="size-8 text-primary" />
              </div>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">QUASE LÁ!</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Pague agora para confirmar o pedido</p>
            </div>
          </div>

          <div className="p-10 bg-white space-y-8 text-center">
            {pixData?.qr_code_base64 && (
              <div className="p-4 bg-slate-50 rounded-[40px] inline-block mb-2 border border-slate-100 shadow-inner">
                <img 
                  src={`data:image/png;base64,${pixData.qr_code_base64}`} 
                  className="size-48 mx-auto mix-blend-multiply" 
                  alt="QR Code PIX" 
                />
              </div>
            )}

            <div className="space-y-3">
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Código Pix Copia e Cola:</p>
               <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                  <span className="text-[10px] font-bold text-slate-400 truncate flex-1 block overflow-hidden">{pixData?.qr_code}</span>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="size-10 rounded-xl bg-white shadow-sm shrink-0"
                    onClick={copyPix}
                  >
                    {hasCopied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4 text-slate-400" />}
                  </Button>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-center gap-3 py-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                <RefreshCcw className="size-4 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Aguardando Pagamento...</span>
              </div>
              
              <Button 
                onClick={() => {
                  localStorage.removeItem('checkout_cart')
                  router.push(`/pedido-confirmado?id=${pixData?.external_reference}`)
                }}
                variant="outline"
                className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest border-slate-200 text-slate-500"
              >
                Já paguei, ver meu pedido
              </Button>
            </div>

            <p className="text-[9px] font-medium text-slate-400 leading-relaxed max-w-[200px] mx-auto">
              Após o pagamento, o pedido será confirmado automaticamente pelo restaurante.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
