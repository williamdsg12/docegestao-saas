"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ChefHat,
  Clock,
  CheckCircle2,
  Flame,
  Utensils,
  AlertCircle,
  ChevronRight
} from "lucide-react"
import { useBusiness } from "@/hooks/useBusiness"
import { useDeliveryRealtime } from "@/hooks/useDeliveryRealtime"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

export default function KitchenPage() {
  const { profile } = useBusiness()
  const { newOrders, unlockAudio } = useDeliveryRealtime(profile?.company_id || "")
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.company_id) {
      fetchPrepOrders()
    }
  }, [profile])

  async function fetchPrepOrders() {
    if (!profile?.company_id) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('pedidos')
        .select('*, itens_pedido(*), clientes(nome)')
        .eq('empresa_id', profile.company_id)
        .in('status', ['confirmado', 'em_preparo'])
        .order('created_at', { ascending: true })
      
      if (error) throw error
      setOrders(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (newOrders.length > 0) {
      fetchPrepOrders()
    }
  }, [newOrders])

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: newStatus })
        .eq('id', orderId)
      
      if (error) throw error
      
      if (newStatus === 'pronto') {
        setOrders(prev => prev.filter(o => o.id !== orderId))
        toast.success("Pedido pronto! A caminho da entrega. 🍰")
      } else {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
        toast.success("Produção iniciada! 🔥")
      }
    } catch (e) {
      toast.error("Erro ao atualizar")
    }
  }

  return (
    <div className="space-y-8 p-6 md:p-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-2">
            Modo <span className="text-pink-500">Cozinha</span>
          </h1>
          <p className="text-slate-500 font-medium italic uppercase text-[10px] tracking-widest text-center md:text-left">Kitchen Display System (KDS)</p>
        </div>
        <div className="flex items-center gap-4">
           <Button 
             onClick={unlockAudio}
             variant="outline" 
             className="rounded-2xl border-slate-200 h-10 gap-2 font-black uppercase tracking-widest text-[9px]"
           >
              <AlertCircle className="size-3" /> Ativar Som
           </Button>
           <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl">
              <AlertCircle className="size-4 text-pink-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">{orders.length} Pedidos em Produção</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
        {orders.length > 0 ? (
          orders.map((order) => (
            <Card key={order.id} className="rounded-[48px] border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden p-10 flex flex-col justify-between min-h-[500px] relative">
              <div className={cn(
                "absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 opacity-30",
                order.status === 'em_preparo' ? "bg-amber-500" : "bg-blue-500"
              )} />

              <div>
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div>
                    <Badge className={cn(
                      "mb-3 border-none font-black text-[10px] uppercase px-4 py-2 rounded-xl tracking-widest",
                      order.status === 'em_preparo' ? "bg-amber-500 text-white animate-pulse" : "bg-blue-100 text-blue-600"
                    )}>
                       {order.status === 'em_preparo' ? '🔥 Em Preparo' : '🆕 Aguardando'}
                    </Badge>
                    <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
                      #{order.numero_pedido || order.id.slice(0, 4)} - {order.customer_name || order.clientes?.nome}
                    </h4>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                     <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase">
                        <Clock className="size-3" /> {formatDistanceToNow(new Date(order.created_at), { locale: ptBR })}
                     </div>
                  </div>
                </div>

                <div className="space-y-3 mb-10 relative z-10">
                   {order.itens_pedido?.map((item: any) => (
                     <div key={item.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-[28px] border border-slate-100/50">
                        <div className="flex items-center gap-4">
                           <div className="size-10 bg-white rounded-xl flex items-center justify-center font-black text-slate-900 shadow-sm">
                             {item.quantidade}x
                           </div>
                           <span className="font-black text-slate-800 uppercase italic tracking-tight text-sm">{item.product_name || 'Produto'}</span>
                        </div>
                     </div>
                   ))}
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                {order.observacoes && (
                  <div className="p-6 bg-rose-50 rounded-[32px] border border-rose-100/50 mb-4">
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                       <AlertCircle className="size-3" /> Observação Importante:
                    </p>
                    <p className="text-sm font-bold text-slate-700 italic">"{order.observacoes}"</p>
                  </div>
                )}
                
                <div className="flex gap-3">
                  {order.status === 'confirmado' ? (
                    <Button 
                      onClick={() => updateStatus(order.id, 'em_preparo')}
                      className="flex-1 h-20 rounded-[30px] bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all active:scale-95 flex gap-3"
                    >
                      <Flame className="size-5 text-amber-500" /> Iniciar Preparo
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => updateStatus(order.id, 'pronto')}
                      className="flex-1 h-20 rounded-[30px] bg-pink-500 hover:bg-pink-600 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-pink-100 transition-all active:scale-95 flex gap-3"
                    >
                      <CheckCircle2 className="size-5" /> Pedido Pronto
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full p-20 bg-white rounded-[60px] border border-slate-100 shadow-2xl shadow-slate-200/20 flex flex-col items-center justify-center text-center min-h-[500px]">
             <div className="size-40 bg-slate-50 rounded-[50px] flex items-center justify-center text-slate-200 mb-8 relative overflow-hidden">
               <div className="absolute inset-0 bg-slate-100 animate-pulse" />
               <ChefHat className="size-20 relative z-10" />
             </div>
             <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Cozinha em descanso</h3>
             <p className="text-slate-500 mt-4 max-w-sm font-medium italic">Todos os pedidos foram atendidos com sucesso!</p>
          </div>
        )}
      </div>
    </div>
  )
}
