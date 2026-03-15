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
  QrCode,
  Search,
  Share2,
  Star,
  Heart,
  ArrowRight,
  MessageCircle,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  
  // New State for Redesign
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [deliverySettings, setDeliverySettings] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [menuSettings, setMenuSettings] = useState<any>({
    primary_color: "#FF4D6D",
    background_color: "#FAFAFA",
    button_color: "#FF4D6D",
    text_color: "#0f172a",
    button_text: "Pedir no WhatsApp",
    button_style: "rounded",
    menu_layout: "grid",
    animation_style: "fade"
  })
  
  // Checkout Form
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: "",
    cep: "",
    notes: "",
    payment_method: "pix"
  })

  // Marketing & Loyalty V3
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)

  useEffect(() => {
    fetchMenuData()
  }, [slug])

  useEffect(() => {
    // Distance-based fee calculation (Blueprint V2)
    // Formula: taxa = taxa_base + (distancia * taxa_por_km)
    if (customerInfo.cep.replace(/\D/g, '').length === 8 && deliverySettings) {
      const taxaBase = deliverySettings.taxa_base || 5
      const taxaPorKm = deliverySettings.taxa_por_km || 1
      const kmMaximo = deliverySettings.km_maximo || 10
      
      // Simulated distance for demo (1-10km) capped at kmMaximo
      const simulatedDist = Math.floor(Math.random() * kmMaximo) + 1
      const calculatedFee = taxaBase + (simulatedDist * taxaPorKm)
      
      setDeliveryFee(calculatedFee)
      toast.info(`Frete calculado p/ ${simulatedDist}km.`, { position: "bottom-center" })
    }
  }, [customerInfo.cep, deliverySettings])

  async function fetchMenuData() {
    try {
      setLoading(true)
      // 1. Fetch Company
      const { data: compData, error: compError } = await supabase
        .from('companies')
        .select('*')
        .eq('menu_slug', slug)
        .single()
      
      if (compError) {
        console.error("Supabase error fetching company:", compError)
        throw compError
      }
      setCompany(compData)

      // 2. Fetch Settings
      const { data: settingsData } = await supabase
        .from('digital_menu_settings')
        .select('*')
        .eq('company_id', compData.id)
        .maybeSingle()

      if (settingsData) {
        setMenuSettings((prev: any) => ({ ...prev, ...settingsData }))
      }

      // 3. Fetch Categories & Products
      const [catRes, prodRes] = await Promise.all([
        supabase.from('menu_categories').select('*').eq('company_id', compData.id).eq('active', true).order('position'),
        supabase.from('menu_products').select('*').eq('company_id', compData.id).eq('active', true).order('position', { ascending: true })
      ])

      setCategories(catRes.data || [])
      setProducts(prodRes.data || [])
      setFilteredProducts(prodRes.data || [])

      // 4. Fetch Owner Phone if not in company
      if (compData.owner_id) {
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('whatsapp')
          .eq('id', compData.owner_id)
          .single()
        
        if (ownerProfile?.whatsapp) {
          setCompany((prev: any) => ({
            ...prev,
            phone: ownerProfile.whatsapp
          }))
        }
      }

      // 5. Fetch Delivery Settings (Professional V2)
      const { data: delSettings } = await supabase
        .from('configuracoes_delivery')
        .select('*')
        .eq('empresa_id', compData.id)
        .maybeSingle()
      
      if (delSettings) {
        setDeliverySettings(delSettings)
        // Update WhatsApp number if set in delivery config
        if (delSettings.whatsapp_number) {
          setCompany((prev: any) => ({ ...prev, phone: delSettings.whatsapp_number }))
        }
      }

      // 6. Track View
      trackView(compData.id)
    } catch (error: any) {
      console.error("Error fetching menu:", error.message)
      toast.error("Cardápio não encontrado ou indisponível.")
    } finally {
      setLoading(false)
    }
  }

  async function trackView(companyId: string) {
    try {
      await supabase.from('menu_views').insert({
        company_id: companyId,
        user_agent: navigator.userAgent
      })
    } catch (err) {
      console.error("Tracking view error:", err)
    }
  }

  async function trackClick(productId: string) {
    try {
      await supabase.from('product_clicks').insert({
        product_id: productId
      })
    } catch (err) {
      console.error("Tracking click error:", err)
    }
  }

  useEffect(() => {
    let result = products

    if (activeCategory !== "all") {
      result = result.filter(p => p.category_id === activeCategory)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.description?.toLowerCase().includes(term)
      )
    }

    setFilteredProducts(result)
  }, [searchTerm, activeCategory, products])

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
  const total = Math.max(0, subtotal + deliveryFee - discountAmount)

  async function handleApplyCoupon() {
    if (!couponCode) return
    setIsValidatingCoupon(true)
    try {
      const { data, error } = await supabase
        .from('cupons')
        .select('*')
        .eq('codigo', couponCode.toUpperCase())
        .eq('empresa_id', company.id)
        .eq('ativo', true)
        .single()

      if (error || !data) {
        toast.error("Cupom inválido ou expirado.")
        setAppliedCoupon(null)
        setDiscountAmount(0)
        return
      }

      if (subtotal < (data.valor_minimo || 0)) {
        toast.error(`Pedido mínimo para este cupom: R$ ${data.valor_minimo}`)
        return
      }

      let discount = 0
      if (data.tipo === 'percentual') {
        discount = subtotal * (data.valor / 100)
      } else if (data.tipo === 'fixo') {
        discount = data.valor
      } else if (data.tipo === 'frete_gratis') {
        discount = deliveryFee
      }

      setAppliedCoupon(data)
      setDiscountAmount(discount)
      toast.success("Cupom aplicado com sucesso! 🎉")
    } catch (e) {
      console.error(e)
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  async function handleSubmitOrder() {
    if (!customerInfo.name || !customerInfo.phone) {
      toast.error("Preencha seu nome e telefone.")
      return
    }

    if (subtotal < parseFloat(company.min_order_value || "0")) {
      toast.error(`O pedido mínimo é de R$ ${parseFloat(company.min_order_value || "0").toFixed(2)}`, {
        icon: <AlertCircle className="size-4 text-rose-500" />
      })
      return
    }

    setIsSubmitting(true)

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

      // --- PROFESSIONAL SAAS INTEGRATION (Blueprint V2) ---
      try {
        // 1. CRM: Find or Create Client
        let clientId = null
        const { data: existingClient } = await supabase
          .from('clientes')
          .select('id')
          .eq('empresa_id', company.id)
          .eq('telefone', customerInfo.phone)
          .maybeSingle()

        if (existingClient) {
          clientId = existingClient.id
        } else {
          const { data: newClient } = await supabase
            .from('clientes')
            .insert({
              empresa_id: company.id,
              nome: customerInfo.name,
              telefone: customerInfo.phone,
              endereco: customerInfo.address
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
          .eq('phone', customerInfo.phone)
          .maybeSingle()
        
        if (existingLegacyClient) {
          legacyClientId = existingLegacyClient.id
        } else {
          const { data: newLegacyClient } = await supabase
            .from('clients')
            .insert({
              company_id: company.id,
              name: customerInfo.name,
              phone: customerInfo.phone,
              address: customerInfo.address
            })
            .select()
            .single()
          if (newLegacyClient) legacyClientId = newLegacyClient.id
        }

        // 2. Insert into professional 'pedidos' table
        const { data: profOrder } = await supabase
          .from('pedidos')
          .insert({
            empresa_id: company.id,
            cliente_id: clientId,
            tipo_pedido: customerInfo.address ? 'delivery' : 'pickup',
            status: 'recebido',
            valor_total: total,
            taxa_entrega: deliveryFee,
            desconto: discountAmount,
            cupom_id: appliedCoupon?.id,
            endereco_entrega: customerInfo.address,
            observacoes: customerInfo.notes,
            payment_method: customerInfo.payment_method
          })
          .select()
          .single()

        // 2.1 Insert into legacy 'orders' table for /dashboard/pedidos compatibility
        await supabase
          .from('orders')
          .insert({
            company_id: company.id,
            user_id: company.owner_id,
            client_id: legacyClientId,
            product_name: cart.map(i => `${i.quantity}x ${i.name}`).join(', '),
            total_value: total,
            deposit_value: customerInfo.payment_method === 'pix' ? total : 0,
            delivery_date: new Date().toISOString(),
            status: 'confirmado',
            installments: 1
          })

        if (profOrder) {
          // 3. Insert professional items
          await supabase
            .from('itens_pedido')
            .insert(cart.map(item => ({
              pedido_id: profOrder.id,
              produto_id: item.id,
              quantidade: item.quantity,
              preco: item.price
            })))

          // 4. Register Coupon Usage if applicable
          if (appliedCoupon) {
            await supabase.from('uso_cupons').insert({
              cupom_id: appliedCoupon.id,
              cliente_id: clientId,
              pedido_id: profOrder.id
            })
            // Increment usage count
            await supabase
              .from('cupons')
              .update({ usos: (appliedCoupon.usos || 0) + 1 })
              .eq('id', appliedCoupon.id)
          }
        }
      } catch (e) {
        console.error("Professional SaaS submission failed:", e)
      }

      toast.success("Pedido enviado com sucesso! 🎉")
      setCart([])
      setIsCheckoutOpen(false)
      setIsCartOpen(false)
      
      // WhatsApp Forwarding
      const message = encodeURIComponent(`Olá! Gostaria de confirmar meu pedido #${order.id.slice(0, 8)}\n\n*Itens:*\n${cart.map(i => `- ${i.quantity}x ${i.name}`).join('\n')}\n\n*Total:* R$ ${total.toFixed(2)}${customerInfo.notes ? `\n\n*Obs:* ${customerInfo.notes}` : ''}`)
      
      const rawPhone = company?.phone || company?.whatsapp || company?.whatsapp_number || ""
      const phone = rawPhone.replace(/\D/g, "")

      if (phone) {
      const url = `https://wa.me/55${phone}?text=${message}`
        window.open(url, "_blank")
      }

    } catch (error: any) {
      console.error("Order submission error:", error)
      toast.error("Erro ao enviar pedido. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="relative">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }} 
          className="size-16 border-4 border-[#FF4D6D]/20 border-t-[#FF4D6D] rounded-full" 
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-2 bg-[#FF4D6D] rounded-full animate-ping" />
        </div>
      </div>
    </div>
  )

  if (!company) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
      <div className="size-24 bg-rose-50 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-xl">
        <AlertCircle className="size-12 text-[#FF4D6D]" />
      </div>
      <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-4">Oooops!</h1>
      <p className="text-slate-500 max-w-xs font-medium leading-relaxed">
        Não encontramos nenhum cardápio para o link <span className="text-slate-900 font-bold">/menu/{slug}</span>.
      </p>
      <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 text-left space-y-4 max-w-sm">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Dicas para o lojista:</h4>
        <ul className="space-y-2">
          <li className="flex gap-2 text-xs font-medium text-slate-600">
            <div className="size-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
            Verifique se você salvou o link nas configurações do perfil.
          </li>
          <li className="flex gap-2 text-xs font-medium text-slate-600">
            <div className="size-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
            Certifique- + que o "slug" (o nome no link) está idêntico.
          </li>
        </ul>
      </div>
      <Button className="mt-10 rounded-2xl bg-[#FF4D6D] hover:bg-[#FF4D6D]/90 h-14 px-10 font-black uppercase italic tracking-widest shadow-xl shadow-pink-100 transition-all active:scale-95" onClick={() => window.location.href = '/'}>
        Voltar para a Home
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen font-sans text-slate-900 pb-32" style={{ backgroundColor: menuSettings.background_color }}>
      {/* 1️⃣ HEADER MODERNO DO RESTAURANTE */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        <motion.img 
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          src={menuSettings.menu_cover || company.cover_url || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=1000"} 
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="bg-white/20 backdrop-blur-md rounded-2xl hover:bg-white/40 text-white"
            onClick={() => window.history.back()}
          >
            <ChevronRight className="size-6 rotate-180" />
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="bg-white/20 backdrop-blur-md rounded-2xl hover:bg-white/40 text-white"
            >
              <Share2 className="size-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="bg-white/20 backdrop-blur-md rounded-2xl hover:bg-white/40 text-white"
            >
              <Heart className="size-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Store Info Card */}
      <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-10">
        <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="size-24 md:size-32 rounded-[32px] bg-white p-1 shadow-lg -mt-16 md:-mt-24 border border-slate-50 shrink-0">
              <div className="size-full rounded-[28px] overflow-hidden bg-slate-50 flex items-center justify-center">
                {menuSettings.menu_logo || company.logo_url ? (
                  <img src={menuSettings.menu_logo || company.logo_url} className="size-full object-cover" />
                ) : (
                  <Star className="size-12" style={{ color: menuSettings.primary_color }} />
                )}
              </div>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-tighter uppercase italic text-slate-900">
                  {menuSettings.store_name || company.name}
                </h1>
                <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  ● Aberto
                </Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 text-slate-500 font-bold text-xs uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <Star className="size-4 text-amber-400 fill-amber-400" />
                  <span className="text-slate-900">4.9</span>
                  <span className="opacity-40">(100+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4" style={{ color: menuSettings.primary_color }} />
                  <span>{company.production_time || "30-45 min"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-4" style={{ color: menuSettings.primary_color }} />
                  <span>{company.address_city || "Entrega"}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg">
                  <span className="text-slate-400">Min:</span>
                  <span className="text-slate-900">R$ {parseFloat(company.min_order_value || "0").toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Button 
              className="rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white px-6 h-12 flex gap-3 font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95"
              onClick={() => {
                const rawPhone = company?.phone || company?.whatsapp || company?.whatsapp_number || ""
                const phone = rawPhone.replace(/\D/g, "")

                if (!phone) {
                  toast.error("WhatsApp da loja não configurado.")
                  return
                }

                const message = encodeURIComponent(
                  `Olá! Vim pelo cardápio ${company.name} e gostaria de fazer um pedido.`
                )

                const url = `https://wa.me/55${phone}?text=${message}`
                window.open(url, "_blank")
              }}
            >
              <MessageCircle className="size-5" />
              WhatsApp
            </Button>
          </div>
        </div>

        {/* 2️⃣ BARRA DE BUSCA INTELIGENTE */}
        <div className="mt-8 sticky top-4 z-50">
          <div className="relative group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="size-5 text-slate-400 group-focus-within:text-[#FF4D6D] transition-colors" />
            </div>
            <Input 
              placeholder="Buscar no cardápio..." 
              className="h-16 pl-14 pr-6 rounded-3xl bg-white border-none shadow-lg shadow-slate-200/50 text-base font-medium transition-all focus-visible:ring-2 focus-visible:ring-[#FF4D6D]/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">
        {/* 3️⃣ MENU DE CATEGORIAS FIXO (SCROLL HORIZONTAL) */}
        <div className="sticky top-24 z-40 -mx-6 px-6 py-4 bg-[#FAFAFA]/95 backdrop-blur-md border-b border-slate-100 overflow-x-auto no-scrollbar">
          <div className="flex gap-3 min-w-max">
            <button 
              onClick={() => setActiveCategory("all")}
              className={cn(
                "px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm",
                activeCategory === "all" ? "text-white" : "bg-white text-slate-400 hover:text-slate-600 border border-slate-100"
              )}
              style={activeCategory === "all" ? { backgroundColor: menuSettings.primary_color } : {}}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id} 
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm",
                  activeCategory === cat.id ? "text-white" : "bg-white text-slate-400 hover:text-slate-600 border border-slate-100"
                )}
                style={activeCategory === cat.id ? { backgroundColor: menuSettings.primary_color } : {}}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* 4️⃣ LISTA DE PRODUTOS EM CARDS MODERNOS */}
        <div className="space-y-12">
          {categories
            .filter(cat => activeCategory === "all" || cat.id === activeCategory)
            .map(cat => {
              const categoryProducts = filteredProducts.filter(p => p.category_id === cat.id)
              if (categoryProducts.length === 0) return null

              return (
                <div key={cat.id} className="space-y-8">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
                      {cat.name}
                    </h2>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {categoryProducts.map(prod => (
                      <motion.div 
                        key={prod.id} 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        whileHover={{ y: -4 }}
                        className="bg-white p-6 rounded-[32px] border border-slate-100 flex gap-6 cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden"
                        onClick={() => {
                          setSelectedProduct(prod)
                          trackClick(prod.id)
                        }}
                      >
                        {/* Status Badge */}
                        {prod.is_highlight || prod.name.toLowerCase().includes('bolo') ? (
                          <div 
                            className="absolute top-0 left-0 text-white text-[9px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-br-2xl z-20 shadow-lg animate-pulse"
                            style={{ backgroundColor: menuSettings.primary_color }}
                          >
                            🔥 MAIS VENDIDO
                          </div>
                        ) : null}

                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div className="space-y-2">
                            <h3 
                              className="font-black text-slate-900 uppercase italic leading-tight text-lg transition-colors"
                              style={{ color: menuSettings.text_color }}
                            >
                              {prod.name}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">{prod.description}</p>
                          </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-black text-slate-900 italic tracking-tighter">R$ {parseFloat(prod.price).toFixed(2)}</span>
                            </div>
                            <Button 
                              size="icon"
                              className={cn(
                                "size-10 shadow-lg transition-all active:scale-95 group/btn",
                                menuSettings.button_style === 'rounded' ? "rounded-full" : "rounded-2xl"
                              )}
                              style={{ backgroundColor: menuSettings.button_color, color: '#fff' }}
                              onClick={(e) => {
                                e.stopPropagation()
                                addToCart(prod)
                                trackClick(prod.id)
                              }}
                            >
                              <Plus className="size-5 group-hover/btn:rotate-90 transition-transform" />
                            </Button>
                        </div>

                        <div className="size-28 md:size-32 rounded-3xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100 relative group-hover:scale-105 transition-transform duration-700">
                          {prod.image_url ? (
                            <img src={prod.image_url} alt={prod.name} className="size-full object-cover" />
                          ) : (
                            <div className="size-full flex items-center justify-center text-slate-200">
                              <Star className="size-10" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* 6️⃣ CARRINHO FLUTUANTE */}
      <AnimatePresence>
        {cart.length > 0 && !isCartOpen && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-6 right-6 z-50 md:max-w-md md:left-1/2 md:-translate-x-1/2"
          >
            <Button 
              onClick={() => setIsCartOpen(true)} 
              className="w-full h-16 rounded-[32px] bg-slate-900 text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-between px-8 group active:scale-95 transition-all outline-none ring-offset-2 ring-slate-900 focus:ring-2 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-2xl bg-white/10 flex items-center justify-center relative">
                   <ShoppingCart className="size-5" />
                   <span 
                    className="absolute -top-1.5 -right-1.5 size-5 text-white text-[10px] items-center justify-center flex font-black rounded-full border-2 border-slate-900"
                    style={{ backgroundColor: menuSettings.primary_color }}
                   >
                    {cart.reduce((acc, i) => acc + i.quantity, 0)}
                   </span>
                </div>
                <div className="text-left">
                  <span className="block font-black uppercase italic tracking-widest text-[10px] leading-none mb-1 text-slate-400">Ver sacola</span>
                  <span className="block font-black italic tracking-tighter text-lg leading-none">R$ {subtotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 font-black uppercase italic text-[10px] tracking-widest">
                Revisar 
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5️⃣ MODAL DO PRODUTO */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-2xl rounded-[40px] p-0 overflow-hidden border-none shadow-2xl">
          {selectedProduct && (
            <div className="flex flex-col">
              <div className="relative h-64 md:h-80 w-full">
                {selectedProduct.image_url ? (
                  <img src={selectedProduct.image_url} className="size-full object-cover" />
                ) : (
                  <div className="size-full bg-slate-50 flex items-center justify-center text-slate-100 italic font-black text-4xl">
                    DOCE GESTÃO
                  </div>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-6 right-6 bg-black/20 backdrop-blur-md rounded-2xl hover:bg-black/40 text-white"
                  onClick={() => setSelectedProduct(null)}
                >
                  <X className="size-6" />
                </Button>
              </div>
              
              <div className="p-10 space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                      {selectedProduct.name}
                    </h2>
                    <span className="text-3xl font-black text-[#FF4D6D] italic tracking-tighter shrink-0">
                      R$ {selectedProduct.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    {selectedProduct.description || "Sem descrição disponível."}
                  </p>
                </div>

                <div className="h-px bg-slate-100" />

                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center bg-slate-50 rounded-2xl p-1 shrink-0 border border-slate-100">
                    <button 
                      className="size-12 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all active:scale-90"
                      onClick={() => updateQuantity(selectedProduct.id, -1)}
                    >
                      <Minus className="size-5" />
                    </button>
                    <span className="w-12 text-center font-black text-lg">
                      {cart.find(i => i.id === selectedProduct.id)?.quantity || 1}
                    </span>
                    <button 
                      className="size-12 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all active:scale-90"
                      onClick={() => addToCart(selectedProduct)}
                    >
                      <Plus className="size-5" />
                    </button>
                  </div>

                  <Button 
                    className="flex-1 h-14 rounded-2xl bg-[#FF4D6D] hover:bg-[#FF4D6D]/90 text-white font-black uppercase italic tracking-widest shadow-lg shadow-pink-100 transition-all active:scale-95"
                    onClick={() => {
                      addToCart(selectedProduct)
                      setSelectedProduct(null)
                    }}
                  >
                    Adicionar ao Pedido
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 7️⃣ CHECKOUT RÁPIDO / CARRINHO */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[101] shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter">Sua <span className="text-[#FF4D6D]">Sacola</span></h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cart.length} itens selecionados</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsCartOpen(false)} 
                  className="rounded-2xl bg-slate-50 hover:bg-slate-100"
                >
                  <X className="size-6 text-slate-400" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-none">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                    <div className="size-24 bg-slate-50 rounded-[32px] flex items-center justify-center mb-6">
                      <ShoppingCart className="size-10 stroke-1" />
                    </div>
                    <p className="font-black uppercase tracking-widest text-xs italic">Sua sacola está vazia</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-6 group">
                      <div className="size-20 rounded-3xl bg-slate-50 border border-slate-100 shrink-0 overflow-hidden relative">
                        {item.image_url ? <img src={item.image_url} className="size-full object-cover" /> : <Star className="size-8 text-slate-200" />}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="font-black text-slate-900 uppercase text-xs italic leading-tight">{item.name}</h4>
                          <span className="font-black text-slate-900 italic text-sm shrink-0">R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-slate-50 rounded-xl p-0.5 border border-slate-100">
                            <button onClick={() => updateQuantity(item.id, -1)} className="size-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white transition-all">
                              <Minus className="size-3" />
                            </button>
                            <span className="w-8 text-center font-black text-xs">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="size-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white transition-all">
                              <Plus className="size-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-8 border-t border-slate-100 bg-[#FAFAFA] space-y-6 rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
                  <div className="space-y-4">
                    {/* Voucher / Coupon V3 */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cupom de Desconto</p>
                       <div className="flex gap-2">
                          <Input 
                            placeholder="CÓDIGO" 
                            className="h-12 rounded-xl bg-slate-50 border-none font-bold placeholder:text-slate-300"
                            value={couponCode}
                            onChange={e => setCouponCode(e.target.value.toUpperCase())}
                            disabled={!!appliedCoupon}
                          />
                          <Button 
                            className={cn(
                              "h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all",
                              appliedCoupon ? "bg-emerald-500 hover:bg-emerald-600" : "bg-slate-900 hover:bg-slate-800"
                            )}
                            onClick={appliedCoupon ? () => { setAppliedCoupon(null); setDiscountAmount(0); setCouponCode(""); } : handleApplyCoupon}
                            disabled={isValidatingCoupon}
                          >
                            {isValidatingCoupon ? "..." : appliedCoupon ? "Remover" : "Aplicar"}
                          </Button>
                       </div>
                       {appliedCoupon && (
                         <div className="flex items-center gap-2 text-emerald-600">
                           <CheckCircle2 className="size-4" />
                           <span className="text-[10px] font-black uppercase tracking-widest">
                             Cupom {appliedCoupon.codigo} aplicado! (- R$ {discountAmount.toFixed(2)})
                           </span>
                         </div>
                       )}
                    </div>

                    {/* Loyalty Points Preview V3 */}
                    <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100/50 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="size-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                             <Star className="size-5 fill-current" />
                          </div>
                          <div className="space-y-0.5">
                             <p className="text-[10px] font-black uppercase text-amber-600/60 tracking-widest leading-none">Programa de Pontos</p>
                             <p className="font-black text-slate-900 uppercase italic tracking-tight text-xs">Você ganhará <span className="text-amber-600">{Math.floor(subtotal)} pontos</span></p>
                          </div>
                       </div>
                    </div>

                    <div className="flex justify-between items-center px-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total do pedido</span>
                      <div className="text-right">
                         {discountAmount > 0 && <p className="text-xs font-bold text-rose-500 line-through opacity-50">R$ {(subtotal + deliveryFee).toFixed(2)}</p>}
                         <span className="text-3xl font-black text-slate-900 italic tracking-tighter">R$ {total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => {
                        setIsCheckoutOpen(true)
                        setIsCartOpen(false) // Fechar o carrinho ao abrir o checkout para evitar conflitos de overlay
                    }} 
                    className="w-full h-16 rounded-[32px] bg-[#FF4D6D] text-white font-black uppercase italic tracking-[0.2em] shadow-xl shadow-pink-100 flex items-center justify-center gap-4 active:scale-95 transition-all outline-none"
                  >
                    Confirmar Pedido <ArrowRight className="size-5" />
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Dialog remains mostly same but styled */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-xl rounded-[40px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-10 bg-slate-900 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 size-32 bg-[#FF4D6D] rounded-full blur-[80px] opacity-20" />
             <div className="relative z-10">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2 leading-none">Finalizar <span className="text-[#FF4D6D]">Pedido</span></h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Só mais alguns detalhes</p>
             </div>
          </div>
          <div className="p-10 space-y-8 bg-white overflow-y-auto max-h-[70vh] no-scrollbar">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nome</Label>
                <Input placeholder="Seu nome" className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6 focus-visible:ring-1 focus-visible:ring-[#FF4D6D]/20" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">WhatsApp</Label>
                <Input placeholder="(00) 00000-0000" className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6 focus-visible:ring-1 focus-visible:ring-[#FF4D6D]/20" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Endereço de Entrega</Label>
              <Input placeholder="Rua, Número, Bairro, Cidade" className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6 focus-visible:ring-1 focus-visible:ring-[#FF4D6D]/20" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} />
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Observações</Label>
              <Textarea placeholder="Ex: Sem cebola, tirar troco para R$ 50..." className="min-h-24 rounded-2xl bg-slate-50 border-none font-bold p-6 focus-visible:ring-1 focus-visible:ring-[#FF4D6D]/20 resize-none" value={customerInfo.notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomerInfo({...customerInfo, notes: e.target.value})} />
            </div>

            <div className="space-y-4">
               <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Forma de Pagamento</Label>
               <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setCustomerInfo({...customerInfo, payment_method: "pix"})}
                    className={cn(
                      "flex items-center flex-col gap-3 p-6 rounded-3xl border-2 transition-all",
                      customerInfo.payment_method === "pix" ? "border-[#FF4D6D] bg-[#FFF0F3] text-[#FF4D6D] shadow-lg shadow-pink-50 scale-[1.02]" : "border-slate-50 bg-slate-50 text-slate-400 opacity-60 hover:opacity-100"
                    )}
                  >
                    <QrCode className="size-6" />
                    <span className="font-black uppercase text-[10px] tracking-widest">PIX</span>
                  </button>
                  <button 
                    onClick={() => setCustomerInfo({...customerInfo, payment_method: "card"})}
                    className={cn(
                      "flex items-center flex-col gap-3 p-6 rounded-3xl border-2 transition-all",
                      customerInfo.payment_method === "card" ? "border-[#FF4D6D] bg-[#FFF0F3] text-[#FF4D6D] shadow-lg shadow-pink-50 scale-[1.02]" : "border-slate-50 bg-slate-50 text-slate-400 opacity-60 hover:opacity-100"
                    )}
                  >
                    <CreditCard className="size-6" />
                    <span className="font-black uppercase text-[10px] tracking-widest">Cartão / Dinheiro</span>
                  </button>
               </div>
            </div>

            <Button 
              onClick={handleSubmitOrder} 
              disabled={isSubmitting}
              className="w-full h-18 rounded-[32px] bg-[#FF4D6D] hover:bg-[#FF4D6D]/90 text-white font-black uppercase italic tracking-[0.2em] shadow-2xl transition-all active:scale-95 py-8"
            >
              {isSubmitting ? "Enviando..." : "Enviar para o WhatsApp 🚀"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
