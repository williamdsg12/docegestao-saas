"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  MapPin,
  Truck,
  CheckCircle2,
  Navigation,
  Phone,
  MessageCircle,
  ShoppingBag,
  DollarSign,
  AlertCircle,
  Clock,
  ChevronRight,
  Zap,
  ArrowRight
} from "lucide-react"
import { useBusiness } from "@/hooks/useBusiness"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { formatAddress } from "@/lib/formatters"

function DeliveryTimeline({ status }: { status: string }) {
  const steps = [
    { id: 'pronto', label: 'Coleta', icon: ShoppingBag },
    { id: 'saiu_entrega', label: 'Trânsito', icon: Truck },
    { id: 'entregue', label: 'Chegada', icon: CheckCircle2 },
  ]

  const getCurrentStepIndex = () => {
    if (status === 'entregue') return 2
    if (status === 'saiu_entrega') return 1
    return 0
  }

  const currentIdx = getCurrentStepIndex()

  return (
    <div className="relative flex justify-between items-center w-full px-4 mb-10">
      <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full" />
      <div 
        className="absolute top-1/2 left-0 h-1 bg-pink-500 -translate-y-1/2 rounded-full transition-all duration-1000" 
        style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}
      />
      
      {steps.map((step, idx) => {
        const Icon = step.icon
        const isDone = idx <= currentIdx
        const isActive = idx === currentIdx

        return (
          <div key={step.id} className="relative z-10 flex flex-col items-center">
            <div className={cn(
              "size-10 rounded-full flex items-center justify-center transition-all duration-500 border-4 border-white",
              isDone ? "bg-pink-500 text-white shadow-lg shadow-pink-200" : "bg-white text-slate-300 shadow-sm border-slate-100"
            )}>
              <Icon className={cn("size-4", isActive && "animate-pulse")} />
            </div>
            <span className={cn(
              "absolute top-full mt-3 text-[8px] font-black uppercase tracking-widest whitespace-nowrap",
              isDone ? "text-slate-900" : "text-slate-400"
            )}>
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

import { FeatureGuard } from "@/components/dashboard/FeatureGuard"

export default function EntregasPage() {
  return (
    <FeatureGuard feature="entregas" planRequired="pro">
      <EntregasContent />
    </FeatureGuard>
  )
}

function EntregasContent() {
  const { profile } = useBusiness()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDeliveryOrders = useCallback(async () => {
    if (!profile?.tenant_id) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select('*, customers!customer_id(name, phone), addresses!address_id(*)')
        .eq('tenant_id', profile.tenant_id)
        .in('status', ['ready', 'out_for_delivery'])
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error("Supabase error fetching delivery orders:", error)
        throw error
      }
      setOrders(data || [])
    } catch (e: any) {
      console.error("Fetch error detail:", e.message || e)
      toast.error("Erro ao carregar entregas")
    } finally {
      setLoading(false)
    }
  }, [profile?.tenant_id])

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchDeliveryOrders()

      const channel = supabase
        .channel('delivery-realtime-page')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `tenant_id=eq.${profile.tenant_id}`
        }, (payload) => {
          if (payload.eventType === 'INSERT' || (payload.new as any).status === 'ready') {
            toast.info("Novo pedido disponível para entrega!")
          }
          fetchDeliveryOrders()
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
  }, [profile?.tenant_id, fetchDeliveryOrders])

  const markAsDelivered = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', orderId)
      
      if (error) throw error
      setOrders(prev => prev.filter(o => o.id !== orderId))
      toast.success("Entrega finalizada com sucesso!")
    } catch (e) {
      toast.error("Erro ao atualizar status")
    }
  }

  const markAsShipping = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'out_for_delivery' })
        .eq('id', orderId)
      
      if (error) throw error
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'out_for_delivery' } : o))
      toast.success("Saiu para entrega!")
    } catch (e) {
      toast.error("Erro ao atualizar status")
    }
  }

  const openGoogleMaps = (order: any) => {
    // Validation: Only for delivery
    if (order.order_type !== 'delivery') {
      toast.error('Este pedido é para retirada, não possui endereço.')
      return
    }

    const addressParts = [
      order.delivery_address,
      order.delivery_number,
      order.delivery_neighborhood,
      order.delivery_city
    ].filter(Boolean)

    if (addressParts.length === 0) {
      toast.error('Endereço não informado')
      return
    }

    const fullAddress = addressParts.join(', ')
    console.log('Endereço enviado:', fullAddress)
    
    const encoded = encodeURIComponent(fullAddress)
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`
    window.open(url, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <div className="size-2 bg-pink-500 rounded-full animate-ping" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Logistics Control Center</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none text-center lg:text-left">
              Gestão de <span className="text-pink-500">Entregas</span>
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
             <div className="px-6 sm:px-8 py-4 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6 w-full sm:w-auto justify-center">
                <div className="text-center">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Aguardando</p>
                   <p className="text-xl font-black italic text-slate-900">{orders.filter(o => o.status === 'ready').length}</p>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <div className="text-center">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Em Rota</p>
                   <p className="text-xl font-black italic text-pink-500">{orders.filter(o => o.status === 'out_for_delivery').length}</p>
                </div>
             </div>
             <Button 
               className="h-14 w-full sm:w-14 rounded-2xl bg-slate-950 hover:bg-slate-900 text-pink-500 shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 sm:gap-0"
             >
               <AlertCircle className="size-6" />
               <span className="sm:hidden font-black uppercase text-[10px] tracking-widest">Alertas Sonoros</span>
             </Button>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {orders.length > 0 ? (
            orders.map((order, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={order.id}
              >
                <Card className="rounded-[40px] border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden p-8 flex flex-col min-h-[520px] group hover:-translate-y-2 transition-all duration-500">
                  <div className="flex justify-between items-start mb-8">
                    <Badge className={cn(
                      "px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border-none transition-all",
                      order.status === 'out_for_delivery' ? "bg-pink-500 text-white animate-pulse shadow-lg shadow-pink-200" : "bg-emerald-50 text-emerald-600"
                    )}>
                      {order.status === 'out_for_delivery' ? '📦 em rota' : '✅ pronto p/ coleta'}
                    </Badge>
                    <span className="text-[10px] font-black text-slate-300 uppercase italic tracking-tighter">#{order.num_serial || order.id.slice(0, 6)}</span>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-6 group-hover:text-pink-500 transition-colors">
                      {order.customers?.name || "Cliente Desconhecido"}
                    </h3>

                    {/* Timeline Component */}
                    <DeliveryTimeline status={order.status} />

                    <div className="space-y-4 mt-12 bg-slate-50 p-6 rounded-[32px] border border-slate-100 group-hover:bg-pink-50/30 group-hover:border-pink-100 transition-all">
                      <div className="flex items-start gap-3">
                        <MapPin className="size-4 text-pink-500 mt-0.5" />
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Destino</p>
                          <p className="text-xs font-bold text-slate-700 leading-snug line-clamp-2">
                             {formatAddress(order)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                        <div className="flex items-center gap-2">
                          <DollarSign className="size-4 text-emerald-500" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">A receber</span>
                        </div>
                        <span className="text-lg font-black text-slate-900 italic tracking-tighter">R$ {(order.total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="rounded-2xl border-slate-100 hover:bg-slate-50 text-slate-600 font-black uppercase text-[10px] tracking-widest h-14"
                        onClick={() => window.open(`tel:${order.customers?.phone}`)}
                      >
                        <Phone className="size-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="rounded-2xl border-emerald-100 hover:bg-emerald-50 text-emerald-600 font-black uppercase text-[10px] tracking-widest h-14"
                        onClick={() => window.open(`https://wa.me/55${order.customers?.phone?.replace(/\D/g, '')}`)}
                      >
                        <MessageCircle className="size-4" />
                      </Button>
                    </div>

                    {order.status === 'ready' ? (
                      <Button 
                        onClick={() => markAsShipping(order.id)}
                        className="w-full h-16 rounded-[24px] bg-slate-950 hover:bg-slate-900 text-white font-black uppercase text-xs tracking-widest shadow-2xl transition-all active:scale-95"
                      >
                        Iniciar Entrega <ArrowRight className="ml-2 size-4 text-pink-500" />
                      </Button>
                    ) : (
                      <div className="flex gap-3">
                        <Button 
                          variant="outline"
                          onClick={() => openGoogleMaps(order)}
                          className="h-16 w-16 rounded-2xl border-slate-100 text-pink-500 shadow-sm"
                          title="Abrir rota no Google Maps"
                        >
                          <Navigation className="size-6" />
                        </Button>
                        <Button 
                          onClick={() => markAsDelivered(order.id)}
                          className="flex-1 h-16 rounded-[24px] bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-200 transition-all active:scale-95"
                        >
                          Cheguei no Local <CheckCircle2 className="ml-2 size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))
          ) : !loading && (
            <div className="col-span-full py-40 flex flex-col items-center">
               <div className="size-32 bg-slate-100 rounded-[50px] flex items-center justify-center text-slate-300 mb-8 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white animate-pulse" />
                  <Truck className="size-12 relative z-10" />
               </div>
               <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Nenhuma entrega ativa</h3>
               <p className="text-slate-400 font-medium italic mt-2 text-sm uppercase tracking-widest">Os pedidos aparecerão aqui assim que estiverem prontos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
