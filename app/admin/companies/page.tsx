"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Search,
    Filter,
    Edit3,
    Ban,
    Trash2,
    CheckCircle2,
    ExternalLink,
    Building2,
    Download,
    ChevronRight,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Company {
    id: string
    name: string
    responsible_name: string
    email: string
    phone: string
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
            if (!response.ok) {
                throw new Error('API Error')
            }
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
                phone: c.telefone || c.phone || 'Sem Telefone',
                created_at: c.created_at,
                plan_name: c.plans?.name || 'Iniciante',
                status: (c.status || 'active') as any
            }))

            setCompanies(formatted)
        } catch (error: any) {
            console.error("error fetching companies:", error)
            // fallback mock for UI testing
            setCompanies([
                { id: '1', name: 'Doce Sabor LTDA', responsible_name: 'Maria Silva', email: 'maria@docesabor.com', phone: '11999999999', created_at: new Date().toISOString(), plan_name: 'Pro', status: 'active' },
                { id: '2', name: 'Bolos & Cia', responsible_name: 'João Pedro', email: 'joao@bolosecia.com', phone: '11888888888', created_at: new Date().toISOString(), plan_name: 'Start', status: 'trial' },
            ])
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
            case 'active': return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            case 'trial': return "bg-amber-500/10 text-amber-400 border-amber-500/20"
            case 'blocked': return "bg-rose-500/10 text-rose-400 border-rose-500/20"
            case 'past_due': return "bg-orange-500/10 text-orange-400 border-orange-500/20"
            case 'canceled': return "bg-slate-500/10 text-slate-400 border-slate-500/20"
            default: return "bg-slate-500/10 text-slate-400 border-slate-500/20"
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return "Ativa"
            case 'trial': return "Em Teste"
            case 'blocked': return "Bloqueada"
            case 'past_due': return "Atraso"
            case 'canceled': return "Cancelada"
            default: return status
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-slate-800 border-t-amber-500 rounded-full animate-spin shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Caregando Empresas...</span>
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
                        <div className="size-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] italic">Network Overview</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-[0.85]">
                        Gestão <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-300">B2B</span>
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic mt-4">Ecosystem Audit // Confeitarias Cadastradas</p>
                </div>
                
                <div className="flex items-center gap-4 bg-slate-900 border border-white/5 px-6 py-4 rounded-2xl shadow-xl">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Total de Parceiros</p>
                        <p className="text-2xl font-black text-white italic">{companies.length}</p>
                    </div>
                    <button 
                        onClick={() => toast.success("Relatório B2B exportado!")}
                        className="size-12 rounded-xl bg-amber-500 text-slate-900 flex items-center justify-center font-bold hover:scale-105 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.3)] focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    >
                        <Download className="size-5" />
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
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between relative z-10">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar empresa, email ou responsável..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-white/5 text-slate-300 text-sm rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder:text-slate-600"
                        />
                    </div>
                    <div className="flex gap-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-slate-950 border border-white/5 text-slate-300 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all appearance-none cursor-pointer"
                        >
                            <option value="all">Todos os Status</option>
                            <option value="active">Ativas</option>
                            <option value="trial">Em Teste</option>
                            <option value="past_due">Inadimplentes</option>
                            <option value="blocked">Bloqueadas</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/50">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Parceiro B2B</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Contato</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Plano Atual</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredCompanies.map((company, index) => (
                                <tr key={company.id} className="hover:bg-slate-800/50 transition-colors group cursor-pointer">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-black group-hover:bg-amber-500/20 group-hover:text-amber-400 transition-colors shadow-inner shadow-black/50">
                                                <Building2 className="size-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm mb-0.5">{company.name}</p>
                                                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">ID: {company.id.split('-')[0]}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm text-slate-300 font-bold">{company.responsible_name}</p>
                                        <p className="text-xs text-slate-500">{company.email}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1 bg-white/5 text-slate-300 rounded-lg text-xs font-bold border border-white/10 uppercase tracking-widest shadow-sm">
                                            {company.plan_name}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                            getStatusStyle(company.status)
                                        )}>
                                            {getStatusLabel(company.status)}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors">
                                                <CheckCircle2 className="size-4" />
                                            </button>
                                            <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors">
                                                <Ban className="size-4" />
                                            </button>
                                            <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors">
                                                <ExternalLink className="size-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredCompanies.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-slate-500 font-bold">
                                        Nenhuma empresa encontrada de acordo com os filtros.
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
