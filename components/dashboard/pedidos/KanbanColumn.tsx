"use client"

import { KanbanCard } from "./KanbanCard"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface KanbanColumnProps {
  id: string
  title: string
  orders: any[]
  color: string
  icon: LucideIcon
  onOrderClick: (order: any) => void
  onUpdateStatus?: (id: string, status: string) => void
  isKitchenMode?: boolean
}

export function KanbanColumn({ 
  id, 
  title, 
  orders, 
  color, 
  icon: Icon, 
  onOrderClick 
}: KanbanColumnProps) {
  return (
    <div className="flex-shrink-0 w-[350px] flex flex-col h-full bg-[#f4f4f5]/50 rounded-[40px] border border-slate-200/60 overflow-hidden">
      {/* Column Header */}
      <div className="p-6 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn("size-10 rounded-2xl flex items-center justify-center text-white shadow-lg", color)}>
              <Icon size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-lg uppercase tracking-tighter italic leading-none">
                {title}
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mt-1 leading-none">
                {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Column Body */}
      <ScrollArea className="flex-1 px-4 pb-6">
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {orders.length > 0 ? (
              orders.map((order) => (
                <KanbanCard 
                  key={order.id} 
                  order={order} 
                  onClick={() => onOrderClick(order)} 
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-20 grayscale select-none">
                <Icon size={48} className="text-slate-400 mb-3" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Vazio</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  )
}
