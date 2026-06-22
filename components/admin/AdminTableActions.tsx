"use client"

import { useState } from "react"
import { 
    Download, 
    Filter, 
    Trash2, 
    ShieldCheck, 
    ArrowRightLeft,
    Calendar,
    ChevronDown,
    X
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface AdminTableActionsProps {
    selectedCount: number
    onExport: () => void
    onBulkDelete?: () => void
    onBulkAction?: (action: string) => void
    children?: React.ReactNode // Extra filters or search
}

export function AdminTableActions({ 
    selectedCount, 
    onExport, 
    onBulkDelete, 
    onBulkAction,
    children 
}: AdminTableActionsProps) {
    const [showFilters, setShowFilters] = useState(false)

    return (
        <div className="space-y-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <AnimatePresence mode="wait">
                        {selectedCount > 0 ? (
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex items-center gap-3 bg-indigo-600/10 border border-indigo-500/20 px-4 py-2 rounded-2xl"
                            >
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest whitespace-nowrap">
                                    {selectedCount} Selecionados
                                </span>
                                <div className="h-4 w-px bg-indigo-500/20" />
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => onBulkAction?.('impersonate')}
                                        className="text-indigo-400 hover:text-white transition-colors"
                                        title="Acessar como..."
                                    >
                                        <ArrowRightLeft className="size-4" />
                                    </button>
                                    <button 
                                        onClick={onBulkDelete}
                                        className="text-rose-500 hover:text-rose-400 transition-colors"
                                        title="Excluir selecionados"
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex-1">
                                {children}
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "h-12 px-5 rounded-2xl border font-bold text-[11px] uppercase tracking-widest transition-all flex items-center gap-2",
                            showFilters 
                                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                                : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/10"
                        )}
                    >
                        <Filter className="size-4" />
                        Filtros
                        <ChevronDown className={cn("size-3 transition-transform", showFilters && "rotate-180")} />
                    </button>

                    <button 
                        onClick={onExport}
                        className="h-12 px-5 rounded-2xl bg-white/5 border border-white/5 text-slate-400 font-bold text-[11px] uppercase tracking-widest hover:text-white hover:border-white/10 transition-all flex items-center gap-2 group"
                    >
                        <Download className="size-4 group-hover:-translate-y-0.5 transition-transform" />
                        Exportar
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Período</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                                    <select className="w-full bg-slate-950 border border-white/5 rounded-xl pl-11 pr-4 h-12 text-xs font-bold text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none">
                                        <option>Últimos 7 dias</option>
                                        <option>Este mês</option>
                                        <option>Últimos 90 dias</option>
                                        <option>Personalizado</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status Multi-seleção</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Ativo', 'Pendente', 'Cancelado'].map(s => (
                                        <button key={s} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400 hover:text-indigo-400 transition-colors">
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-end justify-end">
                                <button className="h-12 px-6 rounded-xl bg-indigo-600 text-white font-black uppercase italic text-[11px] tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95">
                                    Aplicar Filtros
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
