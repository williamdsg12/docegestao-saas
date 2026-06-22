"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Phone, 
  ShoppingBag,
  Package,
  ChevronRight,
  Truck,
  Utensils,
  PartyPopper,
  X,
  Heart,
  Star,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  RotateCw
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import dynamic from "next/dynamic"
import { Suspense } from "react"

// Dynamically import LiveTrackingMap to avoid Next.js SSR build-time errors
const LiveTrackingMap = dynamic(
  () => import("@/components/tracking/LiveTrackingMap"),
  { 
    ssr: false,
    loading: () => (
      <div className="size-full flex flex-col items-center justify-center bg-slate-50 gap-2 rounded-[32px]">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-pink-500 animate-spin" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carregando mapa...</span>
      </div>
    )
  }
)

function OrderConfirmedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")

  useEffect(() => {
    if (orderId) {
      router.replace(`/pedido/rastreamento/${orderId}`)
    }
  }, [orderId, router])

  const [status, setStatus] = useState("pending") 
  const [orderData, setOrderData] = useState<any>(null)
  const [courierCoords, setCourierCoords] = useState<[number, number] | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [isResumoExpanded, setIsResumoExpanded] = useState(false)

  // 1. Normalize database status to timeline stages
  const getNormalizedStatus = (dbStatus: string): string => {
    const s = (dbStatus || "").toLowerCase()
    if (['pending', 'novo', 'pendente', 'recebido'].includes(s)) return 'pending'
    if (['accepted', 'confirmado'].includes(s)) return 'accepted'
    if (['preparing', 'preparo', 'em_preparacao', 'preparando'].includes(s)) return 'preparing'
    if (['ready', 'pronto'].includes(s)) return 'ready'
    if (['out_for_delivery', 'no_caminho', 'shipped', 'chegou', 'saiu_entrega', 'a_caminho'].includes(s)) return 'out_for_delivery'
    if (['delivered', 'completed', 'finalizado', 'entregue'].includes(s)) return 'delivered'
    if (['cancelled', 'cancelado'].includes(s)) return 'cancelled'
    return 'pending'
  }

  // 2. Fetch order detailed status from tracking API
  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return
    try {
      const res = await fetch(`/api/tracking/${orderId}`)
      if (!res.ok) throw new Error("Erro ao buscar detalhes")
      const data = await res.json()
      
      setOrderData(data)
      if (data.status) {
        setStatus(data.status)
      }

      // Pre-fill live coords if available
      if (data.tracking && data.tracking.latitude && data.tracking.longitude) {
        setCourierCoords([Number(data.tracking.latitude), Number(data.tracking.longitude)])
      }
    } catch (err) {
      console.error("Error fetching order details:", err)
    }
  }, [orderId])

  // 3. Initialize data & fallback polling
  useEffect(() => {
    if (!orderId) return

    fetchOrderDetails()

    // 5-second HTTP polling fallback
    const interval = setInterval(fetchOrderDetails, 5000)

    return () => clearInterval(interval)
  }, [orderId, fetchOrderDetails])

  // 4. Real-time PubSub listener for orders and GPS coordinates
  useEffect(() => {
    if (!orderId) return

    // Order status changes channel
    const orderChannel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        "postgres_changes",
        { 
          event: "UPDATE", 
          schema: "public", 
          table: "orders",
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log("⚡ Real-time status updated:", payload.new.order_status)
          const newStatus = payload.new.order_status || payload.new.status
          if (newStatus) {
            setStatus(newStatus)
            fetchOrderDetails() // Refresh full payload on state shift
          }
        }
      )
      .subscribe()

    // Courier GPS movements channel
    const gpsChannel = supabase
      .channel(`gps-updates-${orderId}`)
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "delivery_tracking",
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          console.log("⚡ Real-time GPS location updated:", payload.new)
          const newGps = payload.new as any
          if (newGps && newGps.latitude && newGps.longitude) {
            setCourierCoords([Number(newGps.latitude), Number(newGps.longitude)])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(orderChannel)
      supabase.removeChannel(gpsChannel)
    }
  }, [orderId, fetchOrderDetails])

  // 5. Celebration pop up on completion
  useEffect(() => {
    const stage = getNormalizedStatus(status)
    if (stage === 'delivered') {
      setShowCelebration(true)
    }
  }, [status])

  // 6. Automatically update estimated arrival time based on distance updates
  const handleDistanceChange = (dist: number) => {
    setDistance(dist)
    // Estimate speed of 40 km/h: 0.67 km/minute. Min time: 2 minutes.
    const mins = Math.max(2, Math.round(dist / 0.67))
    setEstimatedMinutes(mins)
  }

  const steps = [
    { id: "pending", label: "Pedido Recebido", icon: ShoppingBag },
    { id: "accepted", label: "Confirmado", icon: CheckCircle2 },
    { id: "preparing", label: "Na Cozinha", icon: Utensils },
    { id: "ready", label: "Pedido Pronto", icon: Package },
    { id: "out_for_delivery", label: "Saiu para Entrega", icon: Truck },
    { id: "delivered", label: "Entregue", icon: PartyPopper },
  ]

  const normalized = getNormalizedStatus(status)
  const currentStepIdx = steps.findIndex(s => s.id === normalized)
  const isCancelled = normalized === 'cancelled'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 md:p-10 selection:bg-pink-100 selection:text-pink-600">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[700px] w-full space-y-6"
      >
        {/* SUCCESS CARD / HEADER */}
        <div className="text-center space-y-3 pt-6">
          <div className={cn(
            "size-20 rounded-[28px] flex items-center justify-center mx-auto shadow-xl transition-all duration-500",
            normalized === 'pending' ? "bg-amber-400 shadow-amber-100 animate-pulse" : 
            isCancelled ? "bg-rose-500 shadow-rose-100" : 
            "bg-emerald-500 shadow-emerald-100"
          )}>
            {normalized === 'pending' ? <Clock className="size-10 text-white animate-spin-slow" /> : 
             isCancelled ? <X className="size-10 text-white" /> :
             <CheckCircle2 className="size-10 text-white" />}
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none">
            {normalized === 'pending' ? (
              <>Pedido <span className="text-pink-500">Recebido!</span></>
            ) : isCancelled ? (
              <>Pedido <span className="text-rose-500">Cancelado</span></>
            ) : normalized === 'delivered' ? (
              <>Pedido <span className="text-emerald-500">Entregue!</span></>
            ) : (
              <>Pedido <span className="text-pink-500">Confirmado!</span></>
            )}
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">
            {isCancelled 
              ? "Este pedido foi cancelado."
              : orderData?.numero_pedido ? `NÚMERO DO PEDIDO: #${orderData.numero_pedido}` : "Identificando pedido..."}
          </p>
        </div>

        {/* STATUS PROGRESS TIMELINE CARD */}
        <Card className="rounded-[40px] border-none shadow-xl shadow-slate-100 bg-white overflow-hidden p-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">STATUS DO PEDIDO</h3>
            <span className="text-[9px] font-bold text-emerald-500 uppercase bg-emerald-50 px-2 py-0.5 rounded-md tracking-wider flex items-center gap-1">
              <RotateCw className="size-2.5 animate-spin" /> Tempo Real
            </span>
          </div>
          
          <div className="relative space-y-8">
            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-100" />
            
            {steps.map((step, idx) => {
              const isPast = idx < currentStepIdx
              const isCurrent = idx === currentStepIdx
              const isFuture = idx > currentStepIdx

              return (
                <div key={step.id} className="flex gap-6 relative z-10 transition-all duration-500">
                  <div className={cn(
                    "size-10 rounded-xl flex items-center justify-center transition-all duration-500 shadow-md",
                    isPast ? "bg-emerald-500 text-white shadow-emerald-50" : 
                    isCurrent ? "bg-slate-950 text-white shadow-slate-100 scale-105" : 
                    "bg-white text-slate-200 border border-slate-100"
                  )}>
                    <step.icon className="size-4.5" />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <h4 className={cn(
                        "text-xs font-black uppercase tracking-widest leading-none mb-1",
                        isFuture ? "text-slate-300" : "text-slate-800"
                      )}>
                        {step.label}
                      </h4>
                      {isCurrent && (
                        <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider animate-pulse">Etapa Atual</p>
                      )}
                    </div>
                    {isPast && <CheckCircle2 className="size-4 text-emerald-500" />}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* MAP & GPS LIVE COURIER TRACKING (Shows when status is out_for_delivery) */}
        {normalized === 'out_for_delivery' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            {/* Live stats */}
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex items-center gap-4 text-emerald-800">
              <Truck className="size-8 text-emerald-600 animate-bounce" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black uppercase tracking-widest text-emerald-600 leading-none mb-1">Saiu para entrega</p>
                <p className="text-sm font-semibold leading-tight">
                  {estimatedMinutes ? (
                    <>Seu pedido chegará em aproximadamente <span className="font-black underline">{estimatedMinutes} minutos</span>.</>
                  ) : (
                    <>O entregador está a caminho do seu endereço.</>
                  )}
                </p>
                {distance && (
                  <p className="text-[10px] font-bold uppercase text-emerald-500 tracking-wider mt-1">Distância restante: {distance.toFixed(2)} km</p>
                )}
              </div>
            </div>

            {/* Map Container */}
            <div className="h-[360px] w-full bg-white p-2 rounded-[40px] shadow-xl shadow-slate-100 relative">
              <LiveTrackingMap 
                customerAddress={orderData?.endereco} 
                storeAddress={orderData?.loja?.address} 
                courierCoords={courierCoords}
                onDistanceChange={handleDistanceChange}
              />
            </div>

            {/* Courier Info Card */}
            {orderData?.entregador && (
              <Card className="rounded-[32px] border-none shadow-md bg-white p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-800 border border-slate-100 text-lg">
                    🏍️
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">ENTREGADOR DESIGNADO</span>
                    <span className="text-sm font-bold text-slate-900 leading-none">
                      {(() => {
                        try {
                          const parsed = JSON.parse(orderData.entregador.nome)
                          return parsed.nome
                        } catch (e) {
                          return orderData.entregador.nome
                        }
                      })()}
                    </span>
                  </div>
                </div>
                {orderData.entregador.telefone && (
                  <a 
                    href={`https://wa.me/${orderData.entregador.telefone.replace(/\D/g, '')}`} 
                    target="_blank"
                    className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase text-[10px] flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <MessageCircle className="size-3.5 fill-white" /> WhatsApp
                  </a>
                )}
              </Card>
            )}
          </motion.div>
        )}

        {/* ORDER DETAILS COLLAPSIBLE */}
        {orderData && (
          <Card className="rounded-[32px] border-none shadow-md bg-white overflow-hidden">
            <button 
              onClick={() => setIsResumoExpanded(!isResumoExpanded)}
              className="w-full px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-all text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">Resumo do Pedido</span>
                <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded">{(orderData.produtos || []).length} produto(s)</span>
              </div>
              {isResumoExpanded ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
            </button>
            
            <AnimatePresence>
              {isResumoExpanded && (
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden bg-slate-50/50 border-t border-slate-50"
                >
                  <div className="p-8 space-y-4 text-xs font-medium">
                    {orderData.produtos?.map((p: any, i: number) => (
                      <div key={i} className="flex justify-between text-slate-700">
                        <span>{p.qtd}x {p.nome}</span>
                        <span className="font-bold text-slate-900">R$ {Number(p.valor).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="h-px bg-slate-100 my-2" />
                    <div className="flex justify-between text-slate-500">
                      <span className="uppercase tracking-wider">Subtotal</span>
                      <span>R$ {Number(orderData.pagamento?.valor).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span className="uppercase tracking-wider">Taxa de Entrega</span>
                      <span>R$ 0,00</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
                      <span className="font-black text-slate-900 uppercase">Total</span>
                      <span className="font-black text-pink-600">R$ {Number(orderData.pagamento?.valor).toFixed(2)}</span>
                    </div>

                    <div className="pt-4 mt-2 border-t border-slate-100 space-y-2">
                      <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-slate-400">
                        <span>Pagamento: {orderData.pagamento?.forma || "Dinheiro"}</span>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[9px]",
                          orderData.pagamento?.status === 'pago' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {orderData.pagamento?.status === 'pago' ? "Confirmado" : "Pendente"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 uppercase font-black tracking-tight">{orderData.endereco}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        )}

        {/* WhatsApp établissement help button */}
        {orderData?.loja && (
          <Card className="rounded-[32px] border-none shadow-md bg-slate-900 text-white p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-pink-500 blur-[60px] -mr-12 -mt-12 opacity-30" />
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div>
                <h4 className="text-lg font-black tracking-tight uppercase italic mb-1">Alguma dúvida ou problema?</h4>
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-wider">
                  Fale com a equipe da {orderData.loja.nome} no WhatsApp.
                </p>
              </div>
              <a 
                href={`https://wa.me/${orderData.loja.whatsapp}`}
                target="_blank"
                className="h-12 px-6 rounded-xl bg-white text-slate-900 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 flex items-center gap-1.5 transition-all shadow-lg shadow-slate-950/20 shrink-0"
              >
                Chamar no WhatsApp <ChevronRight className="size-3.5" />
              </a>
            </div>
          </Card>
        )}

        <Button 
          onClick={() => router.push("/")}
          variant="ghost" 
          className="w-full text-slate-400 font-bold uppercase text-[9px] tracking-[0.3em] hover:bg-transparent"
        >
          Voltar para Home
        </Button>
      </motion.div>

      {/* DELIVERED CELEBRATION MODAL OVERLAY */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-white/95 backdrop-blur-md"
          >
            {/* Confetti details */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(24)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    top: "50%", 
                    left: "50%", 
                    opacity: 1,
                    scale: 0 
                  }}
                  animate={{ 
                    top: `${Math.random() * 100}%`, 
                    left: `${Math.random() * 100}%`,
                    opacity: 0,
                    scale: Math.random() * 1.5 + 0.8,
                    rotate: Math.random() * 360
                  }}
                  transition={{ 
                    duration: 2.5, 
                    ease: "easeOut",
                    delay: Math.random() * 0.3
                  }}
                  className="absolute"
                >
                  {i % 3 === 0 ? <Heart className="text-pink-500 fill-pink-500 size-5" /> : 
                   i % 3 === 1 ? <Star className="text-amber-400 fill-amber-400 size-5" /> : 
                   <div className="size-3.5 bg-pink-400 rounded-full" />}
                </motion.div>
              ))}
            </div>

            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.4 }}
              className="max-w-md w-full text-center space-y-6 bg-white p-10 rounded-[48px] shadow-2xl border border-slate-50 relative z-10"
            >
              <div className="size-24 bg-emerald-500 rounded-[36px] flex items-center justify-center mx-auto shadow-xl shadow-emerald-100 animate-bounce">
                <PartyPopper className="size-12 text-white" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none">
                   Entrega <span className="text-pink-500">Concluída!</span>
                </h2>
                <p className="text-slate-500 font-bold uppercase text-[9px] tracking-wider leading-relaxed">
                  Esperamos que você ame cada detalhe.<br />Obrigado pela preferência!
                </p>
              </div>

              <div className="pt-4 space-y-2">
                <Button 
                   onClick={() => router.push("/")}
                   className="w-full h-14 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all"
                >
                   Finalizar e Sair
                </Button>
                <Button 
                   onClick={() => setShowCelebration(false)}
                   variant="ghost"
                   className="w-full text-slate-400 font-bold uppercase text-[9px] tracking-widest"
                >
                   Ver Detalhes do Pedido
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function OrderConfirmedPage() {
  return (
    <Suspense fallback={
       <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
          <div className="animate-pulse flex flex-col items-center gap-4">
             <div className="size-20 bg-slate-200 rounded-[28px]" />
             <div className="h-4 w-48 bg-slate-200 rounded-full" />
          </div>
       </div>
    }>
      <OrderConfirmedContent />
    </Suspense>
  )
}
