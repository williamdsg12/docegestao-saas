"use client"

import { Search, Volume2, VolumeX, Plus, LayoutList, Calendar as CalendarIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface OrderFiltersProps {
  search: string
  setSearch: (val: string) => void
  filterStatus: string
  setFilterStatus: (val: string) => void
  viewMode: 'list' | 'calendar'
  setViewMode: (val: 'list' | 'calendar') => void
  isSoundEnabled: boolean
  setIsSoundEnabled: (val: boolean) => void
  onNewOrder: () => void
  statusCounts: Record<string, number>
  statusConfig: Record<string, any>
}

export function OrderFilters({
  search, setSearch,
  filterStatus, setFilterStatus,
  viewMode, setViewMode,
  isSoundEnabled, setIsSoundEnabled,
  onNewOrder,
  statusCounts,
  statusConfig
}: OrderFiltersProps) {
  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase italic">Gestão de <span className="text-rose-500">Pedidos</span></h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">Controle total da sua confeitaria</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           <Button 
             variant="outline" 
             className={cn("h-11 rounded-xl gap-2 text-[10px] font-black uppercase transition-all", isSoundEnabled && "bg-emerald-50 text-emerald-600 border-emerald-200")} 
             onClick={() => setIsSoundEnabled(!isSoundEnabled)}
           >
             {isSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />} 
             {isSoundEnabled ? "Alertas ON" : "Mudo"}
           </Button>
           
           <div className="bg-slate-100 p-1 rounded-xl flex shadow-inner">
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={() => setViewMode('list')} 
               className={cn("h-9 px-4 rounded-lg text-[10px] font-black uppercase transition-all", viewMode === 'list' ? "bg-white text-rose-500 shadow-sm" : "text-slate-500")}
             >
               <LayoutList size={14} className="mr-2" /> Lista
             </Button>
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={() => setViewMode('calendar')} 
               className={cn("h-9 px-4 rounded-lg text-[10px] font-black uppercase transition-all", viewMode === 'calendar' ? "bg-white text-rose-500 shadow-sm" : "text-slate-500")}
             >
               <CalendarIcon size={14} className="mr-2" /> Calendário
             </Button>
           </div>
           
           <Button 
             onClick={onNewOrder} 
             className="h-11 px-6 rounded-xl bg-rose-500 hover:bg-rose-600 font-black uppercase text-[10px] text-white shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
           >
             <Plus size={18} className="mr-2"/> Novo Pedido
           </Button>
        </div>
      </header>

      <div className="space-y-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {["total", "novo", "em_preparo", "pronto", "saiu_entrega", "entregue", "cancelado"].map(k => (
            <motion.button 
              key={k} 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilterStatus(k === "total" ? "todos" : k)} 
              className={cn(
                "px-4 py-2 rounded-xl border text-[10px] font-black uppercase transition-all whitespace-nowrap flex items-center gap-2", 
                (k === "total" ? filterStatus === "todos" : filterStatus === k) 
                  ? "bg-slate-900 text-white border-slate-900 shadow-lg" 
                  : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
              )}
            >
              {k === "total" ? "Todos" : statusConfig[k]?.label} 
              <Badge className={cn("h-4 px-1 rounded transition-colors", (k === "total" ? filterStatus === "todos" : filterStatus === k) ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>
                {k === "total" ? statusCounts.total : statusCounts[k] || 0}
              </Badge>
            </motion.button>
          ))}
        </div>
        
        <div className="relative max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
          <Input 
            placeholder="Buscar por cliente ou produto..." 
            className="pl-11 h-12 rounded-xl bg-white border-slate-100 shadow-sm focus:ring-4 focus:ring-rose-500/5 transition-all" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>
    </div>
  )
}
