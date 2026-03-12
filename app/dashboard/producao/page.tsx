"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Plus,
    Search,
    Calendar,
    Clock,
    CheckCircle2,
    Flame,
    Truck,
    MoreHorizontal,
    ChevronRight,
    Layers,
    LayoutGrid,
    Bell,
    Settings
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

type ProductionStatus = "recebido" | "producao" | "decorando" | "finalizado" | "entregue"

interface ProductionItem {
    id: string
    clients?: { name: string }
    product_name: string
    delivery_date: string
    status: ProductionStatus
    priority?: "baixa" | "media" | "alta"
}

// Removendo mock antigo

const columns: { id: ProductionStatus, label: string, icon: any, color: string, bgColor: string }[] = [
    { id: "recebido", label: "Pedido Recebido", icon: Clock, color: "text-rose-400", bgColor: "bg-rose-50" },
    { id: "producao", label: "Em Produção", icon: Flame, color: "text-amber-500", bgColor: "bg-amber-50" },
    { id: "decorando", label: "Decorando", icon: Layers, color: "text-purple-400", bgColor: "bg-purple-50" },
    { id: "finalizado", label: "Finalizado", icon: CheckCircle2, color: "text-emerald-500", bgColor: "bg-emerald-50" },
    { id: "entregue", label: "Entregue", icon: Truck, color: "text-slate-400", bgColor: "bg-slate-50" },
]

export default function ProducaoPage() {
    const { user } = useAuth()
    const [items, setItems] = useState<ProductionItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            fetchOrders()
        }
    }, [user])

    async function fetchOrders() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('orders')
                .select('*, clients(name)')
                .order('delivery_date', { ascending: true })

            if (error) throw error
            setItems(data || [])
        } catch (error: any) {
            console.error("Error fetching production orders:", error.message || error)
            toast.error("Erro ao carregar produção")
        } finally {
            setLoading(false)
        }
    }

    const moveItem = async (id: string, newStatus: ProductionStatus) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', id)

            if (error) throw error

            setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item))
            toast.success("Status atualizado!")
        } catch (error: any) {
            console.error("Error moving item:", error.message || error)
            toast.error("Erro ao atualizar status")
        }
    }

    return (
        <div className="h-full flex flex-col space-y-12 pb-24">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
            >
                <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-2 uppercase italic leading-none">
                        Gestão de <span className="text-primary tracking-tighter">Ciclo</span>
                    </h1>
                    <p className="text-slate-500 font-medium italic">Visão estratégica da sua produção em tempo real.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end mr-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacidade Atual</span>
                        <div className="flex gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map(i => <div key={i} className={cn("h-1.5 w-6 rounded-full", i <= 3 ? "bg-primary" : "bg-slate-200")}></div>)}
                        </div>
                    </div>
                    <Button className="h-14 px-10 rounded-[20px] bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95">
                        <Plus className="mr-2 size-5" />
                        Novo Ciclo
                    </Button>
                </div>
            </motion.div>

            {/* Kanban Board Container */}
            <div className="flex flex-1 gap-8 overflow-x-auto pb-10 scrollbar-hide min-h-[700px] -mx-4 px-4 lg:mx-0 lg:px-0">
                {columns.map((column, colIdx) => (
                    <motion.div
                        key={column.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: colIdx * 0.1 }}
                        className="flex-1 min-w-[340px] flex flex-col gap-6"
                    >
                        {/* Column Header */}
                        <div className="flex items-center justify-between px-4">
                            <div className="flex items-center gap-4">
                                <div className={cn("flex size-14 items-center justify-center rounded-[20px] bg-white shadow-xl border border-slate-100 transform -rotate-3 transition-transform hover:rotate-0 duration-500", column.color)}>
                                    <column.icon className="size-8" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 italic leading-none">{column.label}</h3>
                                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">
                                        {items.filter(i => i.status === column.id).length} ENTRADAS
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="size-10 rounded-xl hover:bg-white/50 text-slate-400">
                                <MoreHorizontal className="size-5" />
                            </Button>
                        </div>

                        {/* Column Droppable Area */}
                        <div className="flex-1 rounded-[44px] border border-white/60 bg-white/30 backdrop-blur-xl p-5 flex flex-col gap-5 min-h-[600px] shadow-2xl shadow-rose-200/10">
                            <AnimatePresence mode="popLayout">
                                {items
                                    .filter(i => i.status === column.id)
                                    .map((item, idx) => (
                                        <motion.div
                                            layout
                                            key={item.id}
                                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
                                            className="group relative cursor-pointer overflow-hidden rounded-[32px] border border-white/60 bg-white/60 backdrop-blur-md p-6 hover:shadow-[0_20px_50px_rgba(244,114,182,0.1)] transition-all duration-500 hover:-translate-y-1 hover:bg-white/80"
                                        >
                                            {/* Priority Badge & Actions */}
                                            <div className="flex items-center justify-between mb-5">
                                                <div className={cn(
                                                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                                                    item.priority === "alta" ? "bg-rose-500 text-white shadow-rose-200" :
                                                        item.priority === "media" ? "bg-amber-400 text-zinc-950 shadow-amber-100" :
                                                            "bg-slate-100 text-slate-500"
                                                )}>
                                                    PRIORIDADE {item.priority || "MÉDIA"}
                                                </div>
                                                <Badge className="bg-white/80 text-primary border-none text-[9px] font-black uppercase tracking-tighter">
                                                    #{item.id.slice(0, 4)}
                                                </Badge>
                                            </div>

                                            {/* Main Info */}
                                            <div className="space-y-6">
                                                <div>
                                                    <h4 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-tight group-hover:text-primary transition-colors">
                                                        {item.product_name}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <div className="size-6 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
                                                            <Clock className="size-3 text-primary" />
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">
                                                            {item.clients?.name}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Visual Stage Progress */}
                                                <div className="py-2">
                                                    <div className="flex items-center justify-between mb-3 px-1">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status Técnico</span>
                                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">Etapa {colIdx + 1}/5</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {columns.map((c, sIdx) => (
                                                            <div
                                                                key={c.id}
                                                                className={cn(
                                                                    "h-3 flex-1 rounded-full transition-all duration-700",
                                                                    sIdx <= colIdx
                                                                        ? "bg-gradient-to-r from-primary to-rose-400 shadow-lg shadow-primary/20"
                                                                        : "bg-slate-100"
                                                                )}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Card Footer */}
                                                <div className="flex items-center justify-between pt-6 border-t border-rose-100/30">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Entrega</span>
                                                            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                                                                <Calendar className="size-3.5 text-primary" />
                                                                {new Date(item.delivery_date).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' })}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {colIdx < columns.length - 1 && (
                                                        <Button
                                                            size="icon"
                                                            className="size-12 rounded-2xl bg-white hover:bg-primary text-slate-400 hover:text-white border border-slate-100 shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                moveItem(item.id, columns[colIdx + 1].id);
                                                            }}
                                                        >
                                                            <ChevronRight className="size-6" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Decorative Elements */}
                                            <div className="absolute -bottom-12 -right-12 size-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                                        </motion.div>
                                    ))
                                }
                            </AnimatePresence>

                            {/* Empty State placeholder within column */}
                            {items.filter(i => i.status === column.id).length === 0 && (
                                <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                                    <div className="size-20 bg-slate-200 rounded-full blur-xl mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sem atividades</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
