"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { 
  Clock, 
  ChefHat, 
  Truck,
  Bell,
  BellOff,
  Maximize2,
  Minimize2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { 
  initSound, 
  startAlert, 
  stopAlert, 
  vibrateDevice 
} from "@/lib/notifications"
import { useOrders } from "@/hooks/useOrders"
import { useQueryClient } from "@tanstack/react-query"
import { KanbanColumn } from "@/components/dashboard/pedidos/KanbanColumn"
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

export default function KitchenPage() {
  const { profile } = useBusiness()
  const companyId = profile?.tenant_id || profile?.company_id
  const queryClient = useQueryClient()
  
  const { data: orders = [], isLoading: loading, updateStatus } = useOrders(companyId)
  const [isAlertEnabled, setIsAlertEnabled] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // Realtime subscription
  useEffect(() => {
    if (!companyId) return
    const channel = supabase
      .channel('kitchen_realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `tenant_id=eq.${companyId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["orders", companyId] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [companyId, queryClient])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over) return;
    const orderId = active.id;
    const overId = over.id;
    if (['preparo', 'pronto'].includes(overId)) {
       await updateStatus({ orderId, newStatus: overId })
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin size-12 border-4 border-slate-800 border-t-pink-500 rounded-full" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 overflow-hidden flex flex-col gap-6">
      {/* Clean Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
           <div className="size-14 rounded-2xl bg-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <ChefHat size={32} className="text-white" />
           </div>
           <div>
              <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Cozinha <span className="text-pink-500">Live</span></h1>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">Produção em Tempo Real</p>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <Button 
              variant="outline" 
              className={cn(
                "h-14 rounded-2xl font-black uppercase italic tracking-widest gap-3 border-2 px-8 transition-all",
                isAlertEnabled ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-900 text-slate-400 border-slate-800"
              )}
              onClick={async () => {
                await initSound()
                setIsAlertEnabled(!isAlertEnabled)
                if (!isAlertEnabled) toast.success("Alertas Sonoros Ativados")
              }}
           >
              {isAlertEnabled ? <Bell size={20} /> : <BellOff size={20} />}
              {isAlertEnabled ? "Sons Ativos" : "Sons Desligados"}
           </Button>
           
           <Button 
              variant="outline" 
              className="h-14 w-14 rounded-2xl bg-slate-900 border-slate-800 text-slate-400"
              onClick={toggleFullscreen}
           >
              {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
           </Button>
        </div>
      </div>

      {/* Main Kanban Content */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex gap-8 overflow-x-auto no-scrollbar pb-6">
           <KanbanColumn 
              id="preparo"
              title="Em Preparo" 
              orders={orders.filter(o => o.status === 'preparo')} 
              color="bg-blue-600" 
              icon={ChefHat}
              onOrderClick={() => {}}
              onUpdateStatus={(id, status) => updateStatus({ orderId: id, newStatus: status })}
              isKitchenMode={true}
           />
           <KanbanColumn 
              id="pronto"
              title="Prontos" 
              orders={orders.filter(o => o.status === 'pronto')} 
              color="bg-pink-600" 
              icon={Truck}
              onOrderClick={() => {}}
              onUpdateStatus={(id, status) => updateStatus({ orderId: id, newStatus: status })}
              isKitchenMode={true}
           />
        </div>
      </DndContext>

      {/* Floating Status Bar */}
      <div className="h-12 bg-slate-900 border border-slate-800 rounded-2xl px-6 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
         <div className="flex items-center gap-6">
            <span className="flex items-center gap-2"><div className="size-2 rounded-full bg-emerald-500 animate-pulse" /> Servidor Conectado</span>
            <span className="flex items-center gap-2"><Clock size={12} /> {new Date().toLocaleTimeString()}</span>
         </div>
         <div>DOCE GESTÃO KDS v1.0</div>
      </div>
    </div>
  )
}
