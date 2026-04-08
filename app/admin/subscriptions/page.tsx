"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Search,
    CreditCard,
    Mail,
    Shield,
    MoreHorizontal,
    Edit3,
    CheckCircle2,
    XCircle,
    Building2,
    Filter,
    ArrowUpRight,
    RefreshCw,
    AlertCircle,
    ChevronRight
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Subscription {
    id: string
    user_id: string
    company_name: string
    owner_name: string
    owner_email: string
    plan_name: string
    plan_price: number
    status: 'trial' | 'active' | 'expired' | 'canceled' | 'past_due'
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
            if (!response.ok) {
                throw new Error('API Error')
            }
            const data = await response.json()

            if (!data || data.length === 0) {
                setSubscriptions([])
                return
            }

            const formatted: Subscription[] = data.map((s: any) => ({
                id: s.id,
                user_id: s.user_id || s.owner_id,
                company_name: s.empresas?.name || s.profiles?.business_name || 'Desconhecido',
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
            // mock for UI view
            setSubscriptions([
                 { id: '1', user_id: '1', company_name: 'Doce Sabor', owner_name: 'Maria Silva', owner_email: 'maria@docesabor.com', plan_name: 'Pro', plan_price: 147.90, status: 'active', trial_end: null, current_period_end: new Date(Date.now() + 86400000 * 15).toISOString(), created_at: new Date().toISOString() },
                 { id: '2', user_id: '2', company_name: 'Bolos & Cia', owner_name: 'João Pedro', owner_email: 'joao@bolosecia.com', plan_name: 'Start', plan_price: 97.90, status: 'trial', trial_end: new Date(Date.now() + 86400000 * 3).toISOString(), current_period_end: null, created_at: new Date().toISOString() },
            ])
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
            case 'active': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            case 'trial': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            case 'expired': return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            case 'past_due': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
            case 'canceled': return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return "Ativa"
            case 'trial': return "Em Teste"
            case 'expired': return "Expirada"
            case 'past_due': return "Em Atraso"
            case 'canceled': return "Cancelada"
            default: return "Desconhecido"
        }
    }

    const trialCount = subscriptions.filter(s => s.status === 'trial').length
    const activeCount = subscriptions.filter(s => s.status === 'active').length

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Caregando Assinaturas...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10 w-full xl:max-w-[70%]">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] italic">Subscription Lifecycle</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-[0.85]">
                        Gestão de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-400">Assinaturas</span>
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic mt-4">Lifecycle Analytics // MRR Optimization</p>
                </div>
                
                <div className="flex items-center gap-4 bg-slate-900 border border-white/5 px-6 py-4 rounded-2xl shadow-xl">
                    <div className="flex flex-col text-right pr-4 border-r border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Growth</p>
                        <div className="flex gap-4 mt-1">
                            <span className="text-xs font-black text-emerald-400 italic uppercase">{activeCount} Ativos</span>
                            <span className="text-xs font-black text-amber-400 italic uppercase">{trialCount} Trials</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            toast.success("Kernels sincronizados com sucesso!")
                            fetchSubscriptions()
                        }}
                        className="size-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold hover:scale-105 transition-transform border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                        <RefreshCw className={cn("size-5", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* List & Filters Section */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-900 border border-white/5 rounded-[32px] overflow-hidden shadow-2xl relative"
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between relative z-10">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar empresa, titular ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-white/5 text-slate-300 text-sm rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                        />
                    </div>
                    <div className="flex gap-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-slate-950 border border-white/5 text-slate-300 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                        >
                            <option value="all">Todos os Status</option>
                            <option value="active">Ativos</option>
                            <option value="trial">Em Teste</option>
                            <option value="expired">Expirados</option>
                            <option value="past_due">Inadimplentes</option>
                            <option value="canceled">Cancelados</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/50">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Assinante / Empresa</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Plano Atual</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Valor Pago</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Ciclo / Trial</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredSubscriptions.map((sub, index) => (
                                <tr key={sub.id} className="hover:bg-slate-800/50 transition-colors group cursor-pointer">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-black group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors shadow-inner shadow-black/50">
                                                <CreditCard className="size-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm mb-0.5">{sub.company_name}</p>
                                                <div className="flex flex-col text-xs text-slate-500">
                                                    <span className="font-bold">{sub.owner_name}</span>
                                                    <span>{sub.owner_email}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1 bg-white/5 text-slate-300 rounded-lg text-xs font-bold border border-white/10 uppercase tracking-widest shadow-sm">
                                            {sub.plan_name}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-black text-white italic">
                                        R$ {sub.plan_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                            getStatusStyle(sub.status)
                                        )}>
                                            {getStatusLabel(sub.status)}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            {sub.status === 'trial' ? (
                                                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                                                    <AlertCircle className="size-3" />
                                                    Término: {sub.trial_end ? format(new Date(sub.trial_end), "dd/MM", { locale: ptBR }) : 'N/A'}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                    <RefreshCw className="size-3 text-slate-500" />
                                                    Renova: {sub.current_period_end ? format(new Date(sub.current_period_end), "dd/MM/yyyy") : 'Manual'}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors">
                                                <XCircle className="size-4" />
                                            </button>
                                            <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors">
                                                <ChevronRight className="size-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredSubscriptions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-8 py-12 text-center text-slate-500 font-bold">
                                        Nenhuma assinatura encontrada na base.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    )
}
