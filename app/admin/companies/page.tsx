"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Search,
    Filter,
    MoreHorizontal,
    Eye,
    Edit3,
    Ban,
    Trash2,
    CheckCircle2,
    ExternalLink,
    Building2,
    Mail,
    Phone,
    Calendar,
    ChevronLeft,
    ChevronRight,
    SearchX
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Company {
    id: string
    name: string
    responsible_name: string
    email: string
    phone: string
    document: string
    created_at: string
    plan_name: string
    status: 'active' | 'trial' | 'past_due' | 'canceled' | 'blocked'
}

export default function CompaniesManagement() {
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    useEffect(() => {
        fetchCompanies()
    }, [])

    async function fetchCompanies() {
        setLoading(true)
        try {
            const response = await fetch('/api/admin/companies')
            if (!response.ok) throw new Error('API Error')
            const data = await response.json()

            if (!data || data.length === 0) {
                setCompanies([])
                return
            }

            const formatted: Company[] = data.map((c: any) => ({
                id: c.id,
                name: c.name || 'Sem Empresa',
                responsible_name: c.profiles?.owner_name || 'Sem Nome',
                email: c.profiles?.email || 'N/A', 
                phone: c.phone || 'Sem Telefone',
                document: 'N/A',
                created_at: c.created_at,
                plan_name: c.plans?.name || 'Iniciante',
                status: (c.status || 'active') as any
            }))

            setCompanies(formatted)
        } catch (error: any) {
            console.error("error fetching companies:", error)
            toast.error("Erro ao carregar empresas reais. Verifique o console.")
        } finally {
            setLoading(false)
        }
    }

    const filteredCompanies = companies.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             c.responsible_name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || c.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'active': return "bg-emerald-50 text-emerald-600 border-emerald-100/50 shadow-sm shadow-emerald-500/5"
            case 'trial': return "bg-amber-50 text-amber-600 border-amber-100/50 shadow-sm shadow-amber-500/5"
            case 'blocked': return "bg-slate-900 text-white border-slate-900 shadow-lg shadow-black/10"
            case 'past_due': return "bg-rose-50 text-rose-600 border-rose-100/50 shadow-sm shadow-rose-500/5"
            case 'canceled': return "bg-slate-100 text-slate-500 border-slate-200/50 shadow-sm"
            default: return "bg-slate-50 text-slate-400 border-slate-100"
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return "Ativa"
            case 'trial': return "Teste"
            case 'blocked': return "Bloqueada"
            case 'past_due': return "Atrasado"
            case 'canceled': return "Cancelada"
            default: return status
        }
    }

    return (
        <div className="space-y-12 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-2 bg-indigo-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] italic">Network Overview</span>
                    </div>
                    <h2 className="text-6xl font-black text-slate-900 italic uppercase tracking-tighter leading-[0.8]">
                        Gestão <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">B2B</span>
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] italic">Ecosystem Audit // Confeitarias Cadastradas</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex flex-col text-right mr-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Parceiros</p>
                        <p className="text-2xl font-black text-slate-900 italic">{companies.length}</p>
                    </div>
                    <Button 
                        onClick={() => {
                            toast.promise(
                                new Promise((resolve) => setTimeout(resolve, 2000)),
                                {
                                    loading: 'Gerando relatório B2B...',
                                    success: 'Manifesto exportado com sucesso!',
                                    error: 'Falha na exportação',
                                }
                            )
                        }}
                        className="h-16 px-10 rounded-[32px] bg-slate-900 text-white font-black uppercase italic tracking-widest text-xs shadow-2xl shadow-slate-900/20 hover:scale-105 transition-all group"
                    >
                        Export Log <ChevronRight className="size-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>

            {/* Filter & Search Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2 relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        <Search className="size-6" />
                    </div>
                    <input
                        type="text"
                        placeholder="BUSCAR POR NOME, EMAIL OU RESPONSÁVEL..."
                        className="w-full h-20 pl-16 pr-6 bg-white border border-slate-100 rounded-[32px] text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/5 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 italic"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="lg:col-span-2 flex items-center gap-3 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
                    {['all', 'active', 'trial', 'past_due', 'blocked'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                "h-20 px-8 rounded-[32px] font-black uppercase italic text-[10px] tracking-widest border transition-all whitespace-nowrap flex flex-col items-center justify-center gap-1 min-w-[120px]",
                                statusFilter === s 
                                    ? "bg-slate-900 text-white border-slate-900 shadow-2xl shadow-slate-900/30 -translate-y-1" 
                                    : "bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-600"
                            )}
                        >
                            <span className="opacity-60">{s === 'all' ? 'Ver' : 'Filtro'}</span>
                            <span className="text-xs">{s === 'all' ? 'Todos' : getStatusLabel(s)}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Premium Table Content */}
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-[48px] border border-white/40 shadow-2xl shadow-indigo-500/5 overflow-hidden bg-white/60 backdrop-blur-md"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/30">
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Parceiro / Cadastro</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Responsável / Contact</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center">Plan Tier</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Status</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-right">Administrative</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={5} className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-16 bg-slate-100 rounded-3xl" />
                                                    <div className="space-y-2 flex-1">
                                                        <div className="h-4 bg-slate-100 rounded w-1/3" />
                                                        <div className="h-2 bg-slate-50 rounded w-1/4" />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredCompanies.length > 0 ? (
                                    filteredCompanies.map((c) => (
                                        <motion.tr
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            key={c.id}
                                            className="hover:bg-indigo-50/30 transition-all group relative"
                                        >
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="size-16 rounded-[24px] bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 group-hover:from-indigo-600 group-hover:to-indigo-500 group-hover:text-white group-hover:shadow-xl group-hover:shadow-indigo-500/20 group-hover:-rotate-3 transition-all duration-500">
                                                        <Building2 className="size-8" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-900 italic uppercase tracking-tighter text-lg">{c.name}</span>
                                                        <span className="text-[10px] text-slate-400 font-black flex items-center gap-1 uppercase tracking-[0.2em] mt-1 italic">
                                                            <Calendar className="size-3" />
                                                            {new Date(c.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-black text-slate-900 italic uppercase tracking-tighter text-xs">{c.responsible_name}</span>
                                                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60">
                                                        <span className="flex items-center gap-1"><Mail className="size-3" /> {c.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <div className="inline-flex flex-col items-center px-4 py-2 rounded-2xl bg-slate-100/50 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                    <span className="font-black text-slate-900 italic uppercase tracking-widest text-[11px]">{c.plan_name}</span>
                                                    <span className="text-[8px] text-slate-400 font-black uppercase mt-1 tracking-[0.2em]">Tier Level</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic border transition-all duration-500",
                                                    getStatusStyle(c.status)
                                                )}>
                                                    <div className={cn("size-2 rounded-full", (c.status === 'active' || c.status === 'trial') ? "bg-current animate-pulse" : "bg-current opacity-60")} />
                                                    {getStatusLabel(c.status)}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                                                    <button title="Acessar Sistema" className="size-11 rounded-2xl bg-white border border-slate-100 text-slate-900 flex items-center justify-center hover:bg-slate-900 hover:text-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                                                        <ExternalLink className="size-5" />
                                                    </button>
                                                    <button title="Editar Empresa" className="size-11 rounded-2xl bg-white border border-slate-100 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                                                        <Edit3 className="size-5" />
                                                    </button>
                                                    <button title="Suspender Acesso" className="size-11 rounded-2xl bg-white border border-slate-100 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                                                        <Ban className="size-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-32 text-center bg-slate-50/10">
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="size-24 rounded-[40px] bg-white border border-slate-100 flex items-center justify-center text-slate-100 shadow-xl shadow-indigo-500/5">
                                                    <SearchX className="size-12" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-slate-900 font-black uppercase tracking-widest text-sm italic">Parceiros não encontrados</p>
                                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Tente ajustar os critérios de busca ou filtros</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Footnote Stats */}
                <div className="px-10 py-8 border-t border-slate-100/50 flex flex-col sm:flex-row items-center justify-between bg-slate-50/10 gap-6">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-slate-900 flex items-center justify-center text-white text-[10px] font-black italic">
                            {filteredCompanies.length}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                            Entidades sob governança ativa
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button className="h-12 px-6 rounded-2xl bg-white border border-slate-200 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 hover:border-slate-400 transition-all flex items-center gap-2">
                            <ChevronLeft className="size-4" /> Anterior
                        </button>
                        <button className="h-12 px-6 rounded-2xl bg-white border border-slate-200 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 hover:border-slate-400 transition-all flex items-center gap-2">
                            Próximo <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
