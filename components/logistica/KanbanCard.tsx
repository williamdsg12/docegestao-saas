"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  MoreVertical, 
  MapPin, 
  Clock, 
  ChevronRight,
  MessageCircle,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { differenceInMinutes } from "date-fns"

interface KanbanCardProps {
  order: any
  columnColor: string
  onClick?: (order: any) => void
}

export function KanbanCard({ order, columnColor, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: order.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 100 : 1
  }

  const ageInMinutes = differenceInMinutes(new Date(), new Date(order.created_at))
  const isLate = ageInMinutes > 40

  return (
    <div ref={setNodeRef} style={style}>
      <Card 
        {...attributes} 
        {...listeners} 
        onClick={() => onClick?.(order)}
        className={cn(
          "rounded-[32px] border-none shadow-sm hover:shadow-xl transition-all cursor-grab active:cursor-grabbing group bg-white relative overflow-hidden",
          isLate && "ring-2 ring-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.15)] animate-pulse"
        )}
      >
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-300 uppercase italic tracking-tighter">#{order.num_serial?.toString().padStart(3, '0') || order.id.slice(0, 5)}</span>
              <h4 className="text-sm font-black text-slate-800 uppercase italic tracking-tighter truncate max-w-[180px]">
                {order.clientes?.nome || order.cliente_nome || "Cliente"}
              </h4>
            </div>
            <div className="size-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-colors">
               <MoreVertical className="size-4" />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <MapPin className="size-3 text-pink-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{order.clientes?.bairro || "Retirada"}</span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
             <div className="flex items-center gap-2">
                <div className={cn("size-2 rounded-full", isLate ? "bg-rose-500 animate-pulse" : "bg-emerald-500")} />
                <span className="text-[10px] font-black uppercase text-slate-600 italic">{ageInMinutes} min</span>
             </div>
             <div className="flex gap-2">
                <div className="size-8 bg-pink-50 rounded-lg flex items-center justify-center text-pink-500">
                   <MessageCircle className="size-4" />
                </div>
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick?.(order);
                  }}
                  className="size-8 bg-slate-950 text-white rounded-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                >
                   <ChevronRight className="size-4" />
                </div>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
