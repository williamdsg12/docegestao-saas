
"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Search,
    ShoppingBag,
    Calendar,
    Building2,
    SearchX,
    Filter,
    Download,
    Eye,
    MessageCircle,
    BadgeDollarSign,
    Clock,
    CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface AdminOrder {
    id: string
    product_name: string
    total_value: number
    deposit_value: number
    status: string
    delivery_date: string
    created_at: string
    company_name: string
    client_name: string
}

export default function AdminOrdersManagement() {
    const [orders, setOrders] = useState<AdminOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    useEffect(() => {
        fetchOrders()
    }, [])

    async function fetchOrders() {
        setLoading(true)
        try {
            const response = await fetch('/api/admin/orders')
            if (!response.ok) throw new Error('API Error')
            const data = await response.json()

            const formatted: AdminOrder[] = data.map((o: any) => ({
                id: o.id,
                product_name: o.product_name || 'N/A',
                total_value: o.total_value || 0,
                deposit_value: o.deposit_value || 0,
                status: o.status || 'orcamento',
                delivery_date: o.delivery_date,
                created_at: o.created_at,
                company_name: o.companies?.name || 'N/A',
                client_name: o.clients?.name || 'Venda Direta'
            }))

            setOrders(formatted)
        } catch (error: any) {
            console.error("error fetching orders:", error)
            toast.error("Erro ao carregar banco de pedidos")
        } finally {
            setLoading(false)
        }
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'entregue': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            case 'finalizado': return 'bg-primary/10 text-primary border-primary/20'
            case 'producao': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            case 'confirmado': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
        }
    }

    const filteredOrders = orders.filter(o => {
        const matchesSearch = 
            o.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.client_name.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter
        
        return matchesSearch && matchesStatus
    })

    return (
        <div className="p-8 space-y-12 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-2 bg-primary rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic">Operations Ledger</span>
                    </div>
                    <h2 className="text-6xl font-black text-slate-900 italic uppercase tracking-tighter leading-[0.8]">
                        Fluxo de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">Pedidos</span>
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] italic">Global Stream // Conciliação de Encomendas</p>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="flex flex-col text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Giro Bruto</p>
                        <p className="text-2xl font-black text-slate-900 italic">
                            R$ {orders.reduce((acc, curr) => acc + curr.total_value, 0).toLocaleString('pt-BR')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative group flex-1 w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="BUSCAR PRODUTO, EMPRESA OU CLIENTE..."
                        className="w-full h-16 pl-16 pr-6 bg-white border border-slate-100 rounded-[24px] text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/5 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all placeholder:text-slate-300 italic"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
                    {['all', 'orcamento', 'confirmado', 'producao', 'finalizado', 'entregue'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={cn(
                                "h-16 px-8 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                                statusFilter === status 
                                    ? "bg-slate-900 text-white border-slate-900 shadow-xl" 
                                    : "bg-white text-slate-400 border-slate-100 hover:border-primary/20"
                            )}
                        >
                            {status === 'all' ? 'Ver Todos' : status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-[48px] border border-white/40 shadow-2xl overflow-hidden bg-white/60 backdrop-blur-md"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/30">
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Item / Origem</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Responsável / Cliente</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center">Snapshot de Valor</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Status Log</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-right">Ops</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={5} className="px-10 py-8">
                                                <div className="h-10 bg-slate-100 rounded-2xl w-full" />
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredOrders.length > 0 ? (
                                    filteredOrders.map((o) => (
                                        <motion.tr
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            key={o.id}
                                            className="hover:bg-primary/5 transition-all group"
                                        >
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="size-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all">
                                                        <ShoppingBag className="size-7" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-900 italic uppercase tracking-tighter text-lg">{o.product_name}</span>
                                                        <span className="text-[10px] text-primary font-black flex items-center gap-1 uppercase tracking-[0.2em] mt-1 italic">
                                                            <Building2 className="size-3" />
                                                            {o.company_name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-700 italic uppercase tracking-tighter text-xs">{o.client_name}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Delivery: {o.delivery_date ? new Date(o.delivery_date).toLocaleDateString() : 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-lg font-black text-slate-900 italic tracking-tighter">R$ {o.total_value.toLocaleString('pt-BR')}</span>
                                                    <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest italic bg-emerald-50 px-3 py-1 rounded-full mt-1">
                                                        Entrada: R$ {o.deposit_value.toLocaleString('pt-BR')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic border transition-all shadow-sm",
                                                    getStatusStyle(o.status)
                                                )}>
                                                    <Clock className="size-3" />
                                                    {o.status}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                                                    <button title="View Detail" className="size-12 rounded-[18px] bg-white border border-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-900 hover:text-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                                                        <Eye className="size-5" />
                                                    </button>
                                                    <button title="Contact Center" className="size-12 rounded-[18px] bg-white border border-slate-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                                                        <MessageCircle className="size-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-32 text-center">
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="size-24 rounded-[40px] bg-slate-50 flex items-center justify-center text-slate-200">
                                                    <SearchX className="size-12" />
                                                </div>
                                                <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">Nenhum fluxo de pedidos detectado</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Footer Insight */}
                <div className="px-10 py-8 border-t border-slate-100/50 flex items-center justify-between bg-white/40">
                    <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
                            <BadgeDollarSign className="size-6" />
                        </div>
                        <div>
                            <p className="font-black text-slate-900 italic uppercase tracking-tighter">Volume Monitorado</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sincronização em tempo real com o kernel</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
