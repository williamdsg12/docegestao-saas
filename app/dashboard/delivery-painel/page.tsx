"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  DndContext, 
  DragOverlay, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  closestCorners,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core"
import { 
  arrayMove, 
  SortableContext, 
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  Flame,
  Filter,
  Bell,
  Utensils,
  ChevronRight,
  AlertCircle
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { useDeliveryRealtime } from "@/hooks/useDeliveryRealtime"
import { useBusiness } from "@/hooks/useBusiness"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { format, differenceInMinutes } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

// --- Components ---

function PreparationTimer({ startTime, limit = 15 }: { startTime: string | null, limit?: number }) {
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
      "flex items-center gap-2 px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest",
      isDelayed ? "bg-rose-500 text-white animate-pulse" : "bg-amber-100 text-amber-600"
    )}>
      <Clock className="size-3" />
      {isDelayed && <span className="mr-1">⚠️ ATRASADO</span>}
      {elapsed}
    </div>
  )
}

function KanbanCard({ order, isOverlay = false }: { order: any, isOverlay?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: order.id,
    data: { type: "Order", order }
  })

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'novo': return 'bg-blue-500'
      case 'confirmado': return 'bg-cyan-500'
      case 'em_preparo': return 'bg-amber-500'
      case 'pronto': return 'bg-emerald-500'
      case 'saiu_entrega': return 'bg-indigo-500'
      case 'entregue': return 'bg-green-500'
      case 'cancelado': return 'bg-rose-500'
      default: return 'bg-slate-500'
    }
  }

  // Calculate if order is delayed (> 15 min since creation if not started, or > preparation_time if in progress)
  const isDelayed = order.status === 'em_preparo' 
    ? differenceInMinutes(new Date(), new Date(order.inicio_preparo || order.created_at)) > 15
    : differenceInMinutes(new Date(), new Date(order.created_at)) > 30

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 transition-all",
        isDragging ? "opacity-30" : "hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1",
        isOverlay ? "shadow-2xl ring-2 ring-pink-500/20 cursor-grabbing" : "cursor-grab",
        isDelayed && order.status !== 'entregue' && order.status !== 'cancelado' ? "border-rose-200 bg-rose-50/30" : ""
      )}
    >
      <div className={cn("absolute top-0 right-0 w-24 h-24 blur-[60px] -mr-12 -mt-12 opacity-20", getStatusColor(order.status))} />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={cn("size-10 rounded-xl flex items-center justify-center text-white shadow-lg", getStatusColor(order.status))}>
            <ShoppingBag className="size-5" />
          </div>
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">#{order.numero_pedido || order.id.slice(0, 4)}</p>
            <h4 className="text-xs font-black text-slate-900 uppercase italic tracking-tight leading-none truncate max-w-[100px]">
              {order.customer_name || order.clientes?.nome || "Cliente"}
            </h4>
          </div>
        </div>
        {order.status === 'em_preparo' && (
          <PreparationTimer startTime={order.inicio_preparo || order.created_at} />
        )}
      </div>

      <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-50 relative z-10">
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total</span>
          <span className="text-sm font-black text-slate-900 tracking-tighter">R$ {order.valor_total?.toFixed(2)}</span>
        </div>
        <Badge className="bg-slate-100 text-slate-500 border-none px-3 py-1 rounded-lg font-black text-[8px] uppercase tracking-widest">
          {order.tipo_pedido || 'DELIVERY'}
        </Badge>
      </div>

      {isDelayed && order.status !== 'entregue' && order.status !== 'cancelado' && (
        <div className="mt-3 flex items-center gap-1.5 text-rose-500 font-black text-[8px] uppercase tracking-widest animate-pulse">
          <AlertCircle className="size-3" /> Pedido Atrasado
        </div>
      )}
    </div>
  )
}

function KanbanColumn({ status, title, orders }: { status: string, title: string, orders: any[] }) {
  const { setNodeRef } = useSortable({
    id: status,
    data: { type: "Column", status }
  })

  return (
    <div className="flex flex-col min-w-[320px] max-w-[320px] bg-slate-50/50 rounded-[40px] p-4 h-[calc(100vh-280px)] border border-slate-100 shadow-inner">
      <div className="flex items-center justify-between px-4 mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "size-3 rounded-full shadow-sm",
            status === 'novo' ? 'bg-blue-500 shadow-blue-200' :
            status === 'em_preparo' ? 'bg-amber-500 shadow-amber-200' :
            status === 'pronto' ? 'bg-emerald-500 shadow-emerald-200' :
            status === 'saiu_entrega' ? 'bg-indigo-500 shadow-indigo-200' :
            status === 'entregue' ? 'bg-green-500 shadow-green-200' : 'bg-rose-500 shadow-rose-200'
          )} />
          <h2 className="text-xs font-black text-slate-900 uppercase italic tracking-[0.2em]">{title}</h2>
        </div>
        <Badge className="bg-slate-200/50 text-slate-500 border-none font-black text-[10px] rounded-lg">
          {orders.length}
        </Badge>
      </div>

      <div ref={setNodeRef} className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <SortableContext items={orders.map(o => o.id)} strategy={verticalListSortingStrategy}>
          {orders.map((order) => (
            <KanbanCard key={order.id} order={order} />
          ))}
        </SortableContext>
        
        {orders.length === 0 && (
          <div className="h-32 border-2 border-dashed border-slate-200 rounded-[32px] flex items-center justify-center text-slate-300 text-[10px] font-black uppercase tracking-widest">
            Vazio
          </div>
        )}
      </div>
    </div>
  )
}

