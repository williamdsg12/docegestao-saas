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
  ExternalLink,
  ChevronRight,
  Truck,
  Flame,
  Utensils,
  PartyPopper
} from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export default function OrderConfirmedPage() {
  const router = useRouter()
  const [status, setStatus] = useState("recebido") // recebido, confirmado, em_preparo, pronto, saiu_entrega, entregue

  // Simulate status progression for demo
  useEffect(() => {
    const timer = setTimeout(() => setStatus("confirmado"), 3000)
    return () => clearTimeout(timer)
  }, [])

  const steps = [
    { id: "recebido", label: "Pedido Recebido", icon: ShoppingBag },
    { id: "confirmado", label: "Confirmado", icon: CheckCircle2 },
    { id: "em_preparo", label: "Na Cozinha", icon: Flame },
    { id: "pronto", label: "Pedido Pronto", icon: Utensils },
    { id: "saiu_entrega", label: "Saiu para Entrega", icon: Truck },
    { id: "entregue", label: "Entregue", icon: CheckCircle2 },
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
          <div className="size-24 bg-emerald-500 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200 animate-bounce">
            <CheckCircle2 className="size-12 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic italic leading-none">
            Pedido <span className="text-pink-500">Confirmado!</span>
          </h1>
          <p className="text-slate-500 font-medium italic uppercase text-xs tracking-[0.3em]">Obrigado pela preferência!</p>
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
              <h4 className="text-xl font-black text-white tracking-tighter uppercase italic italic mb-2">Alguma dúvida?</h4>
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
    </div>
  )
}
