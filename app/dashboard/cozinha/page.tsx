"use client"

import { useState, useEffect, useCallback } from "react"
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
  ChevronRight,
  Maximize2
} from "lucide-react"
import { useBusiness } from "@/hooks/useBusiness"
import { useDeliveryRealtime } from "@/hooks/useDeliveryRealtime"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { formatDistanceToNow, differenceInMinutes } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

// --- Components ---

function LargeTimer({ startTime, limit = 15 }: { startTime: string | null, limit?: number }) {
  const [elapsed, setElapsed] = useState("0:00")
  const [isDelayed, setIsDelayed] = useState(false)

  const updateTimer = useCallback(() => {
    if (!startTime) return
    const start = new Date(startTime)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const minutes = Math.floor(diffMs / 60000)
    const seconds = Math.floor((diffMs % 60000) / 1000)
    
    setElapsed(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    setIsDelayed(minutes >= limit)
  }, [startTime, limit])

  useEffect(() => {
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [updateTimer])

  if (!startTime) return null

  return (
    <div className={cn(
      "text-5xl font-black tabular-nums tracking-tighter transition-colors",
      isDelayed ? "text-rose-500 animate-pulse" : "text-slate-900"
    )}>
      {elapsed}
    </div>
  )
}

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
        .update({ 
           status: newStatus,
           ...(newStatus === 'em_preparo' ? { inicio_preparo: new Date().toISOString() } : {}),
           ...(newStatus === 'pronto' ? { pronto_em: new Date().toISOString() } : {})
        })
        .eq('id', orderId)
      
      if (error) throw error
      
      if (newStatus === 'pronto') {
        setOrders(prev => prev.filter(o => o.id !== orderId))
        toast.success("Pedido finalizado! 🍰")
      } else {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, inicio_preparo: new Date().toISOString() } : o))
        toast.success("Produção iniciada! 🔥")
      }
    } catch (e) {
      toast.error("Erro ao atualizar")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Profissional */}
      <div className="bg-white border-b border-slate-200 p-8 shadow-sm">
        <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="size-20 bg-slate-900 rounded-[28px] flex items-center justify-center text-white shadow-xl rotate-3">
              <ChefHat className="size-10" />
            </div>
            <div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                Modo <span className="text-pink-500">Cozinha</span>
              </h1>
              <p className="text-slate-500 font-medium italic uppercase text-xs tracking-[0.4em] mt-2">KDS • Real-Time Display</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={unlockAudio}
              variant="outline" 
              className="rounded-2xl border-2 border-slate-200 h-16 px-8 gap-3 font-black uppercase tracking-widest text-xs hover:bg-slate-50"
            >
              <AlertCircle className="size-5 text-pink-500" /> Ativar Alertas Sonoros
            </Button>
            <div className="px-10 py-5 bg-slate-900 text-white rounded-3xl flex items-center gap-4 shadow-2xl">
              <div className="animate-pulse size-4 bg-pink-500 rounded-full" />
              <div className="flex flex-col">
                <span className="text-3xl font-black tracking-tighter italic leading-none">{orders.length}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Em Fila</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-[1800px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {orders.length > 0 ? (
            orders.map((order) => (
              <Card key={order.id} className={cn(
                "rounded-[48px] border-none shadow-2xl bg-white overflow-hidden flex flex-col min-h-[650px] transition-all",
                order.status === 'em_preparo' ? "ring-4 ring-amber-500/20 shadow-amber-200/50" : "shadow-slate-200/50"
              )}>
                {/* Status Bar */}
                <div className={cn(
                  "h-3 w-full",
                  order.status === 'em_preparo' ? "bg-amber-500" : "bg-blue-500"
                )} />

                <CardContent className="p-10 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <div className="flex items-center gap-3 mb-3 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                        <Clock className="size-4" /> Criado há {formatDistanceToNow(new Date(order.created_at), { locale: ptBR })}
                      </div>
                      <h4 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                        #{order.numero_pedido || order.id.slice(0, 4)}
                      </h4>
                      <p className="text-xl font-black text-slate-500 uppercase italic tracking-tight truncate max-w-[200px]">
                        {order.customer_name || order.clientes?.nome}
                      </p>
                    </div>
                    {order.status === 'em_preparo' ? (
                      <LargeTimer startTime={order.inicio_preparo || order.created_at} />
                    ) : (
                      <div className="px-6 py-3 bg-blue-50 text-blue-600 rounded-3xl font-black text-xs uppercase tracking-widest">
                        PENDENTE
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-4 mb-8">
                    {order.itens_pedido?.map((item: any) => (
                      <div key={item.id} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100/50 group hover:bg-white hover:shadow-xl transition-all">
                        <div className="flex items-center gap-6">
                          <div className="size-16 bg-white rounded-2xl flex items-center justify-center text-3xl font-black text-slate-900 shadow-sm outline outline-2 outline-slate-100">
                            {item.quantidade}x
                          </div>
                          <div className="flex-1">
                            <span className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-tight block">
                              {item.product_name || 'Produto'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.observacoes && (
                    <div className="p-8 bg-rose-50 rounded-[40px] border-2 border-dashed border-rose-200 mb-8 mt-auto animate-pulse">
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                        <AlertCircle className="size-4" /> Atenção Cozinha:
                      </p>
                      <p className="text-2xl font-black text-slate-800 italic tracking-tight leading-tight uppercase">
                        "{order.observacoes}"
                      </p>
                    </div>
                  )}

                  <div className="mt-auto pt-6 border-t border-slate-100">
                    {order.status === 'confirmado' ? (
                      <Button 
                        onClick={() => updateStatus(order.id, 'em_preparo')}
                        className="w-full h-24 rounded-[35px] bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.3em] text-lg shadow-2xl transition-all active:scale-95 flex gap-4"
                      >
                        <Flame className="size-8 text-amber-500" /> Iniciar Agora
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => updateStatus(order.id, 'pronto')}
                        className="w-full h-24 rounded-[35px] bg-pink-500 hover:bg-pink-600 text-white font-black uppercase tracking-[0.3em] text-lg shadow-2xl shadow-pink-100 transition-all active:scale-95 flex gap-4"
                      >
                        <CheckCircle2 className="size-8" /> Finalizar Pedido
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full p-32 bg-white rounded-[80px] border border-slate-100 shadow-2xl shadow-slate-200/20 flex flex-col items-center justify-center text-center min-h-[600px]">
              <div className="size-48 bg-slate-50 rounded-[60px] flex items-center justify-center text-slate-200 mb-10 relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-100 animate-pulse" />
                <ChefHat className="size-24 relative z-10" />
              </div>
              <h3 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">Cozinha em descanso</h3>
              <p className="text-slate-500 mt-6 text-xl max-w-md font-medium italic">Todos os pedidos foram atendidos. Ótimo trabalho equipe!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
