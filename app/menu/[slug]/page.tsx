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
  Globe,
  X,
  Bell
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
import { MenuHeader } from "@/components/menu/MenuHeader"

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
  const [menuSettings, setMenuSettings] = useState<any>({
    primary_color: "#ff2266",
    background_color: "#ffffff",
    button_color: "#ff2266",
    text_color: "#0f172a",
    button_text: "Pedir no WhatsApp",
    button_style: "rounded",
    menu_layout: "grid",
  })
  
  // UI State
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  
  // Bug 7: Identification State
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [phone, setPhone] = useState('')
  const [foundCustomer, setFoundCustomer] = useState<any>(null)
  const [loadingPhone, setLoadingPhone] = useState(false)
  const [pendingDeliveryType, setPendingDeliveryType] = useState<'local' | 'retirada' | 'delivery'>('delivery')
  const [lastSearchedPhone, setLastSearchedPhone] = useState("")

  const mesa = searchParams?.get('mesa')
  const [isWaiterPopoverOpen, setIsWaiterPopoverOpen] = useState(false)
  const [isCallingWaiter, setIsCallingWaiter] = useState(false)

  const handleWaiterCall = async (type: 'call' | 'bill') => {
    if (!company?.id || !mesa) return
    setIsCallingWaiter(true)
    try {
      const res = await fetch('/api/tables/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: company.id,
          table_number: mesa,
          type
        })
      })
      if (!res.ok) throw new Error("Erro ao chamar garçom")
      toast.success(type === 'call' ? "🛎️ Garçom chamado com sucesso!" : "🧾 Pedido de conta enviado!")
      setIsWaiterPopoverOpen(false)
    } catch (e) {
      console.error(e)
      toast.error("Erro ao enviar chamada.")
    } finally {
      setIsCallingWaiter(false)
    }
  }

  // 500ms Debounce phone query
  useEffect(() => {
    if (!company?.id) return // Wait until company metadata is fully loaded to ensure query is properly tenant-scoped

    const digits = phone.replace(/\D/g, "")
    if (digits.length < 10) {
      setFoundCustomer(null)
      return
    }
    if (digits === lastSearchedPhone) return

    const timer = setTimeout(async () => {
      setLastSearchedPhone(digits)
      setLoadingPhone(true)
      try {
        const res = await fetch(`/api/customers?phone=${digits}&storeId=${company.id}`)
        if (res.ok) {
          const customer = await res.json()
          setFoundCustomer(customer)
          if (customer) {
            sessionStorage.setItem('checkoutCustomer', JSON.stringify(customer))
            toast.success(`👋 Bem-vindo de volta, ${customer.name.split(' ')[0]}! Seus dados serão preenchidos automaticamente.`)
          } else {
            toast.error("Cliente não encontrado. Complete os dados para realizar o cadastro.")
          }
        }
      } catch (e) {
        console.error("Error finding customer", e)
      } finally {
        setLoadingPhone(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [phone, lastSearchedPhone, company?.id])
  
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

      // 5. Fetch Digital Menu Design Settings
      const { data: mSettings } = await supabase
        .from('digital_menu_settings')
        .select('*')
        .eq('company_id', targetId)
        .maybeSingle()
      
      if (mSettings) {
        setMenuSettings(mSettings)
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

      // 1. CRM: Find or Create Client via secure API (handles RLS bypass)
      let clientId = ""
      try {
        const cleanPhone = orderData.phone.replace(/\D/g, '')
        const custRes = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanPhone,
            name: orderData.name,
            storeId: company.id,
            address: orderData.delivery_type === 'entrega' ? {
              street: orderData.address || '',
              number: orderData.number || '',
              neighborhood: orderData.neighborhood || '',
              complement: orderData.complement || ''
            } : null
          })
        })
        if (custRes.ok) {
          const custData = await custRes.json()
          if (custData && custData.id) {
            clientId = custData.id
          }
        }
      } catch (custErr) {
        console.error("Erro no CRM ao salvar cliente:", custErr)
      }

      // 2. Create Professional Order via Central API
      const orderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: company.id,
          cliente_id: clientId,
          customerName: orderData.name,
          customerPhone: orderData.phone,
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
    <div 
      className="min-h-screen pb-32 font-sans"
      style={{ 
        backgroundColor: menuSettings.background_color,
        '--primary-color': menuSettings.primary_color,
        '--text-color': menuSettings.text_color,
        '--button-color': menuSettings.button_color || menuSettings.primary_color,
      } as React.CSSProperties}
    >
      {/* 🔝 TOP BAR (FIDELITY) */}
      <div 
        className="text-white py-2 px-4 flex items-center justify-between sticky top-0 z-[60] shadow-md"
        style={{ backgroundColor: menuSettings.primary_color }}
      >
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

      {/* 🖼️ NEW HEADER (Sweet Savory Style) */}
      <MenuHeader 
        store={{
          name: menuSettings.store_name || company.name,
          logo_url: menuSettings.menu_logo || company.logo_url,
          cover_url: menuSettings.menu_cover || company.cover_url,
          isOpen: storeStatus?.isOpen ?? true,
          deliveryTime: "35-50 min", // We could get this from deliverySettings if available
          minOrder: Number(deliverySettings?.pedido_minimo) || 0
        }} 
      />

      {/* 🔍 SEARCH BAR */}
      <div className="max-w-4xl mx-auto px-6 -mt-2 mb-4">
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
                <div className={cn(
                  "grid gap-4 md:gap-6",
                  menuSettings.menu_layout === 'grid' ? "grid-cols-2" : "grid-cols-1"
                )}>
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

      {/* 🛒 NEW CART BAR (Sweet Savory Style) */}
      <AnimatePresence>
        {cart.length > 0 && !isCartOpen && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 z-50 md:max-w-lg md:left-1/2 md:-translate-x-1/2"
          >
            <Button 
              onClick={() => setIsCartOpen(true)}
              className="w-full h-16 bg-red-600 hover:bg-red-700 text-white shadow-2xl flex justify-between px-6 rounded-2xl group active:scale-95 transition-all overflow-hidden"
            >
              <div className="flex items-center gap-4">
                 <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center relative">
                    <ShoppingCart className="size-5" />
                    <span className="absolute -top-1.5 -right-1.5 size-5 bg-white text-red-600 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-red-600">
                      {cart.reduce((acc, i) => acc + i.quantity, 0)}
                    </span>
                 </div>
                 <div className="text-left leading-none space-y-0.5">
                   <span className="block text-[10px] font-black uppercase tracking-widest text-red-100">Total na sacola</span>
                   <span className="block text-lg font-black italic tracking-tighter">R$ {total.toFixed(2)}</span>
                 </div>
              </div>
              <span className="text-xs font-black uppercase italic tracking-widest flex items-center gap-2">
                VER SACOLA <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
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
        allProducts={products}
        onUpdateQuantity={updateQuantity} 
        onRemoveItem={removeItem} 
        onAddToCart={(p) => {
          // If it's a simple add from suggested
          if (p.id && !p.variation) {
             const fullProduct = products.find(prod => prod.id === p.id)
             if (fullProduct) {
                setSelectedProduct(fullProduct)
                return
             }
          }
          addToCart(p)
        }}
        onCheckout={(type) => {
          if (!storeStatus?.isOpen) {
            toast.error("A loja fechou enquanto você montava sua sacola.")
            return
          }
          setPendingDeliveryType(type)
          setIsCartOpen(false)
          setShowPhoneModal(true) // Trigger Bug 7
        }} 
        subtotal={subtotal}
      />

      {/* BUG 7 — ONBOARDING DE TELEFONE */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 w-full max-w-sm mx-4 shadow-2xl relative"
          >
            <button 
              onClick={() => setShowPhoneModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="size-5" />
            </button>

            <div className="text-center mb-8">
              <div className="text-5xl mb-4">👋</div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Olá! Qual seu número?</h2>
              <p className="text-sm text-slate-500 mt-2">
                Para agilizar seus pedidos futuros e acompanhar a entrega.
              </p>
            </div>
            
            <div className="space-y-4">
              <input
                type="tel"
                value={phone}
                onChange={e => {
                  let v = e.target.value.replace(/\D/g, '')
                  if (v.length <= 11) {
                    if (v.length > 10) {
                      v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`
                    } else if (v.length > 6) {
                      v = `(${v.slice(0,2)}) ${v.slice(2,6)}-${v.slice(6)}`
                    } else if (v.length > 2) {
                      v = `(${v.slice(0,2)}) ${v.slice(2)}`
                    }
                  }
                  setPhone(v)
                }}
                placeholder="(44) 99999-9999"
                className="w-full border-2 border-slate-100 rounded-2xl px-4 py-4 text-xl text-center font-bold tracking-wider focus:outline-none focus:border-red-500 transition-colors"
                autoFocus
              />
              
              {loadingPhone && (
                <p className="text-center text-xs text-slate-400 animate-pulse">
                  Verificando cadastro...
                </p>
              )}

              {foundCustomer && (
                <motion.div 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center"
                >
                  <p className="text-green-700 font-bold text-sm">
                    👋 Bem-vindo de volta, {foundCustomer.name?.split(' ')[0]}!
                  </p>
                  <p className="text-green-600 text-[10px] uppercase font-black tracking-widest mt-1">
                    Seus dados serão preenchidos automaticamente
                  </p>
                </motion.div>
              )}
              
              <Button
                onClick={() => {
                  const digits = phone.replace(/\D/g, '')
                  sessionStorage.setItem('checkoutPhone', digits)
                  sessionStorage.setItem('checkoutDeliveryType', pendingDeliveryType)
                  setShowPhoneModal(false)
                  router.push(`/carrinho?s=${slug}&tipo=${pendingDeliveryType}`)
                }}
                disabled={phone.replace(/\D/g, '').length < 10 && phone.length > 0}
                className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase italic tracking-widest text-lg shadow-lg shadow-red-100 transition-all active:scale-95"
              >
                {foundCustomer 
                  ? `Continuar como ${foundCustomer.name?.split(' ')[0]}`
                  : 'Continuar'
                }
              </Button>
              
              <button
                onClick={() => {
                  sessionStorage.setItem('checkoutDeliveryType', pendingDeliveryType)
                  setShowPhoneModal(false)
                  router.push(`/carrinho?s=${slug}&tipo=${pendingDeliveryType}`)
                }}
                className="w-full py-2 text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Pular por agora
              </button>
            </div>
          </motion.div>
        </div>
      )}

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

      {/* 🛎️ Botão Flutuante Chamar Garçom */}
      {mesa && (
        <>
          <div className={cn(
            "fixed z-[45] transition-all duration-300",
            cart.length > 0 && !isCartOpen
              ? "bottom-28 right-4"
              : "bottom-6 right-4"
          )}>
            <button
              onClick={() => setIsWaiterPopoverOpen(!isWaiterPopoverOpen)}
              className="size-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all outline-none"
              title="Chamar Garçom / Conta"
            >
              <Bell className="size-6 animate-bounce" />
            </button>

            <AnimatePresence>
              {isWaiterPopoverOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-black/10"
                    onClick={() => setIsWaiterPopoverOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute right-0 bottom-16 bg-white rounded-2xl p-4 shadow-2xl border border-slate-100 w-56 z-50 flex flex-col gap-2"
                  >
                    <div className="text-center pb-2 border-b border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Mesa {mesa}</span>
                      <span className="text-xs font-bold text-slate-700">Precisa de atendimento?</span>
                    </div>

                    <button
                      onClick={() => handleWaiterCall('call')}
                      disabled={isCallingWaiter}
                      className="w-full h-11 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 font-black text-xs uppercase italic tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all font-sans"
                    >
                      🛎️ Chamar Garçom
                    </button>

                    <button
                      onClick={() => handleWaiterCall('bill')}
                      disabled={isCallingWaiter}
                      className="w-full h-11 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-black text-xs uppercase italic tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-100 font-sans"
                    >
                      🧾 Pedir Conta
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

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
