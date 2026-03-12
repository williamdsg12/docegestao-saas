"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    ChevronLeft,
    ChevronRight,
    ShoppingBag,
    Clock,
    User,
    MoreVertical,
    Calendar as CalendarIcon,
    Plus
} from "lucide-react"
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    parseISO
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"

export default function CalendarioPage() {
    const { user } = useAuth()
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            fetchOrders()
        }
    }, [user, currentMonth])

    async function fetchOrders() {
        try {
            setLoading(true)
            const start = startOfMonth(currentMonth).toISOString()
            const end = endOfMonth(currentMonth).toISOString()

            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          clientes (name)
        `)
                .gte('delivery_date', start)
                .lte('delivery_date', end)

            if (error) throw error
            setOrders(data || [])
        } catch (error: any) {
            console.error("Erro ao buscar pedidos para o calendário:", error.message || error)
        } finally {
            setLoading(false)
        }
    }

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2 italic uppercase">Calendário <span className="text-primary tracking-tighter italic uppercase">de Entregas</span></h1>
                    <p className="text-slate-500 font-medium">Gerencie sua carga de trabalho mensal de forma visual.</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="rounded-xl hover:bg-rose-50 text-primary">
                        <ChevronLeft className="size-5" />
                    </Button>
                    <span className="text-sm font-black uppercase italic min-w-[140px] text-center">
                        {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="rounded-xl hover:bg-rose-50 text-primary">
                        <ChevronRight className="size-5" />
                    </Button>
                </div>
            </div>
        )
    }

    const renderDays = () => {
        const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
        return (
            <div className="grid grid-cols-7 mb-4">
                {days.map((day) => (
                    <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {day}
                    </div>
                ))}
            </div>
        )
    }

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(monthStart)
        const startDate = startOfWeek(monthStart)
        const endDate = endOfWeek(monthEnd)

        const rows = []
        let days = []
        let day = startDate
        let formattedDate = ""

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, "d")
                const cloneDay = day
                const dayOrders = orders.filter(o => isSameDay(parseISO(o.delivery_date), cloneDay))

                days.push(
                    <motion.div
                        key={day.toString()}
                        whileHover={{ y: -2 }}
                        className={cn(
                            "relative min-h-[120px] p-2 border border-slate-100 bg-white transition-all cursor-pointer hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20",
                            !isSameMonth(day, monthStart) ? "bg-slate-50 opacity-40" : "",
                            isSameDay(day, selectedDate) ? "ring-2 ring-primary ring-inset z-10" : ""
                        )}
                        onClick={() => setSelectedDate(cloneDay)}
                    >
                        <span className={cn(
                            "text-xs font-black",
                            isSameDay(day, new Date()) ? "size-6 flex items-center justify-center bg-primary text-white rounded-lg shadow-lg shadow-primary/20" : "text-slate-400"
                        )}>
                            {formattedDate}
                        </span>

                        <div className="mt-2 space-y-1 overflow-hidden h-20">
                            {dayOrders.slice(0, 3).map((order) => (
                                <div
                                    key={order.id}
                                    className={cn(
                                        "px-1.5 py-0.5 text-[9px] font-bold rounded-md truncate border",
                                        order.status === 'finalizado' ? "bg-green-50 text-green-600 border-green-100" :
                                            order.status === 'producao' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                "bg-rose-50 text-primary border-rose-100"
                                    )}
                                >
                                    {order.product_name}
                                </div>
                            ))}
                            {dayOrders.length > 3 && (
                                <div className="text-[8px] font-black text-slate-400 text-center uppercase">
                                    +{dayOrders.length - 3} pedidos
                                </div>
                            )}
                        </div>
                        {isSameDay(day, new Date()) && (
                            <div className="absolute top-1 right-1 size-1.5 rounded-full bg-primary animate-pulse" />
                        )}
                    </motion.div>
                )
                day = addDays(day, 1)
            }
            rows.push(
                <div className="grid grid-cols-7" key={day.toString()}>
                    {days}
                </div>
            )
            days = []
        }
        return <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm">{rows}</div>
    }

    const selectedDayOrders = orders.filter(o => isSameDay(parseISO(o.delivery_date), selectedDate))

    return (
        <div className="space-y-10 pb-10">
            {renderHeader()}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3">
                    {renderDays()}
                    {renderCells()}
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-slate-900 italic uppercase">
                                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                            </h2>
                            <Badge className="bg-primary text-white font-black">{selectedDayOrders.length}</Badge>
                        </div>

                        <div className="space-y-4">
                            {selectedDayOrders.length > 0 ? (
                                selectedDayOrders.map((order) => (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="group p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-primary/20 transition-all cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="size-8 rounded-lg bg-white flex items-center justify-center text-primary shadow-sm border border-slate-100 group-hover:bg-primary group-hover:text-white transition-colors">
                                                <ShoppingBag className="size-4" />
                                            </div>
                                            <Badge variant="outline" className="text-[8px] uppercase font-black tracking-widest border-slate-200">
                                                {order.status}
                                            </Badge>
                                        </div>
                                        <h3 className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors truncate">
                                            {order.product_name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                            <User className="size-3" />
                                            {order.clientes?.name || 'Cliente comum'}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                            <Clock className="size-3 text-amber-400" />
                                            {format(parseISO(order.delivery_date), "HH:mm")}
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <div className="size-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100 border-dashed">
                                        <CalendarIcon className="size-8 text-slate-200" />
                                    </div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                                        Nenhum pedido <br /> para este dia
                                    </p>
                                    <Button variant="outline" className="mt-4 h-9 rounded-xl border-dashed text-slate-500 font-bold">
                                        <Plus className="size-4 mr-2" />
                                        Agendar
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-[32px] p-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 size-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <h4 className="text-sm font-black text-white uppercase italic mb-4 flex items-center gap-2 relative z-10">
                            <Clock className="size-4 text-primary" />
                            Lembrete de Hoje
                        </h4>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed relative z-10">
                            Você tem <span className="text-white font-bold">{orders.filter(o => isSameDay(parseISO(o.delivery_date), new Date())).length} entregas</span> hoje. Verifique se todos os pedidos já estão na fase de finalização.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
