"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Map as MapIcon, 
  Truck, 
  User, 
  Clock, 
  Navigation, 
  Filter, 
  Maximize2,
  ChevronRight,
  Search,
  AlertCircle
} from "lucide-react"
import { useBusiness } from "@/hooks/useBusiness"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

export default function LogisticaPage() {
  const { profile } = useBusiness()
  const [couriers, setCouriers] = useState<any[]>([])
  const [activeDeliveries, setActiveDeliveries] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')

  useEffect(() => {
    if (profile?.company_id) {
      fetchLogisticsData()
    }
  }, [profile])

  async function fetchLogisticsData() {
    // Fetch couriers and their last locations
    const { data: couriersData } = await supabase
      .from('entregadores')
      .select('*, entregador_localizacao(latitude, longitude, updated_at)')
      .eq('empresa_id', profile?.company_id)
    
    setCouriers(couriersData || [])

    // Fetch active deliveries (saiu_entrega)
    const { data: ordersData } = await supabase
      .from('pedidos')
      .select('*, clientes(nome)')
      .eq('empresa_id', profile?.company_id)
      .eq('status', 'saiu_entrega')
    
    setActiveDeliveries(ordersData || [])
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900 overflow-hidden text-white">
      {/* Logistics Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl relative z-20">
        <div className="flex items-center gap-4">
          <div className="size-12 bg-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Navigation className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic italic">
              Centro de <span className="text-pink-500">Logística</span>
            </h1>
            <p className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-500 italic">Real-Time Fleet Management</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2">
              <div className="size-2 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-[10px] font-black uppercase text-emerald-500">{couriers.filter(c => c.status === 'disponivel').length} Online</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-400">{activeDeliveries.length} Em Trânsito</span>
            </div>
          </div>
          
          <Button variant="outline" className="rounded-xl border-white/10 bg-white/5 text-white/70 hover:bg-white/10 h-12 px-6 font-black uppercase tracking-widest text-[10px]">
            <Filter className="size-4 mr-2" /> Filtros
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Map View Placeholder */}
        <div className="flex-1 relative bg-slate-800">
          <div className="absolute inset-0 opacity-40 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/-46.6333,-23.5505,12/1000x1000?access_token=YOUR_TOKEN')] bg-cover" />
          
          {/* Overlay Navigation Controls */}
          <div className="absolute top-8 left-8 flex flex-col gap-4 z-10">
            <div className="bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-white/10 flex flex-col gap-2">
              <Button onClick={() => setViewMode('map')} className={cn("size-12 rounded-xl", viewMode === 'map' ? "bg-pink-500" : "bg-transparent text-slate-400")}>
                <MapIcon className="size-5" />
              </Button>
              <Button onClick={() => setViewMode('list')} className={cn("size-12 rounded-xl", viewMode === 'list' ? "bg-pink-500" : "bg-transparent text-slate-400")}>
                <Filter className="size-5" />
              </Button>
            </div>
          </div>

          {/* Courier Markers Placeholder */}
          {couriers.map((courier, idx) => (
            <div 
              key={courier.id}
              className="absolute animate-bounce"
              style={{ top: `${30 + idx * 10}%`, left: `${40 + idx * 15}%` }}
            >
              <div className="group relative">
                <div className="size-10 bg-white rounded-full flex items-center justify-center shadow-2xl border-2 border-emerald-500 cursor-pointer">
                  <Truck className="size-5 text-slate-900" />
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-slate-900 p-2 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-all pointer-events-none min-w-[120px]">
                  <p className="text-[10px] font-black uppercase">{courier.nome}</p>
                  <p className="text-[8px] text-emerald-500 font-bold uppercase mt-1 tracking-tighter">● EM ENTREGA</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Panel */}
        <div className="w-[450px] bg-slate-900/50 backdrop-blur-3xl border-l border-white/5 flex flex-col overflow-hidden relative z-20">
          <div className="p-8 pb-4">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center gap-2">
              <Clock className="size-3" /> Entregas em Tempo Real
            </h3>
            
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <input 
                placeholder="BUSCAR PEDIDO OU ENTREGADOR..." 
                className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-6 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-pink-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-4 scrollbar-hide">
            {activeDeliveries.length > 0 ? activeDeliveries.map((delivery) => (
              <Card key={delivery.id} className="bg-white/5 border-white/5 rounded-[32px] overflow-hidden group hover:bg-white/10 transition-all border-none">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <Badge className="bg-pink-500/10 text-pink-500 border-none font-black text-[8px] uppercase tracking-widest px-3 py-1 mb-2">
                        Pedido #{delivery.id.slice(0, 5)}
                      </Badge>
                      <h4 className="text-lg font-black uppercase italic tracking-tighter truncate max-w-[200px]">
                        {delivery.clientes?.nome}
                      </h4>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-500 uppercase">Saiu há</p>
                       <p className="text-xs font-black text-emerald-500 uppercase italic tracking-tighter">12 MINUTOS</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                      <div className="size-8 bg-white text-slate-900 rounded-xl flex items-center justify-center font-black text-xs">
                        <User className="size-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Entregador</p>
                        <p className="text-[10px] font-black uppercase text-white tracking-widest mb-0 flex items-center gap-2">
                          RICARDO SILVA <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Previsão</span>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl">
                      ~ 15:45
                    </span>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="h-64 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center text-center p-8">
                 <div className="size-16 bg-white/5 rounded-3xl flex items-center justify-center text-slate-600 mb-4 scale-75">
                   <AlertCircle className="size-8" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Nenhuma entrega ativa no momento</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
