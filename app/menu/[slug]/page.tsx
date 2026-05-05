"use client"

import { useState, useEffect, use, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ShoppingCart, 
  Search, 
  Star, 
  Clock, 
  MapPin, 
  ChevronLeft, 
  Share2, 
  Heart,
  MessageCircle,
  AlertCircle,
  Globe
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Modular Components
import { MenuCategoryBar } from "@/components/menu/MenuCategoryBar"
import { ProductCard } from "@/components/menu/ProductCard"
import { ProductModal } from "@/components/menu/ProductModal"
import { CartDrawer } from "@/components/menu/CartDrawer"
import { CheckoutFlow } from "@/components/menu/CheckoutFlow"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image_url?: string
  variation?: any
  extras?: any[]
  observation?: string
  totalItemPrice: number
}

function MenuContent({ params }: { params: { slug: string } }) {
  const { slug } = params
  const router = useRouter()
  const searchParams = useSearchParams()
  const isPreview = searchParams.get('preview') === 'true'
  
  // Data State
  const [company, setCompany] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deliverySettings, setDeliverySettings] = useState<any>(null)
  const [storeSettings, setStoreSettings] = useState<any>(null)
  const [storeStatus, setStoreStatus] = useState<any>(null)
  
  // UI State
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([])
  const [deliveryFee, setDeliveryFee] = useState(0)

  // Marketing & Coupons (Keeping logic from original)
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [discountAmount, setDiscountAmount] = useState(0)

  // Initialization
  useEffect(() => {
    fetchMenuData()
    const savedCart = localStorage.getItem(`cart_${slug}`)
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (e) {
        console.error("Error parsing cart", e)
      }
    }
  }, [slug])

  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem(`cart_${slug}`, JSON.stringify(cart))
    } else {
      localStorage.removeItem(`cart_${slug}`)
    }
  }, [cart, slug])

  async function fetchMenuData() {
    try {
      setLoading(true)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug)

      // 1. Try search by menu_slug in companies
      const { data: companyBySlug } = await supabase
        .from('companies')
        .select('*')
        .eq('menu_slug', slug)
        .maybeSingle()
      
      let finalCompanyData = companyBySlug
      let targetId = companyBySlug?.id

      // 2. Try search by slug in tenants
      if (!targetId) {
        const { data: tenantBySlug } = await supabase
          .from('tenants')
          .select('*')
          .eq('slug', slug)
          .maybeSingle()
        
        if (tenantBySlug) {
          targetId = tenantBySlug.id
          finalCompanyData = tenantBySlug
        }
      }

      // 3. Try search by ID (if slug is UUID)
      if (!targetId && isUUID) {
        const { data: companyById } = await supabase
          .from('companies')
          .select('*')
          .eq('id', slug)
          .maybeSingle()
        
        if (companyById) {
          targetId = companyById.id
          finalCompanyData = companyById
        } else {
          const { data: tenantById } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', slug)
            .maybeSingle()
          
          if (tenantById) {
            targetId = tenantById.id
            finalCompanyData = tenantById
          }
        }
      }

      if (!targetId) {
         setCompany(null)
         setLoading(false)
         return
      }
      
      setCompany(finalCompanyData)

      const [catRes, prodRes, delSettings] = await Promise.all([
        supabase.from('product_categories').select('*').eq('tenant_id', targetId).eq('active', true).order('position'),
        supabase.from('products').select('*').eq('tenant_id', targetId).eq('active', true).order('position', { ascending: true }),
        supabase.from('delivery_settings').select('*').eq('tenant_id', targetId).maybeSingle()
      ])

      setCategories(catRes.data || [])
      setProducts(prodRes.data || [])
      
      // 4. Fetch Store Settings for "Single Source of Truth" Status
      const { data: sSettings } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_id', targetId)
        .maybeSingle()
      
      setStoreSettings(sSettings)

      if (delSettings.data) {
        setDeliverySettings(delSettings.data)
        setDeliveryFee(Number(delSettings.data.taxa_base) || 0)
      }

      if (!isPreview) {
        // Track View
        supabase.from('menu_views').insert({ company_id: targetId, user_agent: navigator.userAgent }).then()
      }
      
    } catch (error: any) {
      console.error("Error fetching menu data:", error)
      toast.error("Erro ao carregar o cardápio.")
    } finally {
      setLoading(false)
    }
  }

  // Realtime Sync
  useEffect(() => {
    if (!company?.id) return

    const targetId = company.id
    const channel = supabase
      .channel(`menu-realtime-${targetId}`)
      .on('postgres_changes', { 
         event: '*', 
         schema: 'public', 
         table: 'products', 
         filter: `tenant_id=eq.${targetId}` 
      }, async () => {
         const { data } = await supabase
           .from('products')
           .select('*')
           .eq('tenant_id', targetId)
           .eq('active', true)
           .order('position', { ascending: true })
         if (data) setProducts(data)
      })
      .on('postgres_changes', {
         event: 'UPDATE',
         schema: 'public',
         table: 'companies',
         filter: `id=eq.${targetId}`
      }, (payload) => {
         setCompany((prev: any) => ({ ...prev, ...payload.new }))
      })
      .subscribe()

    // Status Realtime Sync
    const statusChannel = supabase
      .channel(`store-status-${targetId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'store_settings',
        filter: `store_id=eq.${targetId}`
      }, (payload) => {
        setStoreSettings(payload.new)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(statusChannel)
    }
  }, [company?.id])

  // Calculate status whenever settings change or every minute
  useEffect(() => {
    if (!storeSettings) return
    const { getStoreStatus } = require("@/lib/storeStatus")
    const status = getStoreStatus(storeSettings)
    setStoreStatus(status)
    
    // Auto-refresh status if outside hours
    if (!status.isOpen) {
        const timer = setInterval(() => {
            setStoreStatus(getStoreStatus(storeSettings))
        }, 30000)
        return () => clearInterval(timer)
    }
  }, [storeSettings])

  // Cart Actions
  const addToCart = (customizedItem: any) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => 
        item.id === customizedItem.id && 
        JSON.stringify(item.variation) === JSON.stringify(customizedItem.variation) &&
        JSON.stringify(item.extras) === JSON.stringify(customizedItem.extras) &&
        item.observation === customizedItem.observation
      )

      if (existingIndex > -1) {
        const newCart = [...prev]
        newCart[existingIndex].quantity += customizedItem.quantity
        const unitPrice = customizedItem.totalItemPrice / customizedItem.quantity
        newCart[existingIndex].totalItemPrice = unitPrice * newCart[existingIndex].quantity
        return newCart
      }

      return [...prev, customizedItem]
    })
    toast.success(`${customizedItem.name} adicionado à sacola!`)
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta)
        const unitPrice = item.totalItemPrice / item.quantity
        return { ...item, quantity: newQty, totalItemPrice: unitPrice * newQty }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
    toast.info("Item removido da sacola.")
  }

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.totalItemPrice, 0)
  const total = Math.max(0, subtotal + deliveryFee - discountAmount)

  // Order Submission (RESTORED ADVANCED LOGIC)
  const handleOrderSubmit = async (orderData: any) => {
    try {
      const fullAddress = orderData.delivery_type === 'entrega' 
        ? `${orderData.address}, ${orderData.number} ${orderData.complement || ''} - ${orderData.neighborhood}` 
        : "Retirada no Local"

      // 1. CRM: Find or Create Client
      let clientId = ""
      const { data: existingClient } = await supabase
        .from('clientes')
        .select('id')
        .eq('company_id', company.id)
        .eq('phone', orderData.phone)
        .maybeSingle()

      if (existingClient) {
        clientId = existingClient.id
      } else {
        const { data: newClient, error: clientErr } = await supabase
          .from('clientes')
          .insert({
            company_id: company.id,
            name: orderData.name,
            phone: orderData.phone
          })
          .select()
          .single()
        if (clientErr) throw clientErr
        clientId = newClient.id
      }

      // 2. Create Professional Order via Central API
      const orderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: company.id,
          cliente_id: clientId,
          tipo_pedido: orderData.delivery_type,
          valor_total: total,
          taxa_entrega: orderData.delivery_type === 'entrega' ? deliveryFee : 0,
          desconto: discountAmount,
          cupom_id: appliedCoupon?.id,
          endereco_entrega: fullAddress,
          observacoes: orderData.notes,
          payment_method: orderData.payment_method,
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.totalItemPrice,
            variation: item.variation,
            extras: item.extras,
            observation: item.observation
          })),
           precisa_troco: orderData.precisa_troco,
          valor_pago: orderData.valor_pago,
          troco: orderData.troco,
          distance_km: orderData.distance_km,
          estimated_time: orderData.estimated_time,
          duration_minutes: orderData.duration_minutes
        })
      })

      const orderResult = await orderResponse.json()
      if (!orderResult.success) throw new Error(orderResult.error || 'Erro ao criar pedido')
      const newOrderId = orderResult.orderId

      // 3. Legacy tracking (optional but kept for compatibility)
      await supabase.from('menu_orders').insert({
        id: newOrderId,
        company_id: company.id,
        customer_name: orderData.name,
        customer_phone: orderData.phone,
        customer_address: fullAddress,
        subtotal,
        delivery_fee: orderData.delivery_type === 'entrega' ? deliveryFee : 0,
        total,
        payment_method: orderData.payment_method,
        notes: orderData.notes,
         precisa_troco: orderData.precisa_troco,
        valor_pago: orderData.valor_pago,
        troco: orderData.troco,
        distance_km: orderData.distance_km,
        estimated_time: orderData.estimated_time
      })

      // We return the result to CheckoutFlow which will manage the next steps
      // (Payment generation, Polling, Success UI, and final redirection)
      return orderResult

    } catch (error: any) {
      console.error(error)
      throw error // Re-throw so CheckoutFlow can handle the error state
    }
  }

  // Filtering
  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === "all" || p.category_id === activeCategory
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="size-10 border-4 border-slate-100 border-t-red-500 rounded-full" />
    </div>
  )

  if (!company) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <AlertCircle className="size-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold italic tracking-tighter uppercase">Empresa não encontrada</h1>
      <Button className="mt-6 bg-red-500 rounded-xl" onClick={() => router.push('/')}>Voltar</Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-white pb-32 font-sans">
      {/* 🔝 TOP BAR (FIDELITY) */}
      <div className="bg-[#1a56db] text-white py-2 px-4 flex items-center justify-between sticky top-0 z-[60] shadow-md">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-blue-900 flex items-center justify-center text-[10px] font-bold">W</div>
          <span className="text-[11px] font-bold uppercase tracking-wider">4 Pontos — Ganhe pontos e recompensas!</span>
        </div>
        {cart.length > 0 && (
          <button 
            onClick={() => setIsCartOpen(true)}
            className="text-[11px] font-black uppercase italic flex items-center gap-1 hover:underline"
          >
            Ver meu pedido ›
          </button>
        )}
      </div>

      {/* 🖼️ BANNER & LOGO */}
      <div className="relative h-40 md:h-48 w-full">
        <img 
          src={company.cover_url || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=1000"} 
          className="size-full object-cover" 
          alt={company.name}
        />
        
        {/* Social & Info Icons */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
           <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md rounded-full px-2 py-1">
             <Button variant="ghost" size="icon" className="size-8 text-white rounded-full hover:bg-white/20">
               <MessageCircle className="size-4" />
             </Button>
             <Button variant="ghost" size="icon" className="size-8 text-white rounded-full hover:bg-white/20">
               <Share2 className="size-4" />
             </Button>
             <Button variant="ghost" size="icon" className="size-8 text-white rounded-full hover:bg-white/20">
               <Globe className="size-4" />
             </Button>
           </div>
           <Button variant="ghost" size="icon" className="size-10 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/20">
             <AlertCircle className="size-5" />
           </Button>
        </div>

        {/* Logo Circular over banner */}
        <div className="absolute -bottom-10 left-6 z-20">
          <div className="size-24 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden p-0.5">
             <img src={company.logo_url || "https://api.dicebear.com/7.x/initials/svg?seed=" + company.name} className="size-full object-cover rounded-full" alt="Logo" />
          </div>
        </div>
      </div>

      {/* 🏪 STORE INFO */}
      <div className="max-w-4xl mx-auto px-6 pt-12">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900">{company.name}</h1>
          {storeStatus?.isOpen ? (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold">
               <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
               Aberto
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[10px] font-bold">
               <span className="size-1.5 rounded-full bg-rose-500" />
               Fechado
            </div>
          )}
        </div>
        
        <div className="mt-4">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input 
                placeholder="Buscar no cardápio..."
                className="h-11 pl-11 pr-4 rounded-xl bg-slate-100 border-none text-sm font-medium focus-visible:ring-blue-500/20"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
      </div>

      {/* Sticky Categories */}
      <div className="mt-8">
        <MenuCategoryBar 
          categories={categories} 
          activeCategory={activeCategory} 
          onCategoryChange={setActiveCategory} 
        />
      </div>

      {/* Products Display */}
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-12">
        {categories
          .filter(cat => activeCategory === "all" || cat.id === activeCategory)
          .map(cat => {
            const catProducts = filteredProducts.filter(p => p.category_id === cat.id)
            if (catProducts.length === 0) return null
            return (
              <div key={cat.id} className="space-y-6">
                <div className="flex items-center gap-4 ml-2">
                  <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-slate-800">{cat.name}</h2>
                  <div className="h-px flex-1 bg-slate-200/50" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {catProducts.map(p => (
                    <ProductCard 
                      key={p.id} 
                      product={p} 
                      onClick={setSelectedProduct} 
                      onAddClick={storeStatus?.isOpen ? setSelectedProduct : () => toast.error("Loja fechada no momento.")} 
                    />
                  ))}
                </div>
              </div>
            )
          })}
      </div>

      {/* Floating Bottom Cart Bar */}
      <AnimatePresence>
        {cart.length > 0 && !isCartOpen && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 z-50 md:max-w-md md:left-1/2 md:-translate-x-1/2"
          >
            <Button 
              onClick={() => setIsCartOpen(true)}
              className="w-full h-16 rounded-[24px] bg-slate-900 text-white shadow-2xl flex justify-between px-8 group active:scale-95 transition-all overflow-hidden border border-white/10"
            >
              <div className="flex items-center gap-4">
                 <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center relative">
                    <ShoppingCart className="size-5" />
                    <span className="absolute -top-1 -right-1 size-5 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-900">
                      {cart.reduce((acc, i) => acc + i.quantity, 0)}
                    </span>
                 </div>
                 <div className="text-left leading-none space-y-1">
                   <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Ver sacola</span>
                   <span className="block text-lg font-black italic tracking-tighter">R$ {total.toFixed(2)}</span>
                 </div>
              </div>
              <span className="text-xs font-black uppercase italic tracking-widest flex items-center gap-2">
                Revisar <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals & Sheet */}
      <ProductModal 
        product={selectedProduct} 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        onAddToCart={addToCart} 
      />

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cart} 
        subtotal={subtotal} 
        onUpdateQuantity={updateQuantity} 
        onRemoveItem={removeItem} 
        onCheckout={() => {
          if (!storeStatus?.isOpen) {
            toast.error("A loja fechou enquanto você montava sua sacola.")
            return
          }
          setIsCartOpen(false)
          setIsCheckoutOpen(true)
        }} 
      />

      <CheckoutFlow 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        subtotal={subtotal} 
        deliveryFee={deliveryFee} 
         total={total} 
        tenantId={company?.id}
        onSubmit={handleOrderSubmit}
        onFeeUpdate={setDeliveryFee}
      />

    </div>
  )
}

export default function PublicMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin size-10 border-4 border-slate-100 border-t-red-500 rounded-full" />
      </div>
    }>
      <MenuContent params={resolvedParams} />
    </Suspense>
  )
}

function ArrowRight(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
  )
}
