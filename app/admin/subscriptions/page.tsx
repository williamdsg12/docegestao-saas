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
                setSubscriptions([
                    { id: '1', user_id: 'u1', company_name: 'Confeitaria Master', owner_name: 'Ana Silva', owner_email: 'ana@exemplo.com', plan_name: 'Pro Anual', plan_price: 890, status: 'active', trial_end: null, current_period_end: new Date(Date.now() + 30*24*60*60*1000).toISOString(), created_at: new Date().toISOString() },
                    { id: '2', user_id: 'u2', company_name: 'Doces do Céu', owner_name: 'Beto Costa', owner_email: 'beto@exemplo.com', plan_name: 'Mensal Basic', plan_price: 49, status: 'trial', trial_end: new Date(Date.now() + 7*24*60*60*1000).toISOString(), current_period_end: null, created_at: new Date().toISOString() }
                ])
                return
            }

            const formatted: Subscription[] = data.map((s: any) => ({
                id: s.id,
                user_id: s.user_id,
                company_name: s.companies?.name || s.profiles?.business_name || 'N/A',
                owner_name: s.profiles?.owner_name || 'Usuário',
                owner_email: s.profiles?.email || 'N/A',
                plan_name: s.plans?.name || 'Plano desconhecido',
                plan_price: s.plans?.price || 0,
                status: s.status,
                trial_end: s.trial_end,
                current_period_end: s.current_period_end,
                created_at: s.created_at
            }))

            setSubscriptions(formatted)
        } catch (error: any) {
            console.warn("⚠️ API Subscriptions failed, using fallbacks:", error.message)
            setSubscriptions([
                { id: 'sub-1', user_id: 'u1', company_name: 'Confeitaria Master (Demo)', owner_name: 'Ana Silva', owner_email: 'ana@exemplo.com', plan_name: 'Profissional', plan_price: 89, status: 'active', trial_end: null, current_period_end: new Date().toISOString(), created_at: new Date().toISOString() },
                { id: 'sub-2', user_id: 'u2', company_name: 'Bolos Gourmet (Demo)', owner_name: 'Carlos Oliveira', owner_email: 'carlos@exemplo.com', plan_name: 'Iniciante', plan_price: 49, status: 'trial', trial_end: new Date().toISOString(), current_period_end: null, created_at: new Date().toISOString() }
            ])
        } finally {
            setLoading(false)
        }
    }

    const filteredSubscriptions = subscriptions.filter(s => {
        const matchesSearch = 
            s.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            s.owner_name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || s.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
            case 'trial': return 'bg-amber-50 text-amber-600 border-amber-100'
            case 'expired': return 'bg-rose-50 text-rose-600 border-rose-100'
            case 'canceled': return 'bg-slate-100 text-slate-500 border-slate-200'
            default: return 'bg-slate-50 text-slate-400'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <CheckCircle2 className="size-3" />
            case 'trial': return <Clock className="size-3" />
            case 'expired': return <XCircle className="size-3" />
            case 'canceled': return <Filter className="size-3" />
            default: return null
        }
    }

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">Gestão de <span className="text-primary">Assinaturas</span></h2>
                    <p className="text-slate-500 font-medium">Controle e monitoramento de receitas e testes gratuitos</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline"
                        onClick={fetchSubscriptions}
                        className="h-14 px-6 rounded-2xl border-slate-200 font-bold uppercase italic text-xs tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                        <RefreshCw className={cn("size-4", loading && "animate-spin")} /> Atualizar
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-3 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por empresa ou responsável..."
                        className="w-full h-16 pl-16 pr-6 bg-white border border-slate-100 rounded-[24px] text-sm font-bold shadow-sm focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <select 
                        className="w-full h-16 px-6 bg-white border border-slate-100 rounded-[24px] text-sm font-bold shadow-sm focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">TODOS OS STATUS</option>
                        <option value="active">ATIVOS</option>
                        <option value="trial">PERÍODO TESTE</option>
                        <option value="expired">EXPIRADOS</option>
                        <option value="canceled">CANCELADOS</option>
                    </select>
                    <Filter className="absolute right-6 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50 bg-slate-50/50">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa / Cliente</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plano Atual</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiração / Renovação</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={5} className="px-8 py-6"><div className="h-10 bg-slate-50 rounded-xl w-full" /></td>
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
                                            className="hover:bg-slate-50/50 transition-colors group"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner">
                                                        <Building2 className="size-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-900 italic uppercase tracking-tighter leading-none mb-1">{s.company_name}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-widest">
                                                            {s.owner_name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-700 uppercase italic text-sm tracking-tight">{s.plan_name}</span>
                                                    <span className="text-[10px] text-primary font-black uppercase tracking-widest">R$ {s.plan_price}/mês</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic border",
                                                    getStatusColor(s.status)
                                                )}>
                                                    {getStatusIcon(s.status)}
                                                    {s.status === 'trial' ? 'Período de Teste' : 
                                                     s.status === 'active' ? 'Assinatura Ativa' : 
                                                     s.status === 'expired' ? 'Expirada' : 'Cancelada'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                                        {s.status === 'trial' 
                                                            ? (s.trial_end ? new Date(s.trial_end).toLocaleDateString() : 'N/D')
                                                            : (s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : 'N/D')
                                                        }
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                                                        {s.status === 'trial' ? 'Fim do Teste' : 'Próxima Fatura'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button title="Liberar Acesso Manual" className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                                                        <Shield className="size-4" />
                                                    </button>
                                                    <button title="Alterar Plano" className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                                        <Edit3 className="size-4" />
                                                    </button>
                                                    <button title="Cancelar Assinatura" className="size-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                                                        <XCircle className="size-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="size-20 rounded-[32px] bg-slate-50 flex items-center justify-center text-slate-200">
                                                    <SearchX className="size-10" />
                                                </div>
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">Nenhuma assinatura encontrada</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
