"use client"

import { useState, useEffect, use } from "react"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"
import { 
  Package, 
  MapPin, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MessageCircle, 
  Phone,
  Navigation,
  Star,
  ChevronLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function TrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<any>(null)
  const [courierLocation, setCourierLocation] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrder()
    
    // Subscribe to order changes
    const orderChannel = supabase
      .channel(`order_tracking_${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pedidos", filter: `id=eq.${id}` },
        (payload) => setOrder(payload.new)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(orderChannel)
    }
  }, [id])

  useEffect(() => {
    if (order?.status === 'out_for_delivery') {
      // Subscribe to courier location if shipping
      const locationChannel = supabase
        .channel(`courier_tracking_${id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "entregador_localizacao" },
          (payload) => setCourierLocation(payload.new)
        )
        .subscribe()

      return () => {
        supabase.removeChannel(locationChannel)
      }
    }
  }, [order?.status])

  async function fetchOrder() {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*, empresas(nome, phone), clientes(nome, telefone)')
        .eq('id', id)
        .single()

      if (data) setOrder(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const getStatusStep = (status: string) => {
    const steps = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered']
    return steps.indexOf(status)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black uppercase tracking-widest opacity-20 italic">Localizando Pedido...</div>

  if (!order) return <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center gap-6">
    <div className="size-20 bg-rose-50 rounded-[32px] flex items-center justify-center text-rose-500">
      <Package className="size-10" />
    </div>
    <h2 className="text-2xl font-black italic uppercase tracking-tighter">Pedido não encontrado</h2>
    <Button asChild variant="ghost" className="rounded-2xl font-black uppercase text-[10px] tracking-widest"><Link href="/">Voltar ao Início</Link></Button>
  </div>

  const currentStep = getStatusStep(order.status)

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-20">
      {/* Header */}
      <div className="bg-white p-8 border-b border-slate-100 flex items-center gap-6 sticky top-0 z-50">
        <Link href="/">
           <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
              <ChevronLeft className="size-6" />
           </div>
        </Link>
        <div className="space-y-1">
          <h1 className="text-xl font-black italic uppercase tracking-tighter leading-none">Acompanhar <span className="text-pink-500">Pedido</span></h1>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pedido #{id.slice(0, 8)}</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-6 space-y-6">
        
        {/* Real-time Map Placeholder */}
        <div className="aspect-square bg-slate-200 rounded-[48px] shadow-inner relative overflow-hidden group border-4 border-white">
           <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/-46.6333,-23.5505,13/600x600?access_token=pk.xxx')] bg-cover opacity-50 grayscale group-hover:grayscale-0 transition-all duration-1000" />
           
           {/* Animated Pulse for Location */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="size-12 bg-pink-500/20 rounded-full animate-ping" />
              <div className="size-4 bg-pink-500 rounded-full border-2 border-white shadow-xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
           </div>

           <div className="absolute bottom-8 left-8 right-8 bg-white/80 backdrop-blur-xl p-6 rounded-[32px] border border-white shadow-2xl">
              <div className="flex items-center gap-4">
                 <div className="size-12 rounded-2xl bg-pink-500 flex items-center justify-center text-white shadow-lg">
                    <Truck className="size-6" />
                 </div>
                 <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Estimativa</p>
                    <p className="font-black text-slate-900 uppercase italic tracking-tight text-lg">15-20 Minutos</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-[48px] p-10 shadow-xl border border-white space-y-10">
           <div className="flex flex-col gap-10">
              {[
                { s: 'accepted', label: 'Pedido Confirmado', time: '10:30', icon: CheckCircle2, desc: 'A loja aceitou seu pedido' },
                { s: 'preparing', label: 'Em Preparo', time: '10:35', icon: Clock, desc: 'Estamos preparando seu doce' },
                { s: 'out_for_delivery', label: 'Saiu para Entrega', time: '10:50', icon: Truck, desc: 'O entregador está a caminho' },
                { s: 'delivered', label: 'Pedido Entregue', time: '11:05', icon: CheckCircle2, desc: 'Bom apetite!' }
              ].map((step, idx) => {
                const isActive = getStatusStep(order.status) >= getStatusStep(step.s)
                return (
                  <div key={step.s} className="flex gap-6 relative">
                    {idx < 3 && <div className={cn("absolute left-6 top-10 bottom-[-40px] w-0.5 bg-slate-100", isActive && "bg-pink-500/20")} />}
                    <div className={cn(
                      "size-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                      isActive ? "bg-pink-500 text-white shadow-lg shadow-pink-100 scale-110" : "bg-slate-50 text-slate-200"
                    )}>
                      <step.icon className="size-6" />
                    </div>
                    <div className="space-y-1">
                       <h3 className={cn("font-black uppercase italic tracking-tight transition-colors", isActive ? "text-slate-900" : "text-slate-300")}>{step.label}</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{step.desc}</p>
                    </div>
                  </div>
                )
              })}
           </div>
        </div>

        {/* Courier Info */}
        {order.status === 'out_for_delivery' && (
           <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[48px] p-8 shadow-xl border border-white flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="size-16 rounded-[24px] bg-slate-900 flex items-center justify-center text-pink-500 font-black text-xl italic tracking-widest">
                    C
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Seu Entregador</p>
                    <p className="font-black text-slate-900 uppercase italic tracking-tight text-xl">Carlos Silveira</p>
                    <div className="flex items-center gap-1 text-amber-500">
                       {[1,2,3,4,5].map(i => <Star key={i} className="size-3 fill-current" />)}
                    </div>
                 </div>
              </div>
              <div className="flex gap-2">
                 <Button size="icon" className="size-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-100">
                    <MessageCircle className="size-6 text-white" />
                 </Button>
                 <Button size="icon" className="size-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900">
                    <Phone className="size-6" />
                 </Button>
              </div>
           </motion.div>
        )}

        {/* Support Card */}
        <div className="bg-slate-900 rounded-[48px] p-10 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
              <Navigation className="size-32" />
           </div>
           <div className="relative z-10 space-y-6">
              <div className="space-y-2">
                 <h4 className="text-2xl font-black italic uppercase tracking-tighter">Precisa de <br /><span className="text-pink-500">Ajuda?</span></h4>
                 <p className="text-slate-400 text-sm font-medium opacity-80 leading-relaxed">Se estiver com problemas no seu pedido, nossa equipe está pronta para te atender.</p>
              </div>
              <Button className="w-full h-16 rounded-[24px] bg-white text-slate-900 font-black uppercase text-[10px] tracking-widest flex gap-3 shadow-2xl">
                 <MessageCircle className="size-5 text-emerald-500" />
                 Falar no WhatsApp
              </Button>
           </div>
        </div>

      </div>
    </div>
  )
}
