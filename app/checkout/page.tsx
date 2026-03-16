"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  User, 
  CreditCard, 
  Truck, 
  ShoppingBag,
  CheckCircle2,
  ChevronRight,
  Info,
  DollarSign
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

export default function CheckoutPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [cart, setCart] = useState<any[]>([])
  const [company, setCompany] = useState<any>(null)
  
  const [form, setForm] = useState({
    name: "",
    phone: "",
    type: "delivery", // delivery, takeaway, dinein
    address: "",
    complement: "",
    neighborhood: "",
    payment: "pix"
  })

  useEffect(() => {
    // Load cart from localStorage or state management
    const savedCart = localStorage.getItem('checkout_cart')
    if (savedCart) setCart(JSON.parse(savedCart))
    
    // Load company context (usually stored when visiting the menu)
    const savedComp = localStorage.getItem('checkout_company')
    if (savedComp) setCompany(JSON.parse(savedComp))
  }, [])

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const deliveryFee = form.type === 'delivery' ? 7.50 : 0 // Placeholder logic for now

  const handleFinish = async () => {
    if (!company || cart.length === 0) return
    
    try {
      setLoading(true)
      
      // 1. Find or Create Client (Professional 'clientes' table)
      let clientId = null
      const { data: existingClient } = await supabase
        .from('clientes')
        .select('id')
        .eq('empresa_id', company.id)
        .eq('telefone', form.phone)
        .maybeSingle()

      if (existingClient) {
        clientId = existingClient.id
      } else {
        const { data: newClient } = await supabase
          .from('clientes')
          .insert({
            empresa_id: company.id,
            nome: form.name,
            telefone: form.phone,
            endereco: form.address
          })
          .select()
          .single()
        if (newClient) clientId = newClient.id
      }

      // 1.1 CRM Legacy: Find or Create Client in 'clients' table
      let legacyClientId = null
      const { data: existingLegacyClient } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', company.id)
        .eq('phone', form.phone)
        .maybeSingle()
      
      if (existingLegacyClient) {
        legacyClientId = existingLegacyClient.id
      } else {
        const { data: newLegacyClient } = await supabase
          .from('clients')
          .insert({
            company_id: company.id,
            name: form.name,
            phone: form.phone,
            address: form.address
          })
          .select()
          .single()
        if (newLegacyClient) legacyClientId = newLegacyClient.id
      }

      // 2. Insert into professional 'pedidos' table
      const { data: profOrder, error: profOrderError } = await supabase
        .from('pedidos')
        .insert({
          empresa_id: company.id,
          cliente_id: clientId,
          cliente_nome: form.name, // Added for redundancy/ease of use
          cliente_telefone: form.phone, // Added for redundancy/ease of use
          tipo_pedido: form.type,
          status: 'novo',
          valor_total: total,
          taxa_entrega: deliveryFee,
          endereco_entrega: form.address,
          observacoes: form.complement,
          payment_method: form.payment
        })
        .select()
        .single()

      if (profOrderError) {
        console.error("Supabase error (pedidos):", profOrderError)
        throw new Error(`Erro ao salvar pedido: ${profOrderError.message}`)
      }
      
      console.log("Pedido salvo com sucesso:", profOrder)

      // 2.1 Insert into legacy 'orders' table
      await supabase
        .from('orders')
        .insert({
          company_id: company.id,
          user_id: company.owner_id,
          client_id: legacyClientId,
          product_name: cart.map(i => `${i.quantity}x ${i.name}`).join(', '),
          total_value: total,
          status: 'novo',
          delivery_date: new Date().toISOString()
        })

      // 3. Insert professional items
      if (profOrder) {
        await supabase
          .from('itens_pedido')
          .insert(cart.map(item => ({
            pedido_id: profOrder.id,
            produto_id: item.id,
            product_name: item.name, // Added for high visibility in KDS
            quantidade: item.quantity,
            preco: item.price
          })))
      }
      
      localStorage.removeItem('checkout_cart')
      toast.success("Pedido enviado com sucesso!")
      router.push("/pedido-confirmado")
    } catch (e: any) {
      console.error(e)
      toast.error(`Erro ao finalizar: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Checkout Navbar */}
      <div className="bg-white border-b border-slate-200 p-6 sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <Button onClick={() => router.back()} variant="ghost" className="rounded-xl gap-2 text-slate-500 font-black uppercase text-[10px] tracking-widest leading-none">
            <ArrowLeft className="size-4" /> Voltar ao Cardápio
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Checkout</h1>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-1">Sua Doce Gestão</p>
          </div>
          <div className="size-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs">
            {step}/2
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Step 1: Identification & Type */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <Card className="rounded-[40px] border-none shadow-2xl shadow-slate-200/50 overflow-hidden">
                  <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500 blur-[80px] -mr-16 -mt-16 opacity-30" />
                    <h2 className="text-2xl font-black tracking-tighter uppercase italic mb-1">Seus <span className="text-pink-500">Dados</span></h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Identificação para o pedido</p>
                  </div>
                  <CardContent className="p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <User className="size-3" /> Nome Completo
                        </Label>
                        <Input 
                          placeholder="Ex: João Silva" 
                          value={form.name}
                          onChange={(e) => setForm({...form, name: e.target.value})}
                          className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold text-slate-900 focus-visible:ring-pink-500/20"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <Phone className="size-3" /> WhatsApp
                        </Label>
                        <Input 
                          placeholder="(00) 00000-0000" 
                          value={form.phone}
                          onChange={(e) => setForm({...form, phone: e.target.value})}
                          className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold text-slate-900 focus-visible:ring-pink-500/20"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[40px] border-none shadow-2xl shadow-slate-200/50 overflow-hidden">
                  <div className="p-8 border-b border-slate-100 bg-white">
                    <h2 className="text-xl font-black tracking-tighter uppercase italic">Tipo de <span className="text-pink-500">Entrega</span></h2>
                  </div>
                  <CardContent className="p-10 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: 'delivery', icon: Truck, label: 'Delivery' },
                      { id: 'takeaway', icon: ShoppingBag, label: 'Retirada' },
                      { id: 'dinein', icon: DollarSign, label: 'No Local' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setForm({...form, type: mode.id})}
                        className={cn(
                          "h-24 rounded-3xl border-2 flex flex-col items-center justify-center gap-2 transition-all group",
                          form.type === mode.id 
                            ? "border-pink-500 bg-pink-50/50 text-pink-500 shadow-xl shadow-pink-100/50" 
                            : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                        )}
                      >
                        <mode.icon className={cn("size-6 transition-transform", form.type === mode.id && "scale-110")} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{mode.label}</span>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                {form.type === 'delivery' && (
                  <Card className="rounded-[40px] border-none shadow-2xl shadow-slate-200/50 overflow-hidden">
                    <CardContent className="p-10 space-y-6">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <MapPin className="size-3" /> Endereço Completo
                        </Label>
                        <div className="relative">
                          <Input 
                            placeholder="Buscar endereço no mapa..." 
                            value={form.address}
                            onChange={(e) => setForm({...form, address: e.target.value})}
                            className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold text-slate-900 pl-12 focus-visible:ring-pink-500/20"
                          />
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-pink-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button 
                  onClick={() => setStep(2)}
                  disabled={!form.name || !form.phone}
                  className="w-full h-20 rounded-[30px] bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.3em] shadow-2xl shadow-slate-200 transition-all active:scale-95 group"
                >
                  Continuar para Pagamento <ChevronRight className="size-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                 <Card className="rounded-[40px] border-none shadow-2xl shadow-slate-200/50 overflow-hidden">
                  <div className="bg-slate-900 p-8 text-white">
                    <h2 className="text-2xl font-black tracking-tighter uppercase italic">Forma de <span className="text-pink-500">Pagamento</span></h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Escolha como deseja pagar</p>
                  </div>
                  <CardContent className="p-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { id: 'pix', label: 'PIX (Via App)' },
                      { id: 'card', label: 'Cartão (Entrega)' },
                      { id: 'cash', label: 'Dinheiro' }
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setForm({...form, payment: method.id})}
                        className={cn(
                          "h-20 rounded-3xl border-2 flex flex-col items-center justify-center transition-all",
                          form.payment === method.id 
                            ? "border-emerald-500 bg-emerald-50 text-emerald-600 shadow-xl shadow-emerald-100/50" 
                            : "border-slate-100 bg-white text-slate-400"
                        )}
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest">{method.label}</span>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                <Button 
                  onClick={handleFinish}
                  disabled={loading}
                  className="w-full h-24 rounded-[35px] bg-pink-500 hover:bg-pink-600 text-white font-black uppercase tracking-[0.4em] text-lg shadow-2xl shadow-pink-100 transition-all active:scale-95"
                >
                  {loading ? "Processando..." : "Confirmar Pedido 🍰"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          <Card className="rounded-[48px] border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden p-8 sticky top-28">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-8 pb-4 border-b border-slate-50 flex items-center justify-between">
              Resumo do Pedido <Badge variant="outline" className="rounded-lg border-slate-100 text-slate-400">{cart.length} itens</Badge>
            </h3>

            <div className="space-y-4 mb-10 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className="size-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-900 border border-slate-100">
                      {item.quantity}x
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-slate-800 leading-none mb-1">{item.name}</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">R$ {item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-900 tracking-tighter italic">R$ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-50">
              <div className="flex justify-between items-center text-slate-500 font-black text-[10px] uppercase tracking-widest">
                <span>Subtotal</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              {form.type === 'delivery' && (
                <div className="flex justify-between items-center text-slate-500 font-black text-[10px] uppercase tracking-widest leading-none">
                  <div className="flex flex-col gap-1">
                    <span>Taxa de Entrega</span>
                    <span className="text-[7px] text-slate-400">(Estimada via GPS)</span>
                  </div>
                  <span className="text-pink-500 font-black">+ R$ {deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-4">
                <span className="text-sm font-black text-slate-900 uppercase italic">Total</span>
                <span className="text-3xl font-black text-slate-900 tracking-tighter italic">R$ {(total + deliveryFee).toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-10 p-6 bg-slate-50 rounded-[32px] flex items-center gap-4">
               <Info className="size-6 text-slate-300" />
               <p className="text-[9px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
                 Ao confirmar, seu pedido será enviado para produção em tempo real.
               </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
