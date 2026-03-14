"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Search,
    CreditCard,
    Mail,
    Shield,
    Calendar,
    MoreHorizontal,
    Edit3,
    CheckCircle2,
    XCircle,
    Clock,
    Building2,
    SearchX,
    Filter,
    ArrowUpRight,
    RefreshCw
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface Subscription {
    id: string
    user_id: string
    company_name: string
    owner_name: string
    owner_email: string
    plan_name: string
    plan_price: number
    status: 'trial' | 'active' | 'expired' | 'canceled'
    trial_end: string | null
    current_period_end: string | null
    created_at: string
}

export default function SubscriptionsManagement() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")

    useEffect(() => {
        fetchSubscriptions()
    }, [])

    async function fetchSubscriptions() {
        setLoading(true)
        try {
            const response = await fetch('/api/admin/subscriptions')
            if (!response.ok) throw new Error('API Error')
            const data = await response.json()

            if (!data || data.length === 0) {
                setSubscriptions([])
                return
            }

            const formatted: Subscription[] = data.map((s: any) => ({
                id: s.id,
                user_id: s.user_id,
                company_name: s.companies?.name || s.profiles?.business_name || 'Desconhecido',
                owner_name: s.profiles?.owner_name || 'Usuário',
                owner_email: s.profiles?.email || 'N/A',
                plan_name: s.plans?.name || 'Plano Fixado',
                plan_price: s.plans?.price || 0,
                status: s.status || 'trial',
                trial_end: s.trial_end,
                current_period_end: s.current_period_end,
                created_at: s.created_at
            }))

            setSubscriptions(formatted)
        } catch (error: any) {
            console.error("error fetching subscriptions:", error)
            toast.error("Erro ao sincronizar banco de assinaturas")
        } finally {
            setLoading(false)
        }
    }

    const filteredSubscriptions = subscriptions.filter(s => {
        const matchesSearch = 
            s.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            s.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || s.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-sm shadow-emerald-500/5'
            case 'trial': return 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-sm shadow-amber-500/5'
            case 'expired': return 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-sm shadow-rose-500/5'
            case 'canceled': return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
            default: return 'bg-slate-50/10 text-slate-400 border-slate-100'
        }
    }

    const trialCount = subscriptions.filter(s => s.status === 'trial').length
    const activeCount = subscriptions.filter(s => s.status === 'active').length

    return (
        <div className="space-y-12 pb-24">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-2 bg-indigo-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] italic">Subscription Lifecycle</span>
                    </div>
                    <h2 className="text-6xl font-black text-slate-900 italic uppercase tracking-tighter leading-[0.8]">
                        Gestão de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">Assinaturas</span>
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] italic">Lifecycle Analytics // MRR Optimization</p>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="flex flex-col text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Snapshot</p>
                        <div className="flex gap-4 mt-1">
                            <span className="text-xs font-black text-emerald-600 italic uppercase">● {activeCount} ATIVOS</span>
                            <span className="text-xs font-black text-amber-600 italic uppercase">● {trialCount} TRIALS</span>
                        </div>
                    </div>
                    <Button 
                        variant="outline"
                        onClick={fetchSubscriptions}
                        className="h-14 px-8 rounded-[24px] border-slate-100 bg-white/40 backdrop-blur-md font-black uppercase italic text-[10px] tracking-widest gap-3 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                    >
                        <RefreshCw className={cn("size-5", loading && "animate-spin")} /> 
                        Sincronizar Kernels
                    </Button>
                </div>
            </div>

            {/* Smart Filtering Engine */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="IDENTIFY BENEFICIARY OR PARTNER..."
                        className="w-full h-16 pl-16 pr-6 bg-white border border-slate-100 rounded-[28px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/5 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative group">
                    <select 
                        className="w-full h-16 px-8 bg-white border border-slate-100 rounded-[28px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/5 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer italic"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Filtro: Todos</option>
                        <option value="active">Protocolo: Ativo</option>
                        <option value="trial">Protocolo: Teste</option>
                        <option value="expired">Protocolo: Expirado</option>
                        <option value="canceled">Protocolo: Cancelado</option>
                    </select>
                    <Filter className="absolute right-8 top-1/2 -translate-y-1/2 size-4 text-slate-300 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
                </div>
            </div>

            {/* Subscriptions Grid Table */}
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-[56px] border border-white/40 shadow-2xl overflow-hidden bg-white/60 backdrop-blur-md"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/20">
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic tracking-wider">Subscriber Entity</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic tracking-wider">Defined Tier</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic tracking-wider">Protocol Status</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic tracking-wider">Lifecycle Horizon</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-right tracking-wider">Admin Ops</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={5} className="px-10 py-8"><div className="h-10 bg-slate-100 rounded-2xl w-full" /></td>
                                        </tr>
                                    ))
                                ) : filteredSubscriptions.length > 0 ? (
                                    filteredSubscriptions.map((s) => (
                                        <motion.tr
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            key={s.id}
                                            className="hover:bg-indigo-50/20 transition-all group"
                                        >
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="size-14 rounded-[20px] bg-white border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-2xl group-hover:shadow-indigo-600/30 group-hover:scale-110 group-hover:rotate-2 transition-all duration-500">
                                                        <Building2 className="size-7" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-900 italic uppercase tracking-tighter text-lg leading-tight">{s.company_name}</span>
                                                        <span className="text-[10px] text-indigo-500 font-black flex items-center gap-2 uppercase tracking-widest mt-1 italic">
                                                            <Mail className="size-3" />
                                                            {s.owner_email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900 uppercase italic text-sm tracking-tight">{s.plan_name}</span>
                                                    <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest italic mt-1 bg-emerald-50 w-fit px-2 py-0.5 rounded-full">CREDIT: R$ {s.plan_price}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className={cn(
                                                    "inline-flex items-center gap-3 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.25em] italic border transition-all duration-500",
                                                    getStatusStyle(s.status)
                                                )}>
                                                    {s.status === 'active' && <CheckCircle2 className="size-4 animate-bounce" />}
                                                    {s.status === 'trial' && <Clock className="size-4 animate-pulse" />}
                                                    {s.status === 'expired' && <XCircle className="size-4 animate-shake" />}
                                                    {s.status === 'active' ? 'Operational' : 
                                                     s.status === 'trial' ? 'Sandbox Mode' : 
                                                     s.status === 'expired' ? 'Link Severed' : 'Purged'}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-900 uppercase italic tracking-tighter">
                                                        {s.status === 'trial' 
                                                            ? (s.trial_end ? new Date(s.trial_end).toLocaleDateString() : '—')
                                                            : (s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : '—')
                                                        }
                                                    </span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">
                                                        {s.status === 'trial' ? 'Terminal Date' : 'Billing Refresh'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                                                    <button title="Override Security" className="size-12 rounded-[18px] bg-white border border-slate-100 text-emerald-500 flex items-center justify-center hover:bg-emerald-600 hover:text-white shadow-xl hover:-translate-y-1 transition-all">
                                                        <Shield className="size-5" />
                                                    </button>
                                                    <button title="Modify Vector" className="size-12 rounded-[18px] bg-white border border-slate-100 text-blue-500 flex items-center justify-center hover:bg-blue-600 hover:text-white shadow-xl hover:-translate-y-1 transition-all">
                                                        <Edit3 className="size-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-40 text-center">
                                            <div className="flex flex-col items-center gap-8">
                                                <div className="size-32 rounded-[48px] bg-slate-50 flex items-center justify-center text-slate-200 shadow-inner">
                                                    <SearchX className="size-16" />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-slate-900 font-black uppercase tracking-[0.2em] text-sm italic">Nenhuma entidade detectada</p>
                                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">O escaneamento global não retornou registros de assinatura ativos</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Grid Footer Insight */}
                <div className="px-10 py-10 border-t border-slate-100/50 flex flex-col sm:flex-row items-center justify-between bg-white text-[10px] font-black uppercase tracking-widest italic text-slate-400 gap-8">
                    <div className="flex items-center gap-4">
                        <div className="size-3 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                        Infrastructure Synchronized: Subscriptions V2.4 Audit
                    </div>
                    <div className="flex items-center gap-6">
                        <span className="text-slate-900 border-b-2 border-indigo-500 pb-1 cursor-pointer hover:text-indigo-500 transition-colors">Export Vector Logs</span>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