// --- Main Page ---

export default function DeliveryPainelPage() {
  const { profile } = useBusiness()
  const { newOrders, unlockAudio } = useDeliveryRealtime(profile?.company_id || "")
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeOrder, setActiveOrder] = useState<any | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    if (profile?.company_id) {
      fetchOrders()
    }
  }, [profile])

  async function fetchOrders() {
    if (!profile?.company_id) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('pedidos')
        .select('*, clientes(nome)')
        .eq('empresa_id', profile.company_id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (newOrders.length > 0) {
      fetchOrders()
    }
  }, [newOrders])

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Order") {
      setActiveOrder(event.active.data.current.order)
    }
  }

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const isActiveAnOrder = active.data.current?.type === "Order"
    const isOverAnOrder = over.data.current?.type === "Order"
    const isOverAColumn = over.data.current?.type === "Column"

    if (!isActiveAnOrder) return

    // Dropping an order over another order
    if (isActiveAnOrder && isOverAnOrder) {
      setOrders((prev) => {
        const activeIndex = prev.findIndex((o) => o.id === activeId)
        const overIndex = prev.findIndex((o) => o.id === overId)
        
        if (prev[activeIndex].status !== prev[overIndex].status) {
          const updated = [...prev]
          updated[activeIndex] = { ...updated[activeIndex], status: updated[overIndex].status }
          return arrayMove(updated, activeIndex, overIndex)
        }
        
        return arrayMove(prev, activeIndex, overIndex)
      })
    }

    // Dropping an order over a column
    if (isActiveAnOrder && isOverAColumn) {
      setOrders((prev) => {
        const activeIndex = prev.findIndex((o) => o.id === activeId)
        const updated = [...prev]
        updated[activeIndex] = { ...updated[activeIndex], status: overId }
        return arrayMove(updated, activeIndex, activeIndex)
      })
    }
  }

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveOrder(null)

    if (!over) return

    const orderId = active.id as string
    const newStatus = (over.data.current?.type === "Column" ? over.id : (over.data.current?.order?.status)) as string

    if (!newStatus) return

    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ 
          status: newStatus,
          // Automations for preparation tracking (matching migration triggers for robustness)
          ...(newStatus === 'em_preparo' ? { inicio_preparo: new Date().toISOString() } : {}),
          ...(newStatus === 'pronto' ? { pronto_em: new Date().toISOString() } : {})
        })
        .eq('id', orderId)
      
      if (error) throw error
      
      toast.success(`Pedido movido para ${newStatus.toUpperCase()}`)
    } catch (e) {
      toast.error("Erro ao sincronizar com o servidor")
      fetchOrders() // Revert to server state
    }
  }

  const columns = [
    { id: 'novo', title: 'Novos' },
    { id: 'confirmado', title: 'Confirmados' },
    { id: 'em_preparo', title: 'Em Preparo' },
    { id: 'pronto', title: 'Prontos' },
    { id: 'saiu_entrega', title: 'Na Rua' },
    { id: 'entregue', title: 'Concluídos' },
  ]

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50/30">
      <div className="p-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-2">
              Painel <span className="text-pink-500 tracking-tight">Kanban</span>
            </h1>
            <p className="text-slate-500 font-medium italic uppercase text-[10px] tracking-[0.3em]">Operational Drag & Drop Dashboard</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={unlockAudio}
              className="rounded-2xl bg-slate-900 hover:bg-slate-800 text-white h-12 gap-2 font-black uppercase tracking-widest text-[10px] shadow-2xl px-8"
            >
              <Bell className="size-4 text-pink-500" /> Ativar Alertas
            </Button>
            <div className="px-6 py-3 bg-white rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
               <div className="flex items-center gap-2">
                  <div className="size-2 bg-pink-500 rounded-full animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ao Vivo</span>
               </div>
               <div className="w-[1px] h-4 bg-slate-100" />
               <span className="text-xs font-black text-slate-900 italic uppercase">
                  {orders.length} Total
               </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-8 pt-4 scrollbar-hide">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-8 h-full min-w-max pb-10">
            {columns.map((col) => (
              <KanbanColumn 
                key={col.id} 
                status={col.id} 
                title={col.title} 
                orders={orders.filter(o => o.status === col.id || (col.id === 'em_preparo' && o.status === 'confirmado'))} 
              />
            ))}
          </div>

          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: "0.5",
                },
              },
            }),
          }}>
            {activeOrder ? (
              <KanbanCard order={activeOrder} isOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
