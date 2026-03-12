"use client"

import { useState, useEffect, use } from "react"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  ChevronRight, 
  MapPin, 
  Phone, 
  Clock, 
  Info,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  QrCode
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image_url: string
}

export default function PublicMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [company, setCompany] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [isClosed, setIsClosed] = useState(false)
  
  // Checkout Form
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: "",
    cep: "",
    notes: "",
    payment_method: "pix"
  })

  useEffect(() => {
    fetchMenuData()
  }, [slug])

  useEffect(() => {
    // Simulate Delivery Fee Calculation
    if (customerInfo.cep.replace(/\D/g, '').length === 8) {
      const fee = Math.floor(Math.random() * 10) + 5 // R$ 5-15
      setDeliveryFee(fee)
    }
  }, [customerInfo.cep])

  async function fetchMenuData() {
    try {
      setLoading(true)
      // 1. Fetch Company
      const { data: compData, error: compError } = await supabase
        .from('companies')
        .select('*')
        .eq('slug', slug)
        .single()
      
      if (compError) throw compError
      setCompany(compData)

      // 2. Fetch Categories & Products
      const [catRes, prodRes] = await Promise.all([
        supabase.from('menu_categories').select('*').eq('company_id', compData.id).eq('active', true).order('position'),
        supabase.from('menu_products').select('*').eq('company_id', compData.id).eq('active', true)
      ])

      setCategories(catRes.data || [])
      setProducts(prodRes.data || [])
    } catch (error: any) {
      console.error("Error fetching menu:", error.message)
      toast.error("Cardápio não encontrado ou indisponível.")
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, image_url: product.image_url }]
    })
    toast.success(`${product.name} adicionado!`, { position: "bottom-center" })
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta)
        return { ...item, quantity: newQty }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const total = subtotal + deliveryFee

  async function handleSubmitOrder() {
    if (!customerInfo.name || !customerInfo.phone) {
      toast.error("Preencha seu nome e telefone.")
      return
    }

    if (subtotal < parseFloat(company.min_order || "0")) {
      toast.error(`O pedido mínimo é de R$ ${parseFloat(company.min_order).toFixed(2)}`, {
        icon: <AlertCircle className="size-4 text-rose-500" />
      })
      return
    }

    try {
      const { data: order, error: orderError } = await supabase
        .from('menu_orders')
        .insert({
          company_id: company.id,
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          customer_address: customerInfo.address,
          customer_cep: customerInfo.cep,
          subtotal,
          delivery_fee: deliveryFee,
          total,
          payment_method: customerInfo.payment_method,
          notes: customerInfo.notes
        })
        .select()
        .single()

      if (orderError) throw orderError

      const { error: itemsError } = await supabase
        .from('menu_order_items')
        .insert(cart.map(item => ({
          order_id: order.id,
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price
        })))

      if (itemsError) throw itemsError

      toast.success("Pedido enviado com sucesso! 🎉")
      setCart([])
      setIsCheckoutOpen(false)
      setIsCartOpen(false)
      
      // WhatsApp Forwarding (Optional but good)
      const message = encodeURIComponent(`Olá! Gostaria de confirmar meu pedido #${order.id.slice(0, 8)}\n\n*Itens:*\n${cart.map(i => `- ${i.quantity}x ${i.name}`).join('\n')}\n\n*Total:* R$ ${total.toFixed(2)}`)
      window.open(`https://wa.me/55${company.phone?.replace(/\D/g, '')}?text=${message}`, '_blank')

    } catch (error: any) {
      toast.error("Erro ao enviar pedido.")
      console.error(error)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="size-10 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  )

  if (!company) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
      <AlertCircle className="size-16 text-slate-200 mb-4" />
      <h1 className="text-2xl font-black text-slate-900 uppercase italic">Oops!</h1>
      <p className="text-slate-500">Este cardápio não está disponível no momento.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 relative pb-32">
      {/* Promotional Banner */}
      {company.promo_banner && (
        <div className="bg-primary text-white py-2 px-6 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">
            ✨ {company.promo_banner} ✨
          </p>
        </div>
      )}

      {/* Hero / Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
            {company.logo_url ? <img src={company.logo_url} className="size-full object-cover" /> : <Plus className="size-8 text-slate-300" />}
          </div>
          <div className="flex-1">
            <h1 className="font-black text-xl text-slate-900 uppercase italic tracking-tighter leading-none">{company.name}</h1>
            <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
              <span className={cn(
                "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                company.business_hours?.includes("Fechado") ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
              )}>
                <CheckCircle2 className="size-3" /> {company.business_hours?.includes("Fechado") ? "Fechado" : "Aberto"}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap"><MapPin className="size-3 inline mr-1" /> {company.address?.split(',')[2] || "Sua Cidade"}</span>
              {company.business_hours && (
                 <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap flex items-center gap-1">
                   <Clock className="size-3" /> {company.business_hours}
                 </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="relative" onClick={() => setIsCartOpen(true)}>
            <ShoppingCart className="size-6 text-slate-900" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 size-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md">
                {cart.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-12">
        {/* Categories Carousel (Simple) */}
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none">
          {categories.map(cat => (
            <button 
              key={cat.id} 
              className="px-5 py-2.5 rounded-2xl bg-white border border-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-primary hover:border-primary/20 hover:bg-slate-50 transition-all whitespace-nowrap shadow-sm"
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products by Category */}
        {categories.map(cat => (
          <div key={cat.id} className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              {cat.name}
              <span className="h-px flex-1 bg-slate-200" />
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {products.filter(p => p.category_id === cat.id).map(prod => (
                <motion.div 
                  key={prod.id} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  className="bg-white p-4 rounded-3xl border border-slate-200 flex gap-4 cursor-pointer hover:border-primary/20 transition-all group"
                  onClick={() => addToCart(prod)}
                >
                  <div className="size-24 rounded-2xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100 group-hover:scale-105 transition-transform duration-500">
                    {prod.image_url ? (
                      <img src={prod.image_url} alt={prod.name} className="size-full object-cover" />
                    ) : (
                      <div className="size-full flex items-center justify-center text-slate-300">
                        <Plus className="size-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="font-black text-slate-900 uppercase italic leading-tight mb-1">{prod.name}</h3>
                      <p className="text-[10px] text-slate-500 font-medium line-clamp-2 leading-relaxed">{prod.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-black text-primary italic tracking-tighter">R$ {prod.price.toFixed(2)}</span>
                      <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <Plus className="size-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Cart Button (Mobile) */}
      <AnimatePresence>
        {cart.length > 0 && !isCartOpen && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-6 right-6 z-50 md:max-w-sm md:left-auto"
          >
            <Button onClick={() => setIsCartOpen(true)} className="w-full h-16 rounded-3xl bg-slate-900 text-white shadow-2xl flex items-center justify-between px-8 group">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-white/10 flex items-center justify-center font-black italic">
                   {cart.reduce((acc, i) => acc + i.quantity, 0)}
                </div>
                <span className="font-black uppercase italic tracking-widest text-xs">Ver Carrinho</span>
              </div>
              <span className="font-black italic tracking-tighter text-lg">R$ {subtotal.toFixed(2)}</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer Simulation */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[101] shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-2xl font-black italic uppercase italic tracking-tighter">Meu <span className="text-primary italic">Carrinho</span></h2>
                <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)} className="rounded-xl">
                  <X className="size-6" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <ShoppingCart className="size-20 mb-4 stroke-1" />
                    <p className="font-black uppercase tracking-widest text-[10px]">Seu carrinho está vazio</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4">
                      <div className="size-20 rounded-2xl bg-slate-50 border border-slate-100 shrink-0 overflow-hidden">
                        {item.image_url ? <img src={item.image_url} className="size-full object-cover" /> : <div className="size-full flex items-center justify-center text-slate-300"><Plus className="size-6" /></div>}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between">
                          <h4 className="font-black text-slate-900 uppercase text-xs italic leading-tight">{item.name}</h4>
                          <span className="font-black text-slate-900 italic text-sm">R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => updateQuantity(item.id, -1)} className="size-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                            <Minus className="size-4" />
                          </button>
                          <span className="font-black text-xs text-slate-900">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="size-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                            <Plus className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-8 border-t border-slate-100 bg-slate-50/50 space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                      <span>Subtotal</span>
                      <span>R$ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                      <span>Entrega Estimada</span>
                      <span>R$ {deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                      <span className="font-black uppercase text-slate-900 italic tracking-widest text-sm">Total</span>
                      <span className="text-3xl font-black text-primary italic tracking-tighter">R$ {total.toFixed(2)}</span>
                    </div>
                  </div>
                  <Button onClick={() => setIsCheckoutOpen(true)} className="w-full h-16 rounded-[32px] bg-slate-900 text-white font-black uppercase italic tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                    Finalizar Pedido <ChevronRight className="size-5" />
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-xl rounded-[40px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-8 bg-slate-900 text-white relative">
             <div className="relative z-10">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Quase <span className="text-primary italic">Pronto!</span></h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Confirme seus dados para entrega</p>
             </div>
          </div>
          <div className="p-8 space-y-6 bg-white overflow-y-auto max-h-[70vh]">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Seu Nome</Label>
                <Input placeholder="Como te chamamos?" className="h-12 rounded-xl bg-slate-50 border-none font-bold" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">WhatsApp</Label>
                <Input placeholder="(00) 00000-0000" className="h-12 rounded-xl bg-slate-50 border-none font-bold" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                 <div className="space-y-2 col-span-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">CEP</Label>
                  <Input placeholder="00000-000" className="h-12 rounded-xl bg-slate-50 border-none font-bold" value={customerInfo.cep} onChange={e => setCustomerInfo({...customerInfo, cep: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Endereço de Entrega</Label>
                  <Input placeholder="Rua, Número, Bairro" className="h-12 rounded-xl bg-slate-50 border-none font-bold" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
               <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Forma de Pagamento</Label>
               <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setCustomerInfo({...customerInfo, payment_method: "pix"})}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                      customerInfo.payment_method === "pix" ? "border-primary bg-pink-50 text-primary" : "border-slate-100 bg-white text-slate-400"
                    )}
                  >
                    <QrCode className="size-5" />
                    <span className="font-black uppercase text-[10px] tracking-widest">PIX</span>
                  </button>
                  <button 
                    onClick={() => setCustomerInfo({...customerInfo, payment_method: "card"})}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                      customerInfo.payment_method === "card" ? "border-primary bg-pink-50 text-primary" : "border-slate-100 bg-white text-slate-400"
                    )}
                  >
                    <CreditCard className="size-5" />
                    <span className="font-black uppercase text-[10px] tracking-widest">Cartão</span>
                  </button>
               </div>
            </div>

            <div className="p-6 bg-slate-900 rounded-[32px] text-white">
               <div className="flex justify-between items-center mb-1">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Valor com Entrega</span>
                 <Badge className="bg-primary text-white font-black italic">R$ {total.toFixed(2)}</Badge>
               </div>
               <p className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">* Confirmaremos o prazo via WhatsApp</p>
            </div>
            
            <Button onClick={handleSubmitOrder} className="w-full h-16 rounded-3xl bg-primary hover:bg-primary/90 text-white font-black uppercase italic tracking-[0.2em] shadow-xl transition-all active:scale-95">
              Enviar Pedido Agora 🚀
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
