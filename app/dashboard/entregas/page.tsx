"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Globe,
  MapPin,
  Truck,
  CheckCircle2,
  Navigation,
  Phone,
  MessageCircle,
  ShoppingBag,
  DollarSign,
  AlertCircle
} from "lucide-react"
import { useBusiness } from "@/hooks/useBusiness"
import { useDeliveryRealtime } from "@/hooks/useDeliveryRealtime"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

export default function EntregasPage() {
  const { profile } = useBusiness()
  const { newOrders, unlockAudio } = useDeliveryRealtime(profile?.company_id || "")
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    if (profile?.company_id) {
      fetchDeliveryOrders()
    }
  }, [profile])

  async function fetchDeliveryOrders() {
    if (!profile?.company_id) return
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*, clientes(nome, telefone, endereco)')
        .eq('empresa_id', profile.company_id)
        .in('status', ['pronto', 'saiu_entrega'])
        .order('created_at', { ascending: true })
      
      if (error) throw error
      setOrders(data || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (newOrders.length > 0) {
      fetchDeliveryOrders()
    }
  }, [newOrders])

  const markAsDelivered = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: 'entregue' })
        .eq('id', orderId)
      
      if (error) throw error
      setOrders(prev => prev.filter(o => o.id !== orderId))
      toast.success("Pedido entregue com sucesso! 🛵")
    } catch (e) {
      toast.error("Erro ao atualizar")
    }
  }

  const markAsShipping = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: 'saiu_entrega' })
        .eq('id', orderId)
      
      if (error) throw error
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'saiu_entrega' } : o))
      toast.success("Saiu para entrega! 🚀")
    } catch (e) {
      toast.error("Erro ao atualizar")
    }
  }

  return (
    <div className="space-y-8 p-6 md:p-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-2">
            Logística & <span className="text-pink-500">Entregas</span>
          </h1>
          <p className="text-slate-500 font-medium italic uppercase text-[10px] tracking-widest">Controle de Entregadores e Rotas</p>
        </div>
        <Button 
          onClick={unlockAudio}
          className="rounded-2xl bg-slate-900 hover:bg-slate-800 text-white h-12 gap-2 font-black uppercase tracking-widest text-[10px] shadow-xl"
        >
          <AlertCircle className="size-4" /> Ativar Som
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {orders.length > 0 ? (
          orders.map((order) => (
            <Card key={order.id} className="rounded-[48px] border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden p-10 flex flex-col justify-between min-h-[450px] relative">
              <div className={cn(
                "absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 opacity-30",
                order.status === 'saiu_entrega' ? "bg-indigo-500" : "bg-emerald-500"
              )} />

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <Badge className={cn("mb-4 border-none font-black text-[10px] uppercase px-4 py-2 rounded-xl tracking-widest shadow-sm", 
                       order.status === 'saiu_entrega' ? "bg-indigo-500 text-white animate-pulse" : "bg-emerald-50 text-emerald-600")}>
                       {order.status === 'saiu_entrega' ? '📦 Em Rota de Entrega' : '✅ Disponível p/ Coleta'}
                    </Badge>
                    <h4 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
                       {order.customer_name || order.clientes?.nome}
                    </h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Pedido #{order.numero_pedido || order.id.slice(0, 4)}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button size="icon" className="size-12 rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all border border-slate-100" onClick={() => window.open(`tel:${order.customer_phone || order.clientes?.telefone}`)}>
                      <Phone className="size-5" />
                    </Button>
                    <Button size="icon" className="size-12 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100" onClick={() => window.open(`https://wa.me/55${(order.customer_phone || order.clientes?.telefone)?.replace(/\D/g, '')}`)}>
                      <MessageCircle className="size-5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-6 mb-10">
                  <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-[32px] border border-slate-100/50 group transition-all hover:bg-slate-100/50 cursor-pointer" 
                       onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.endereco_entrega || order.clientes?.endereco)}`)}>
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-pink-500">
                      <MapPin className="size-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{order.endereco_entrega || order.clientes?.endereco || 'Endereço não informado'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Clique para abrir no Google Maps</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center px-6">
                     <div className="flex items-center gap-2">
                        <DollarSign className="size-4 text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">A receber do cliente:</span>
                     </div>
                     <span className="text-2xl font-black text-slate-900 italic tracking-tighter">R$ {order.valor_total?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 relative z-10">
                <Button 
                   variant="outline"
                   className="flex-1 h-16 rounded-[24px] border-slate-200 text-slate-900 font-black uppercase text-[10px] tracking-widest gap-2 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
                   onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.endereco_entrega || order.clientes?.endereco)}`)}
                >
                  <Navigation className="size-4 text-pink-500" /> Ver Rota
                </Button>
                
                {order.status === 'pronto' ? (
                  <Button 
                    onClick={() => markAsShipping(order.id)}
                    className="flex-1 h-16 rounded-[24px] bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest shadow-2xl transition-all active:scale-95 py-0"
                  >
                    <Truck className="size-4 mr-2" /> Iniciar Entrega
                  </Button>
                ) : (
                  <Button 
                    onClick={() => markAsDelivered(order.id)}
                    className="flex-1 h-16 rounded-[24px] bg-pink-500 hover:bg-pink-600 text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-pink-100 transition-all active:scale-95"
                  >
                    <CheckCircle2 className="size-4 mr-2" /> Confirmar Entrega
                  </Button>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full p-24 bg-white rounded-[60px] border border-slate-100 shadow-2xl shadow-slate-200/20 flex flex-col items-center justify-center text-center min-h-[500px]">
             <div className="size-44 bg-slate-50 rounded-[50px] flex items-center justify-center text-slate-200 mb-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-100 animate-pulse" />
                <Globe className="size-24 relative z-10" />
             </div>
             <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Frota estacionada</h3>
             <p className="text-slate-500 mt-4 max-w-sm font-medium italic">Nenhum pedido aguardando entrega no momento.</p>
          </div>
        )}
      </div>
    </div>
  )
}
