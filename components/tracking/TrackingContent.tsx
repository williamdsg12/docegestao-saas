"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { 
  ChevronLeft, 
  MessageCircle, 
  Truck, 
  Clock, 
  Check, 
  X, 
  ShoppingBag, 
  User, 
  Home, 
  RefreshCcw,
  MapPin,
  ChevronDown,
  ChevronUp,
  Store,
  CreditCard,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import dynamic from "next/dynamic"

// Dynamically import OrderTrackingMap to avoid Next.js SSR build-time errors
const OrderTrackingMap = dynamic(
  () => import("@/components/tracking/OrderTrackingMap"),
  { 
    ssr: false,
    loading: () => (
      <div className="size-full flex flex-col items-center justify-center bg-slate-50 gap-2">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-[#1a56db] animate-spin" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carregando mapa...</span>
      </div>
    )
  }
)

interface TrackingContentProps {
  orderId: string
}

const ConfettiEffect = () => {
  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {Array.from({ length: 30 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 3;
        const duration = 2 + Math.random() * 2;
        const size = 6 + Math.random() * 6;
        const color = colors[Math.floor(Math.random() * colors.length)];
        return (
          <div 
            key={i}
            className="confetti-particle absolute top-[-10px]"
            style={{
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }}
          />
        );
      })}
      <style jsx global>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        .confetti-particle {
          animation: confetti-fall 4s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function TrackingContent({ orderId }: TrackingContentProps) {
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isResumoExpanded, setIsResumoExpanded] = useState(false)
  const [courierCoords, setCourierCoords] = useState<[number, number] | null>(null)
  const [courierHeading, setCourierHeading] = useState<number | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null)
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("")
  const [showWhatsappModal, setShowWhatsappModal] = useState(false)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)

  // Feedback/Review States
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [suggestion, setSuggestion] = useState("")
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  // Format time helper
  const getFormattedTime = () => {
    const now = new Date()
    return now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  }

  // 1. Fetch order details from API
  const fetchStatus = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const res = await fetch(`/api/tracking/${orderId}`)
      if (!res.ok) throw new Error("Erro ao buscar status")
      const data = await res.json()
      setOrder(data)
      setLastUpdatedTime(getFormattedTime())
      
      // Update courier coordinates and heading if present
      if (data.tracking && data.tracking.latitude && data.tracking.longitude) {
        setCourierCoords([Number(data.tracking.latitude), Number(data.tracking.longitude)])
        setCourierHeading(data.tracking.heading !== null ? Number(data.tracking.heading) : null)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [orderId])

  // 2. Initial fetch & 30-second polling fallback (auto update)
  useEffect(() => {
    fetchStatus()

    if (order && ['entregue', 'completed', 'delivered', 'finalizado'].includes((order.status || "").toLowerCase())) {
      console.log("⏹️ Order delivered. Polling disabled.")
      return
    }

    const interval = setInterval(() => fetchStatus(false), 30000)
    return () => clearInterval(interval)
  }, [fetchStatus, order?.status])

  // 3. Realtime Supabase PubSub listeners
  useEffect(() => {
    if (!orderId) return
    
    if (order && ['entregue', 'completed', 'delivered', 'finalizado'].includes((order.status || "").toLowerCase())) {
      console.log("⏹️ Order delivered. WebSockets disabled.")
      return
    }

    // Status updates
    const orderChannel = supabase
      .channel(`tracking-order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log("⚡ Real-time status update received:", payload.new.order_status)
          fetchStatus()
        }
      )
      .subscribe()

    // GPS location updates
    const gpsChannel = supabase
      .channel(`tracking-gps-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "delivery_tracking",
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          console.log("⚡ Real-time GPS location update received:", payload.new)
          const newGps = payload.new as any
          if (newGps && newGps.latitude && newGps.longitude) {
            setCourierCoords([Number(newGps.latitude), Number(newGps.longitude)])
            setLastUpdatedTime(getFormattedTime())
            if (newGps.heading !== undefined) {
              setCourierHeading(newGps.heading !== null ? Number(newGps.heading) : null)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(orderChannel)
      supabase.removeChannel(gpsChannel)
    }
  }, [orderId, fetchStatus, order?.status])

  // 4. Handle welcome checkout modal on first load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search)
      if (searchParams.get("new") === "true") {
        setShowWelcomeModal(true)
      }
    }
  }, [])

  // 5. Handle WhatsApp receipt share helper
  useEffect(() => {
    if (!order) return

    const orderIdKey = `wa_redirect_${orderId}`
    const alreadyRedirected = localStorage.getItem(orderIdKey)

    // Trigger modal if order status is new/received/pending and it hasn't been shown yet
    const isNew = ['recebido', 'novo', 'pendente', 'pending'].includes((order.status || '').toLowerCase())

    if (isNew && !alreadyRedirected) {
      setShowWhatsappModal(true)
      localStorage.setItem(orderIdKey, 'true')

      // Auto-trigger redirect after 2.5 seconds
      const timer = setTimeout(() => {
        handleWhatsAppRedirect()
      }, 2500)

      return () => clearTimeout(timer)
    }
  }, [order, orderId])

  // 6. Feedback Timer Effect
  useEffect(() => {
    if (!order) return
    const isOrderDelivered = ['entregue', 'completed', 'delivered', 'finalizado'].includes((order.status || "").toLowerCase())
    if (isOrderDelivered) {
      const timer = setTimeout(() => {
        setShowFeedbackForm(true)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [order?.status])

  const getStoreSlug = useCallback(() => {
    if (order?.loja?.slug) return order.loja.slug
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("storeSlug")
      if (stored) return stored
    }
    return "demo" // Default fallback
  }, [order?.loja?.slug])

  const handleBackToCardapio = useCallback(() => {
    const slug = getStoreSlug()
    router.push(`/cardapio/${slug}`)
  }, [getStoreSlug, router])

  const handleWhatsAppRedirect = () => {
    if (!order) return
    
    const itemsText = order.produtos?.map((p: any) => `• ${p.qtd}x ${p.nome}`).join('\n') || ''
    
    const messageText = `Olá! Meu pedido #${order.numero_pedido} foi confirmado 🎉\n\n*Detalhes do Pedido:*\n${itemsText}\n\n*Total:* R$ ${Number(order.pagamento?.valor).toFixed(2)}\n*Pagamento:* ${order.pagamento?.forma || 'Não informado'} (${order.pagamento?.status === 'pago' ? 'Confirmado' : 'Pendente'})\n\n*Endereço de Entrega:*\n${order.endereco}\n\n*Acompanhar Rastreamento:*\n${window.location.origin}/pedido/rastreamento/${orderId}`

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${order.loja?.whatsapp?.replace(/\D/g, '')}&text=${encodeURIComponent(messageText)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleDistanceChange = (dist: number) => {
    setDistance(dist)
    // Speed average: 40 km/h (0.67 km/minute)
    const mins = Math.max(2, Math.round(dist / 0.67))
    setEstimatedMinutes(mins)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <RefreshCcw className="size-10 text-[#1a56db] animate-spin" />
    </div>
  )

  if (!order) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
      <AlertCircle className="size-16 text-rose-500 mb-4" />
      <h1 className="text-xl font-black text-slate-800">Pedido não encontrado</h1>
      <p className="text-slate-500 text-sm max-w-xs mt-1">
        Não conseguimos encontrar as informações deste pedido. Por favor, verifique o link.
      </p>
      <Button onClick={handleBackToCardapio} className="mt-6 bg-[#1a56db] hover:bg-[#1546b0] text-white rounded-xl px-6 py-5 font-bold">
        Voltar ao início
      </Button>
    </div>
  )

  // Timeline Step index resolver
  const getTimelineStepIndex = (dbStatus: string, dist: number | null): number => {
    const s = (dbStatus || "").toLowerCase()
    
    // 1. Entregue (db status delivered or distance <= 30 meters)
    if (['entregue', 'completed', 'delivered', 'finalizado'].includes(s) || (dist !== null && dist <= 0.03)) {
      return 7 // Entregue
    }
    // 2. Saiu para entrega / Em rota / Próximo ao destino
    if (['no_caminho', 'shipped', 'out_for_delivery', 'saiu_entrega', 'a_caminho', 'chegou'].includes(s)) {
      if (dist !== null && dist <= 0.5) {
        return 6 // Próximo ao destino
      }
      if (courierCoords !== null) {
        return 5 // Em rota (active GPS)
      }
      return 4 // Saiu para entrega
    }
    // 3. Pronto
    if (['pronto', 'ready'].includes(s)) {
      return 3 // Pronto
    }
    // 4. Em preparo
    if (['em_preparacao', 'preparo', 'preparing', 'preparando'].includes(s)) {
      return 2 // Em preparo
    }
    // 5. Confirmado
    if (['accepted', 'confirmado'].includes(s)) {
      return 1 // Confirmado
    }
    return 0 // Pedido recebido
  }

  const currentStep = getTimelineStepIndex(order.status, distance)

  const steps = [
    { id: 0, label: "Pedido recebido", desc: "Aguardando confirmação do estabelecimento" },
    { id: 1, label: "Confirmado", desc: "Seu pedido foi aceito pelo estabelecimento" },
    { id: 2, label: "Em preparo", desc: "Seu pedido está sendo produzido com carinho" },
    { id: 3, label: "Pronto", desc: "Sua delícia está embalada e pronta para viagem" },
    { id: 4, label: "Saiu para entrega", desc: "O entregador coletou seu pedido" },
    { id: 5, label: "Em rota", desc: "O entregador está a caminho do seu endereço" },
    { id: 6, label: "Próximo ao destino", desc: "O entregador está chegando na sua localização" },
    { id: 7, label: "Entregue", desc: "Pedido entregue com sucesso. Bom apetite!" }
  ]

  const isDelivered = currentStep === 7
  const hasCourier = order.entregador || courierCoords !== null

  // Calculate dynamic ETA: distance / velocity
  const averageSpeedKmh = order.tracking?.speed && order.tracking.speed > 0 ? (order.tracking.speed * 3.6) : 25
  const calculatedMinutes = distance ? Math.max(1, Math.round((distance / averageSpeedKmh) * 60)) : null

  // If order is delivered, replace interface with the premium thank-you screen
  if (isDelivered) {
    return (
      <div className="min-h-screen bg-slate-50/50 font-sans pb-28 relative flex flex-col items-center select-none">
        <meta name="robots" content="noindex" />
        
        {/* Floating Confetti Effect */}
        <ConfettiEffect />

        <div className="w-full max-w-[500px] bg-white min-h-screen shadow-xl shadow-slate-100 border-x border-slate-100 flex flex-col relative p-6 pt-16">
          {/* Animated Green Checkmark */}
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="size-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100/50 border border-emerald-100 scale-up-check">
              <Check className="size-10 stroke-[3px]" />
            </div>
            
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">✅ Pedido Entregue!</h1>
            <p className="text-slate-500 text-sm max-w-sm">
              Obrigado pela sua compra! Seu pedido foi entregue com sucesso.
            </p>
            <p className="text-lg font-black text-slate-800 tracking-tight pt-1">
              Bom apetite 🍔🍕🍟🥤
            </p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              Esperamos você novamente
            </p>
          </div>

          {/* Success Card */}
          <div className="bg-slate-50/50 rounded-3xl border border-slate-100/80 p-5 space-y-4 shadow-sm mb-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Pedido</span>
                <span className="text-sm font-black text-slate-800">#{order.numero_pedido}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Entregue em</span>
                <span className="text-xs font-bold text-slate-700">
                  {order.delivered_at ? new Date(order.delivered_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : getFormattedTime()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span className="uppercase tracking-wider">Total do Pedido</span>
                <span className="font-black text-slate-900">R$ {Number(order.pagamento?.valor).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span className="uppercase tracking-wider">Forma de Pagamento</span>
                <span className="font-bold text-slate-700">{order.pagamento?.forma}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Itens Consumidos</span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {order.produtos?.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between text-[11px] font-semibold text-slate-600">
                    <span>{p.qtd}x {p.nome}</span>
                    <span className="text-slate-800">R$ {Number(p.valor).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feedback & Evaluation Form */}
          {showFeedbackForm && (
            <div className="bg-white border-2 border-dashed border-slate-100 rounded-3xl p-5 mb-8 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {!reviewSubmitted ? (
                <>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Como foi sua experiência?</h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Sua avaliação ajuda a melhorar nosso serviço</p>
                  </div>

                  {/* Star Rating Selector */}
                  <div className="flex items-center justify-center gap-2 py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="transition-transform active:scale-90 duration-100 hover:scale-110"
                      >
                        <span className={cn(
                          "text-2xl transition-colors duration-200",
                          star <= rating ? "text-amber-400 drop-shadow-[0_2px_4px_rgba(245,158,11,0.2)]" : "text-slate-200"
                        )}>
                          ★
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Custom Text Comments & Suggestions */}
                  <div className="space-y-3">
                    <textarea
                      placeholder="Deixe seu comentário (opcional)"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100/30 focus:bg-white border border-slate-200/60 focus:border-slate-300 focus:outline-none rounded-xl p-3 h-20 transition-all resize-none placeholder:text-slate-400/80"
                    />
                    <textarea
                      placeholder="Tem alguma sugestão de melhoria? (opcional)"
                      value={suggestion}
                      onChange={(e) => setSuggestion(e.target.value)}
                      className="w-full text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100/30 focus:bg-white border border-slate-200/60 focus:border-slate-300 focus:outline-none rounded-xl p-3 h-20 transition-all resize-none placeholder:text-slate-400/80"
                    />
                  </div>

                  <Button
                    onClick={async () => {
                      if (rating === 0) {
                        alert("Por favor, selecione uma nota de 1 a 5 estrelas.")
                        return
                      }
                      try {
                        const { error } = await supabase
                          .from("customer_reviews")
                          .insert({
                            order_id: orderId,
                            company_id: order.loja?.id,
                            tenant_id: order.loja?.id,
                            rating: rating,
                            comment: comment,
                            suggestion: suggestion
                          })
                        
                        if (error) throw error
                        setReviewSubmitted(true)
                      } catch (err) {
                        console.error("Erro ao salvar avaliação:", err)
                        alert("Não foi possível enviar a avaliação no momento. Tente novamente.")
                      }
                    }}
                    className="w-full h-11 bg-slate-950 hover:bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Enviar Avaliação
                  </Button>
                </>
              ) : (
                <div className="py-4 space-y-2 animate-in zoom-in-95 duration-300">
                  <div className="size-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Check className="size-6 stroke-[3px]" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Obrigado por nos ajudar a melhorar!</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sua avaliação foi salva com sucesso.</p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3.5 mt-auto">
            <Button
              onClick={handleBackToCardapio}
              className="w-full h-14 bg-gradient-to-br from-[#1a56db] to-[#1e40af] hover:from-[#1546b0] hover:to-[#172554] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-100/50 active:scale-95 transition-all"
            >
              Fazer Novo Pedido
            </Button>
            
            <Button
              onClick={handleBackToCardapio}
              variant="ghost"
              className="w-full h-12 text-slate-400 hover:text-slate-600 font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-transparent transition-colors"
            >
              Voltar ao Cardápio
            </Button>
          </div>
        </div>

        <style jsx global>{`
          @keyframes scale-up {
            0% { transform: scale(0.8); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
          }
          .scale-up-check {
            animation: scale-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans pb-28 relative flex flex-col items-center select-none">
      <meta name="robots" content="noindex" />

      {/* 🔝 FIXED HEADER WITH WHATSAPP LINK */}
      <header className="fixed top-0 max-w-[500px] w-full h-[56px] bg-white/95 border-b border-slate-100 flex items-center justify-between px-4 z-[500] shadow-sm backdrop-blur-md">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-600 hover:text-slate-900 transition-colors">
          <ChevronLeft className="size-6" />
        </button>
        <span className="text-sm font-black text-slate-800 uppercase tracking-tight">Acompanhar Entrega</span>
        {order.loja?.whatsapp ? (
          <a 
            href={`https://api.whatsapp.com/send?phone=${order.loja.whatsapp.replace(/\D/g, '')}`} 
            target="_blank"
            className="bg-[#16a34a] hover:bg-[#128c3e] text-white text-[10px] font-black uppercase py-2 px-3.5 rounded-full flex items-center gap-1 shadow-sm transition-all"
          >
            <MessageCircle className="size-3.5 fill-white" /> WhatsApp
          </a>
        ) : (
          <div className="w-16" />
        )}
      </header>

      <div className="w-full max-w-[500px] bg-white min-h-screen shadow-xl shadow-slate-100 border-x border-slate-100 flex flex-col relative pt-[56px]">
        
        {/* 🗺️ 1. ORDER TRACKING MAP (Always at the top) */}
        <div className="w-full relative overflow-hidden bg-slate-100 border-b border-slate-100 z-10 shrink-0 h-[350px] md:h-[400px] lg:h-[500px]">
          
          <OrderTrackingMap 
            customerAddress={order.endereco} 
            storeAddress={order.loja?.address} 
            storeLogo={order.loja?.logo}
            storeLatLng={order.loja?.latitude && order.loja?.longitude ? [order.loja.latitude, order.loja.longitude] : null}
            customerLatLng={order.latitude && order.longitude ? [order.latitude, order.longitude] : null}
            courierCoords={courierCoords}
            courierHeading={courierHeading}
            onDistanceChange={handleDistanceChange}
            isDelivered={isDelivered}
          />

          {/* Floating Manual Update Button (Overlay on Map) */}
          <button
            onClick={() => fetchStatus(true)}
            disabled={refreshing}
            className="absolute bottom-4 right-4 z-[400] bg-white hover:bg-slate-50 text-slate-800 p-3.5 rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-all border border-slate-100/50 pointer-events-auto"
            title="Atualizar localização"
          >
            <RefreshCcw className={cn("size-5 text-[#1a56db] transition-transform", refreshing && "animate-spin")} />
          </button>
        </div>

        {/* 🔵 2. STATS & TELEMETRY SECTION */}
        <div className="px-5 pt-5 pb-3 space-y-4">
          
          {/* Header Info */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">Código do Pedido</span>
              <h2 className="text-lg font-black text-slate-900 tracking-tight mt-1 leading-none">#{order.numero_pedido}</h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none font-mono">ID BR</span>
              <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block mt-1 leading-none">{order.codigo_br}</span>
            </div>
          </div>

          {/* 🏍️ STATUS DA ENTREGA CARD */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Status da Entrega</span>
                {isDelivered ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 font-black text-base mt-1.5 leading-none">
                    <span>✅</span>
                    <span>Pedido entregue com sucesso</span>
                  </div>
                ) : currentStep === 6 ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 font-black text-base mt-1.5 leading-none animate-pulse">
                    <span>🟢</span>
                    <span>Entregador próximo do destino</span>
                  </div>
                ) : hasCourier ? (
                  <div className="flex items-center gap-1.5 text-[#1a56db] font-black text-base mt-1.5 leading-none">
                    <span>🏍️</span>
                    <span>Em rota para entrega</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-700 font-black text-base mt-1.5 leading-none">
                    <span>⏳</span>
                    <span>Aguardando atribuição do entregador</span>
                  </div>
                )}
                
                {/* Status subtext descriptors */}
                {isDelivered ? (
                  <p className="text-[11px] text-slate-500 font-bold mt-1.5 leading-tight">Obrigado pela preferência.</p>
                ) : currentStep === 6 ? (
                  <p className="text-[11px] text-slate-500 font-bold mt-1.5 leading-tight">Seu pedido chegará em instantes.</p>
                ) : null}
              </div>

              {lastUpdatedTime && (
                <div className="text-right shrink-0">
                  <span className="text-[9px] font-black text-slate-400 uppercase block leading-none">Última atualização</span>
                  <span className="text-xs font-black text-slate-700 mt-1.5 block leading-none">{lastUpdatedTime}</span>
                </div>
              )}
            </div>

            {/* Live Stats parameters: ETA and Distance */}
            {!isDelivered && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100/50">
                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100/50">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Tempo estimado</span>
                  <span className="text-xs font-black text-slate-800 block mt-1 leading-none">
                    {currentStep === 6 ? "Chega em instantes" :
                     calculatedMinutes ? `Chega em ~ ${calculatedMinutes} min` : 
                     "Aguardando..."}
                  </span>
                </div>
                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100/50">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Distância restante</span>
                  <span className="text-xs font-black text-slate-800 block mt-1 leading-none">
                    {distance ? `${distance.toFixed(2)} km` : "Aguardando..."}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 🔄 MANUAL REFRESH ACTION BUTTON */}
          <Button
            onClick={() => fetchStatus(true)}
            disabled={refreshing}
            className="w-full h-14 bg-slate-950 hover:bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2.5 shadow-md active:scale-95 transition-all mt-1"
          >
            <RefreshCcw className={cn("size-4", refreshing && "animate-spin")} />
            ATUALIZAR LOCALIZAÇÃO
          </Button>

        </div>

        {/* 📊 3. VERTICAL TIMELINE */}
        <div className="px-5 py-5 border-t border-slate-100 bg-slate-50/20">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Etapas de entrega</h3>
          
          <div className="relative space-y-6 pl-4">
            {/* Connector Line */}
            <div className="absolute left-[29px] top-3.5 bottom-3.5 w-0.5 bg-slate-100" />
            
            {steps.map((step) => {
              const isPast = step.id < currentStep
              const isCurrent = step.id === currentStep
              const isFuture = step.id > currentStep

              return (
                <div key={step.id} className="flex gap-4 relative z-10 transition-all duration-300">
                  {/* Status Node Icon */}
                  <div className={cn(
                    "size-8 rounded-full flex items-center justify-center shrink-0 shadow border transition-all duration-500",
                    isPast ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald-50" : 
                    isCurrent ? "bg-slate-900 border-slate-900 text-white scale-105 shadow-md shadow-slate-200 animate-pulse" : 
                    "bg-white border-slate-100 text-slate-300"
                  )}>
                    {isPast ? <Check className="size-4" /> : <span className="text-[11px] font-bold">{step.id + 1}</span>}
                  </div>
                  
                  {/* Labels */}
                  <div className="flex-1 pt-1.5">
                    <h4 className={cn(
                      "text-xs font-black uppercase tracking-wider leading-none",
                      isFuture ? "text-slate-300" : "text-slate-800"
                    )}>
                      {step.label}
                    </h4>
                    {!isFuture && (
                      <p className="text-[11px] text-slate-400 mt-1.5 font-medium leading-tight">
                        {step.desc}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 📋 4. BILL SUMMARY (Collapsible) */}
        <div className="border-y border-slate-100 bg-white">
          <button 
            onClick={() => setIsResumoExpanded(!isResumoExpanded)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">Resumo do pedido</span>
              <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded">
                {order.produtos?.length || 0} produto(s)
              </span>
            </div>
            {isResumoExpanded ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
          </button>
          
          {isResumoExpanded && (
            <div className="px-5 pb-5 space-y-3.5 border-t border-slate-50 pt-4 bg-slate-50/20 text-xs font-medium">
              {order.produtos?.map((p: any, i: number) => (
                <div key={i} className="flex justify-between text-slate-600">
                  <span>{p.qtd}x {p.nome}</span>
                  <span className="text-slate-900 font-bold">R$ {Number(p.valor).toFixed(2)}</span>
                </div>
              ))}
              <div className="h-px bg-slate-100 my-2" />
              <div className="flex justify-between text-slate-500">
                <span className="uppercase tracking-wider">Subtotal</span>
                <span>R$ {Number(order.pagamento?.valor).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span className="uppercase tracking-wider">Taxa de Entrega</span>
                <span>R$ 0,00</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
                <span className="font-black text-slate-900 uppercase">Total</span>
                <span className="font-black text-[#1a56db]">R$ {Number(order.pagamento?.valor).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* 💳 5. PAYMENT STATUS CARD */}
        <div className="px-5 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <CreditCard className="size-4.5 text-slate-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">Status do pagamento</span>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider",
              order.pagamento?.status === 'pago' ? "bg-green-100 text-[#16a34a]" : "bg-[#fff3e0] text-[#f57c00]"
            )}>
              {order.pagamento?.status === 'pago' ? "Pago" : "Pendente"}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider italic">
            Forma: {order.pagamento?.forma} 
            {order.pagamento?.troco > 0 && ` | Troco para: R$ ${Number(order.pagamento?.troco + order.pagamento?.valor).toFixed(2)} (Troco: R$ ${Number(order.pagamento?.troco).toFixed(2)})`}
          </p>
        </div>

        {/* 👤 6. CLIENT MASKED ADDRESS */}
        <div className="px-5 py-6 bg-slate-50/10 space-y-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Home className="size-4.5 text-slate-400" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">Local de entrega</span>
          </div>
          <div className="pl-6 space-y-1">
            <p className="text-xs text-slate-700 font-bold uppercase tracking-tight leading-snug">{order.endereco}</p>
            <p className="text-[11px] text-slate-400 font-semibold">{order.cliente?.nome_mascarado} • {order.cliente?.telefone_mascarado}</p>
          </div>
        </div>

        {/* 📞 7. STORE AND COURIER CONTACT SECTION */}
        <div className="px-5 py-6 space-y-4 bg-white">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Contatos de Suporte</h3>
          
          <div className="grid grid-cols-1 gap-3.5">
            {/* Store Contact Card */}
            {order.loja?.whatsapp && (
              <div className="p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-2xl flex items-center justify-between gap-4 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                    <Store className="size-5.5 text-white" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 block tracking-widest">ESTABELECIMENTO</span>
                    <span className="text-xs font-bold text-slate-800">{order.loja?.nome}</span>
                  </div>
                </div>
                <a 
                  href={`https://wa.me/${order.loja.whatsapp.replace(/\D/g, '')}`} 
                  target="_blank"
                  className="h-9 px-4 rounded-xl bg-[#16a34a] hover:bg-[#128c3e] text-white font-bold uppercase text-[9px] tracking-wider flex items-center gap-1.5 shadow transition-colors"
                >
                  <MessageCircle className="size-3.5 fill-white" /> WhatsApp
                </a>
              </div>
            )}

            {/* Courier Contact Card */}
            {order.entregador ? (
              <div className="p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-2xl flex items-center justify-between gap-4 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-lg shadow-inner">
                    🏍️
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 block tracking-widest">ENTREGADOR DESIGNADO</span>
                    <span className="text-xs font-bold text-slate-800">
                      {(() => {
                        try {
                          const parsed = JSON.parse(order.entregador.nome)
                          return parsed.nome
                        } catch (e) {
                          return order.entregador.nome
                        }
                      })()}
                    </span>
                  </div>
                </div>
                {order.entregador.telefone && (
                  <a 
                    href={`https://wa.me/${order.entregador.telefone.replace(/\D/g, '')}`} 
                    target="_blank"
                    className="h-9 px-4 rounded-xl bg-[#16a34a] hover:bg-[#128c3e] text-white font-bold uppercase text-[9px] tracking-wider flex items-center gap-1.5 shadow transition-colors"
                  >
                    <MessageCircle className="size-3.5 fill-white" /> WhatsApp
                  </a>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* 🏠 8. BACK TO CARDAPIO */}
        <div className="px-5 py-6 bg-slate-50/20 text-center border-t border-slate-100">
          <Button 
            onClick={handleBackToCardapio}
            variant="ghost" 
            className="w-full text-slate-400 hover:text-slate-600 font-bold uppercase text-[9px] tracking-[0.3em] hover:bg-transparent transition-colors"
          >
            Voltar ao Cardápio
          </Button>
        </div>
      </div>

      {/* 🎉 9. SUCCESS DIALOG (Checkout Modal) */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="max-w-sm w-full bg-white p-8 rounded-[36px] shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="size-16 bg-[#1a56db] text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-100 mb-5 animate-bounce">
              <CheckCircle2 className="size-9 text-white" />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">Pedido recebido com sucesso!</h3>
            <p className="text-slate-500 text-xs mt-2.5 leading-relaxed">
              Seu pedido já está com a confeitaria. Acompanhe a entrega em tempo real através do mapa interativo.
            </p>

            <div className="w-full mt-6">
              <Button 
                onClick={() => {
                  setShowWelcomeModal(false)
                  router.replace(`/pedido/rastreamento/${orderId}`)
                }}
                className="w-full h-12 bg-[#1a56db] hover:bg-[#1546b0] text-white rounded-xl font-bold uppercase text-xs tracking-wider shadow transition-all active:scale-95"
              >
                Acompanhar pedido
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 🎉 10. DELIVERED / CONFIRMED SHARE DIALOG (WhatsApp Receipts) */}
      {showWhatsappModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm transition-all duration-300">
          <div className="max-w-sm w-full bg-white p-8 rounded-[36px] shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="size-16 bg-[#16a34a] text-white rounded-full flex items-center justify-center shadow-lg shadow-green-100 mb-5 animate-bounce">
              <CheckCircle2 className="size-9 text-white" />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">Pedido Confirmado!</h3>
            <p className="text-slate-500 text-xs mt-2.5 leading-relaxed">
              Deseja enviar seu comprovante para a confeitaria agora pelo WhatsApp?
            </p>

            <div className="w-full space-y-2.5 mt-6">
              <Button 
                onClick={handleWhatsAppRedirect}
                className="w-full h-12 bg-[#16a34a] hover:bg-[#128c3e] text-white rounded-xl font-bold uppercase text-xs tracking-wider shadow flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="size-4 fill-white" /> Enviar Comprovante
              </Button>
              
              <Button 
                onClick={() => setShowWhatsappModal(false)}
                variant="ghost"
                className="w-full h-11 text-slate-400 hover:text-slate-600 font-bold uppercase text-[10px] tracking-wider rounded-xl transition-colors"
              >
                Continuar Rastreando
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
