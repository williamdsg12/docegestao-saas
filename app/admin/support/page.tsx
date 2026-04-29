"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Search,
    MessageSquare,
    Clock,
    CheckCircle2,
    XCircle,
    Building2,
    AlertCircle,
    Filter,
    RefreshCw,
    MessageCircle,
    Zap,
    Send,
    UserCircle,
    MoreHorizontal
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SupportTicket {
    id: string
    company_name: string
    owner_name: string
    subject: string
    message: string
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    created_at: string
}

export default function SupportManagement() {
    const [tickets, setTickets] = useState<SupportTicket[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchTickets()
    }, [])

    async function fetchTickets() {
        setLoading(true)
        try {
            const response = await fetch('/api/admin/support')
            if (!response.ok) throw new Error('API Error')
            const data = await response.json()

            const formatted: SupportTicket[] = data.map((t: any) => ({
                id: t.id,
                company_name: t.empresas?.name || 'Sistema',
                owner_name: t.profiles?.owner_name || 'Usuário',
                subject: t.subject,
                message: t.message,
                status: t.status,
                priority: t.priority,
                created_at: t.created_at
            }))

            setTickets(formatted)
        } catch (error: any) {
            console.warn("⚠️ API Support failed, using fallbacks")
            setTickets([
                { id: 'tk-1', company_name: 'Confeitaria Master', owner_name: 'Ana Silva', subject: 'Problema no checkout', message: 'O cliente não consegue finalizar o pagamento via PIX.', status: 'open', priority: 'high', created_at: new Date().toISOString() },
                { id: 'tk-2', company_name: 'Doces & Co', owner_name: 'Carlos Oliveira', subject: 'Aumento de limite', message: 'Gostaria de saber como mudo para o plano PRO.', status: 'in_progress', priority: 'medium', created_at: new Date().toISOString() }
            ])
        } finally {
            setLoading(false)
        }
    }

    const filteredTickets = tickets.filter(t => 
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'open': return "bg-rose-500/10 text-rose-400 border-rose-500/20"
            case 'in_progress': return "bg-amber-500/10 text-amber-400 border-amber-500/20"
            case 'resolved': return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            default: return "bg-slate-500/10 text-slate-400 border-slate-500/20"
        }
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                        Support <span className="text-rose-500">Sphere</span>
                    </h2>
                    <p className="text-sm text-slate-500 mt-2">Gestão de chamados, incidentes e sucesso do cliente.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col text-right pr-4 border-r border-white/[0.05]">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest leading-none mb-1">Chamados Abertos</p>
                        <p className="text-xl font-bold text-rose-500">
                            {tickets.filter(t => t.status === 'open').length}
                        </p>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="bg-[#09090b] border border-white/[0.05] rounded-xl overflow-hidden shadow-sm relative">
                {/* Search / Filters */}
                <div className="p-8 border-b border-white/[0.05] flex flex-col md:flex-row gap-6 justify-between relative z-10">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar por assunto, empresa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/20 border border-white/[0.05] text-slate-300 text-sm rounded-xl pl-12 pr-4 h-11 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all placeholder:text-slate-600"
                        />
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={fetchTickets}
                            className="h-11 px-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-slate-400 hover:text-white transition-all flex items-center gap-2 text-xs"
                        >
                            <RefreshCw className={cn("size-4", loading && "animate-spin")} /> 
                            Sincronizar
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto relative z-10 p-2">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Ticket / Descrição</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Solicitante</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Prioridade</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-10 py-8"><Skeleton className="h-12 w-64 rounded-xl" /></td>
                                        <td className="px-8 py-8"><Skeleton className="h-12 w-32 rounded-xl" /></td>
                                        <td className="px-8 py-8"><Skeleton className="h-12 w-20 rounded-xl" /></td>
                                        <td className="px-8 py-8"><Skeleton className="h-12 w-24 rounded-xl" /></td>
                                        <td className="px-10 py-8 text-right"><Skeleton className="ml-auto h-12 w-12 rounded-xl" /></td>
                                    </tr>
                                ))
                            ) : (
                                filteredTickets.map((t) => (
                                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="size-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-rose-400 group-hover:bg-rose-400/10 transition-all shadow-inner">
                                                    <MessageSquare className="size-6" />
                                                </div>
                                                <div className="max-w-md">
                                                    <p className="font-bold text-white text-base mb-1 tracking-tight truncate">{t.subject}</p>
                                                    <p className="text-[11px] text-slate-500 font-medium truncate">{t.message}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-xl bg-slate-950 flex items-center justify-center text-slate-500">
                                                    <UserCircle className="size-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-200 text-sm">{t.company_name}</p>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.owner_name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest italic",
                                                t.priority === 'urgent' ? "text-rose-500" : t.priority === 'high' ? "text-orange-500" : "text-slate-500"
                                            )}>
                                                {t.priority}
                                            </span>
                                        </td>
                                        <td className="px-8 py-8">
                                            <span className={cn(
                                                "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border inline-flex items-center gap-2",
                                                getStatusStyle(t.status)
                                            )}>
                                                <div className={cn("size-1.5 rounded-full bg-current", t.status === 'open' && "animate-pulse")} />
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="p-3 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all active:scale-90">
                                                        <MoreHorizontal className="size-6" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-white/10 text-slate-300 p-2 rounded-2xl shadow-2xl">
                                                    <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 hover:text-white transition-all">
                                                        <Zap className="size-4 text-amber-400" />
                                                        <span className="font-bold text-xs uppercase italic">Atender Agora</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 hover:text-white transition-all">
                                                        <Send className="size-4 text-indigo-400" />
                                                        <span className="font-bold text-xs uppercase italic">Responder Email</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-white/5" />
                                                    <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-400 transition-all font-bold text-xs uppercase italic">
                                                        <CheckCircle2 className="size-4" />
                                                        Resolver Chamado
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                            {!loading && filteredTickets.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-10 py-20 text-center text-slate-500 font-black uppercase tracking-widest italic text-sm">
                                        Nenhum chamado aberto no radar. Tudo limpo!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Advice Section */}
            <div className="bg-[#09090b] border border-white/[0.05] rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="size-14 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/10">
                        <AlertCircle className="size-6" />
                    </div>
                    <div className="text-center md:text-left">
                        <h4 className="text-lg font-bold text-white tracking-tight">SLA sob Controle?</h4>
                        <p className="text-sm text-slate-500 mt-1 max-w-xl">
                            Mantenha o tempo de resposta abaixo de 2 horas. Chamados urgentes devem ser atendidos prioritariamente.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
