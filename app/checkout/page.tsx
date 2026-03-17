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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Checkout Navbar */}
      <header className="bg-white border-b border-rose-100 p-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-primary rounded-xl flex items-center justify-center">
            <ShoppingBag className="text-white size-5" />
          </div>
          <h1 className="text-xl font-black italic uppercase tracking-tighter">
            Finalizar <span className="text-primary">Pedido</span>
          </h1>
        </div>
        <Button variant="ghost" onClick={() => router.back()} className="text-xs font-black uppercase text-slate-400">
           Voltar ao Menu
        </Button>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Form Details */}
        <div className="space-y-12">
          {/* Section 1: Customer Info */}
          <section className="bg-white p-8 rounded-[40px] border border-rose-100 shadow-xl shadow-rose-200/20">
            <div className="flex items-center gap-4 mb-8">
               <div className="size-10 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-500 font-black">1</div>
               <h2 className="text-xl font-black uppercase italic tracking-tighter">Seus Dados</h2>
            </div>
            
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nome Completo</Label>
                     <Input 
                        placeholder="Ex: João Silva" 
                        value={customerInfo.name} 
                        onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                        className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6 focus-visible:ring-primary/20"
                     />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">WhatsApp</Label>
                     <Input 
                        placeholder="(00) 00000-0000" 
                        value={customerInfo.phone} 
                        onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6 focus-visible:ring-primary/20"
                     />
                  </div>
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Email (Opcional)</Label>
                  <Input 
                     placeholder="seu@email.com" 
                     value={customerInfo.email} 
                     onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})}
                     className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6 focus-visible:ring-primary/20"
                  />
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Observações</Label>
                  <Input 
                     placeholder="Ex: Apartamento 402, bloco B..." 
                     value={customerInfo.notes} 
                     onChange={e => setCustomerInfo({...customerInfo, notes: e.target.value})}
                     className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6 focus-visible:ring-primary/20"
                  />
               </div>
            </div>
          </section>

          {/* Section 2: Delivery */}
          <section className="bg-white p-8 rounded-[40px] border border-rose-100 shadow-xl shadow-rose-200/20">
            <div className="flex items-center gap-4 mb-8">
               <div className="size-10 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-500 font-black">2</div>
               <h2 className="text-xl font-black uppercase italic tracking-tighter">Onde Entregar</h2>
            </div>
            
            <AddressAutocomplete 
              onAddressSelect={calculateFee} 
              className="shadow-inner bg-slate-50 rounded-2xl"
            />

            {address && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 p-6 bg-slate-900 rounded-[32px] text-white flex items-start gap-4">
                <div className="size-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                  <MapPin className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest leading-none">Localização Confirmada</p>
                  <p className="text-sm font-bold leading-tight">{address.formatted_address}</p>
                  {distance && (
                    <Badge variant="secondary" className="mt-3 bg-primary text-white border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">
                       Distância: {distance.toFixed(1)} km
                    </Badge>
                  )}
                </div>
              </motion.div>
            )}
          </section>

          {/* Section 3: Payment */}
          <section className="bg-white p-8 rounded-[40px] border border-rose-100 shadow-xl shadow-rose-200/20">
            <div className="flex items-center gap-4 mb-8">
               <div className="size-10 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-500 font-black">3</div>
               <h2 className="text-xl font-black uppercase italic tracking-tighter">Como Pagar</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
               <button 
                onClick={() => setCustomerInfo({...customerInfo, payment_method: "pix"})}
                className={cn(
                  "p-8 rounded-[36px] border-2 flex flex-col items-center gap-4 group transition-all relative overflow-hidden",
                  customerInfo.payment_method === "pix" ? "border-primary bg-pink-50/50 shadow-inner" : "border-slate-50 bg-slate-50 opacity-60 hover:opacity-100"
                )}
               >
                  <div className={cn(
                    "size-14 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-110",
                    customerInfo.payment_method === "pix" ? "bg-primary text-white" : "bg-white text-slate-400 shadow-sm"
                  )}>
                     <Zap className="size-7" />
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    customerInfo.payment_method === "pix" ? "text-primary" : "text-slate-400"
                  )}>Pagar via Pix</span>
               </button>

               <button 
                onClick={() => setCustomerInfo({...customerInfo, payment_method: "cart"})}
                className={cn(
                  "p-8 rounded-[36px] border-2 flex flex-col items-center gap-4 group transition-all relative overflow-hidden",
                  customerInfo.payment_method === "cart" ? "border-primary bg-pink-50/50 shadow-inner" : "border-slate-50 bg-slate-50 opacity-60 hover:opacity-100"
                )}
               >
                  <div className={cn(
                    "size-14 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-110",
                    customerInfo.payment_method === "cart" ? "bg-primary text-white" : "bg-white text-slate-400 shadow-sm"
                  )}>
                     <CreditCard className="size-7" />
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    customerInfo.payment_method === "cart" ? "text-primary" : "text-slate-400"
                  )}>Cartão / Dinheiro</span>
               </button>
            </div>
          </section>
        </div>

        {/* Right Column: Order Summary Card */}
        <aside>
          <Card className="rounded-[64px] border-none shadow-[0_40px_100px_rgba(255,107,107,0.15)] overflow-hidden sticky top-32">
            <CardContent className="p-12 bg-white">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Resumo</h3>
                <Badge className="bg-slate-100 text-slate-500 font-black border-none px-4 py-1.5 rounded-full text-[10px] uppercase">
                  {cart.length} ITENS
                </Badge>
              </div>

              <div className="space-y-6 mb-10 max-h-72 overflow-y-auto pr-4 no-scrollbar">
                {cart.length > 0 ? cart.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center group">
                    <div className="flex items-center gap-4">
                      <div className="size-14 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400 border border-slate-100 group-hover:bg-primary/5 transition-colors">
                        {item.quantity}x
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-sm font-black text-slate-900 uppercase italic tracking-tighter block">{item.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Unit: R$ {item.price.toFixed(2)}</span>
                      </div>
                    </div>
                    <span className="text-sm font-black text-slate-900 italic tracking-tighter">R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                )) : (
                  <div className="text-center py-12 opacity-30">
                     <ShoppingBag className="size-12 mx-auto mb-4 stroke-1" />
                     <p className="font-black uppercase tracking-widest text-[10px]">Sacola Vazia</p>
                  </div>
                )}
              </div>

              <div className="space-y-5 pt-10 border-t border-rose-50">
                 <div className="flex justify-between items-center text-slate-500 font-bold">
                    <span className="text-[10px] uppercase tracking-widest">Subtotal</span>
                    <span className="text-sm font-black text-slate-900 italic">R$ {subtotal.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center text-slate-500 font-bold">
                    <span className="text-[10px] uppercase tracking-widest flex items-center gap-2">
                      Taxa de Entrega {isCalculating && <RefreshCcw className="size-3 animate-spin" />}
                    </span>
                    <span className="text-sm font-black text-slate-900 italic">{deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2)}` : 'Grátis'}</span>
                 </div>
                 <div className="flex justify-between items-center pt-6">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary block leading-none">Total à Pagar</span>
                      <span className="text-4xl font-black italic tracking-tighter text-slate-900 block">R$ {total.toFixed(2)}</span>
                    </div>
                 </div>
              </div>

              <Button 
                onClick={handleFinalizeOrder}
                disabled={!address || isCalculating || isSubmitting}
                className="w-full h-20 rounded-[40px] bg-primary hover:bg-primary/90 text-white font-black uppercase text-base tracking-[0.2em] shadow-2xl shadow-primary/30 mt-12 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCcw className="size-8 animate-spin" />
                ) : (
                  <>Finalizar Compra <ArrowRight className="ml-3 mt-0.5 size-6" /></>
                )}
              </Button>

              <div className="mt-8 flex items-center justify-center gap-3 py-4 px-6 bg-slate-50 rounded-3xl">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.1em]">Pedido processado com segurança por DoceGestão</span>
              </div>
            </CardContent>
          </Card>
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
