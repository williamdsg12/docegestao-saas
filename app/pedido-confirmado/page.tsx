"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Phone, 
  ShoppingBag,
  Package,
  ExternalLink,
  ChevronRight,
  Truck,
  Flame,
  Utensils,
  PartyPopper,
  X,
  Heart,
  Star
} from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { AnimatePresence } from "framer-motion"
import { Suspense } from "react"

function OrderConfirmedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const [status, setStatus] = useState("pending") 
  const [showCelebration, setShowCelebration] = useState(false)
  const [storeName, setStoreName] = useState("Doce Gestão")

  useEffect(() => {
    if (!orderId) return

    // 1. Fetch initial status and store name
    const fetchInitialData = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          status,
          tenants (
            name
          )
        `)
        .eq("id", orderId)
        .single()
      
      if (data && !error) {
        setStatus(data.status)
        if ((data as any).tenants?.name) {
          setStoreName((data as any).tenants.name)
        }
      }
    }

    fetchInitialData()

    // 2. Subscribe to real-time changes
    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        "postgres_changes",
        { 
          event: "UPDATE", 
          schema: "public", 
          table: "orders",
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log("Status update received:", payload.new.status)
          setStatus(payload.new.status)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])

  useEffect(() => {
    if (status === 'delivered') {
      setShowCelebration(true)
    }
  }, [status])

  const steps = [
    { id: "pending", label: "Pedido Recebido", icon: ShoppingBag },
    { id: "accepted", label: "Confirmado", icon: CheckCircle2 },
    { id: "preparing", label: "Na Cozinha", icon: Utensils },
    { id: "ready", label: "Pedido Pronto", icon: Package },
    { id: "out_for_delivery", label: "Saiu para Entrega", icon: Truck },
    { id: "delivered", label: "Entregue", icon: PartyPopper },
  ]

  const currentStepIdx = steps.findIndex(s => s.id === status)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 md:p-10">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-[700px] w-full space-y-8"
      >
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className={cn(
            "size-24 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl animate-bounce",
            status === 'pending' ? "bg-amber-400 shadow-amber-100" : 
            status === 'cancelled' ? "bg-rose-500 shadow-rose-100" : 
            "bg-emerald-500 shadow-emerald-100"
          )}>
            {status === 'pending' ? <Clock className="size-12 text-white" /> : 
             status === 'cancelled' ? <X className="size-12 text-white" /> :
             <CheckCircle2 className="size-12 text-white" />}
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            {status === 'pending' ? (
              <>Pedido <span className="text-pink-500">Recebido!</span></>
            ) : status === 'cancelled' ? (
              <>Pedido <span className="text-rose-500">Cancelado</span></>
            ) : (
              <>Pedido <span className="text-pink-500">Confirmado!</span></>
            )}
          </h1>
          <p className="text-slate-500 font-medium italic uppercase text-xs tracking-[0.3em]">
            {status === 'pending' 
              ? "Aguardando confirmação da loja..." 
              : status === 'cancelled'
              ? "Este pedido foi cancelado."
              : "Obrigado pela preferência!"}
          </p>
        </div>

        <Card className="rounded-[48px] border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden p-10">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-10 pb-4 border-b border-slate-50">Acompanhe seu Pedido</h3>
          
          <div className="relative space-y-12">
            {/* Timeline Line */}
            <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-slate-100" />
            
            {steps.map((step, idx) => {
              const isPast = idx < currentStepIdx
              const isCurrent = idx === currentStepIdx
              const isFuture = idx > currentStepIdx

              return (
                <div key={step.id} className="flex gap-8 relative z-10 transition-all duration-500">
                  <div className={cn(
                    "size-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl",
                    isPast ? "bg-emerald-500 text-white shadow-emerald-100" : 
                    isCurrent ? "bg-slate-900 text-white shadow-slate-200 scale-110 animate-pulse" : 
                    "bg-white text-slate-200 border border-slate-100 shadow-sm"
                  )}>
                    <step.icon className="size-5" />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <h4 className={cn(
                        "text-xs font-black uppercase tracking-widest leading-none mb-1",
                        isFuture ? "text-slate-300" : "text-slate-900"
                      )}>
                        {step.label}
                      </h4>
                      {isCurrent && (
                        <p className="text-[10px] text-emerald-500 font-black uppercase tracking-tighter animate-pulse">EM TEMPO REAL</p>
                      )}
                    </div>
                    {isPast && <CheckCircle2 className="size-4 text-emerald-500" />}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Action Card */}
        <Card className="rounded-[40px] border-none shadow-2xl shadow-slate-200/50 bg-slate-900 overflow-hidden p-10 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500 blur-[80px] -mr-16 -mt-16 opacity-30" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div>
              <h4 className="text-xl font-black text-white tracking-tighter uppercase italic mb-2">Alguma dúvida?</h4>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-loose">
                Fale diretamente com o estabelecimento<br />pelo WhatsApp.
              </p>
            </div>
            <Button className="h-16 px-10 rounded-2xl bg-white text-slate-900 font-black uppercase text-xs tracking-widest hover:bg-slate-50 flex gap-2">
              Chamar no WhatsApp <ChevronRight className="size-4" />
            </Button>
          </div>
        </Card>

        <Button 
          onClick={() => router.push("/")}
          variant="ghost" 
          className="w-full text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] italic hover:bg-transparent"
        >
          Voltar para Home
        </Button>
      </motion.div>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-white/90 backdrop-blur-md"
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(30)].map((_, i) => (
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
                    scale: Math.random() * 2 + 1,
                    rotate: Math.random() * 360
                  }}
                  transition={{ 
                    duration: 3, 
                    ease: "easeOut",
                    delay: Math.random() * 0.5
                  }}
                  className="absolute"
                >
                  {i % 3 === 0 ? <Heart className="text-pink-500 fill-pink-500 size-6" /> : 
                   i % 3 === 1 ? <Star className="text-amber-400 fill-amber-400 size-6" /> : 
                   <div className="size-4 bg-pink-400 rounded-full" />}
                </motion.div>
              ))}
            </div>

            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="max-w-md w-full text-center space-y-8 bg-white p-12 rounded-[56px] shadow-2xl border border-slate-50 relative z-10"
            >
              <div className="size-32 bg-emerald-500 rounded-[48px] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200 animate-bounce">
                <PartyPopper className="size-16 text-white" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                   Entrega <span className="text-pink-500">Concluída!</span>
                </h2>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest leading-loose italic">
                  Esperamos que você ame cada detalhe.<br />Obrigado por escolher a {storeName}!
                </p>
              </div>

              <div className="pt-4 space-y-3">
                <Button 
                   onClick={() => router.push("/")}
                   className="w-full h-16 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95"
                >
                  Finalizar e Sair
                </Button>
                <Button 
                   onClick={() => setShowCelebration(false)}
                   variant="ghost"
                   className="w-full text-slate-400 font-black uppercase text-[9px] tracking-widest"
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
       <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
             <div className="size-20 bg-slate-200 rounded-[32px]" />
             <div className="h-4 w-48 bg-slate-200 rounded-full" />
          </div>
       </div>
    }>
      <OrderConfirmedContent />
    </Suspense>
  )
}
