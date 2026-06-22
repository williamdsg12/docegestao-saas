"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Search,
    Edit3,
    Ban,
    Trash2,
    CheckCircle2,
    Building2,
    Download,
    TrendingUp,
    MoreHorizontal,
    Eye,
    UserCircle,
    ArrowUpRight,
    SearchX
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AdminTableActions } from "@/components/admin/AdminTableActions"
import { AdminButton } from "@/components/admin/AdminButton"

interface Company {
    id: string
    name: string
    responsible_name: string
    email: string
    phone: string
    created_at: string
    plan_name: string
    status: 'active' | 'trial' | 'past_due' | 'canceled' | 'blocked'
    total_revenue: number
}

export default function CompaniesManagement() {
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [exportLoading, setExportLoading] = useState(false)

    useEffect(() => {
        fetchCompanies()
    }, [])

    async function fetchCompanies() {
        setLoading(true)
        try {
            const response = await fetch('/api/admin/companies')
            if (!response.ok) throw new Error('API Error')
            const data = await response.json()

            const formatted: Company[] = data.map((c: any) => ({
                id: c.id,
                name: c.name || 'Sem Empresa',
                responsible_name: c.profiles?.owner_name || 'Sem Nome',
                email: c.email || c.profiles?.email || 'N/A', 
                phone: c.telefone || c.phone || 'Sem Telefone',
                created_at: c.created_at,
                plan_name: c.plans?.name || 'Iniciante',
                status: (c.status || 'active') as any,
                total_revenue: c.total_revenue || 0
            }))

            setCompanies(formatted)
        } catch (error: any) {
            console.error("error fetching companies:", error)
            toast.error("Erro ao carregar empresas")
        } finally {
            setLoading(false)
        }
    }

    const handleExport = () => {
        setExportLoading(true)
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 2000)),
            {
                loading: 'Gerando arquivo CSV...',
                success: () => {
                    setExportLoading(false)
                    return 'Exportação concluída com sucesso!'
                },
                error: 'Erro na exportação'
            }
        )
    }

    const handleImpersonate = (companyId: string) => {
        toast.info(`Iniciando sessão como empresa ${companyId}...`, {
            description: "Isso abrirá uma nova aba com o painel do cliente.",
            duration: 3000,
        })
        // window.open(`/api/admin/impersonate/${companyId}`, '_blank')
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredCompanies.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredCompanies.map(c => c.id))
        }
    }

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id])
    }

    const filteredCompanies = companies.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.responsible_name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'active': return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            case 'trial': return "bg-amber-500/10 text-amber-400 border-amber-500/20"
            case 'blocked': return "bg-rose-500/10 text-rose-400 border-rose-500/20"
            default: return "bg-slate-500/10 text-slate-400 border-slate-500/20"
        }
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                        Partners <span className="text-amber-500">Hub</span>
                    </h2>
                    <p className="text-sm text-slate-500 mt-2">Gerenciamento estratégico de parceiros e faturamento B2B.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col text-right pr-4 border-r border-white/[0.05]">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest leading-none mb-1">Empresas na Base</p>
                        <p className="text-xl font-bold text-white">{companies.length}</p>
                    </div>
                    <AdminButton 
                        label="Exportar B2B"
                        loading={exportLoading}
                        icon={Download}
                        onClick={handleExport}
                        className="bg-amber-500 text-slate-950 h-11 px-6 rounded-xl hover:bg-amber-400 font-semibold"
                    />
                </div>
            </div>

            {/* Actions & Filters */}
            <AdminTableActions 
                selectedCount={selectedIds.length}
                onExport={handleExport}
                onBulkAction={(action) => toast.info(`Bulk Action: ${action} para ${selectedIds.length} itens`)}
            >
                <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Pesquisar empresas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900/30 border border-white/5 text-slate-300 text-sm rounded-2xl pl-14 pr-4 h-14 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all placeholder:text-slate-600 backdrop-blur-sm"
                    />
                </div>
            </AdminTableActions>

            {/* Table Area */}
            <div className="bg-card border border-white/5 rounded-[40px] overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="overflow-x-auto relative z-10 p-2">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-10 py-6 w-10">
                                    <Checkbox 
                                        checked={selectedIds.length === filteredCompanies.length && filteredCompanies.length > 0} 
                                        onCheckedChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Parceiro / Empresa</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Contato & Bio</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Receita Acumulada</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Controle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-10 py-8"><Skeleton className="h-5 w-5" /></td>
                                        <td className="px-6 py-8"><Skeleton className="h-12 w-48 rounded-xl" /></td>
                                        <td className="px-8 py-8"><Skeleton className="h-12 w-40 rounded-xl mx-auto" /></td>
                                        <td className="px-8 py-8"><Skeleton className="h-12 w-24 rounded-xl" /></td>
                                        <td className="px-8 py-8"><Skeleton className="h-12 w-20 rounded-xl" /></td>
                                        <td className="px-10 py-8 text-right"><Skeleton className="ml-auto h-12 w-12 rounded-xl" /></td>
                                    </tr>
                                ))
                            ) : filteredCompanies.length > 0 ? (
                                filteredCompanies.map((company) => (
                                    <tr key={company.id} className={cn(
                                        "hover:bg-white/[0.02] transition-all group",
                                        selectedIds.includes(company.id) && "bg-amber-500/5"
                                    )}>
                                        <td className="px-10 py-8">
                                            <Checkbox 
                                                checked={selectedIds.includes(company.id)} 
                                                onCheckedChange={() => toggleSelection(company.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="size-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 transition-all group-hover:bg-amber-500/20 group-hover:text-amber-400 shadow-inner group-hover:rotate-3">
                                                    <Building2 className="size-6" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground text-base mb-1 tracking-tight">{company.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{company.plan_name}</span>
                                                        <span className="size-1 bg-slate-700 rounded-full" />
                                                        <span className="text-[10px] text-slate-500">desde {format(new Date(company.created_at), "MMM yyyy", { locale: ptBR })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 text-center">
                                            <p className="text-sm text-slate-300 font-bold tracking-tight">{company.responsible_name}</p>
                                            <p className="text-[11px] text-slate-500 font-medium">{company.email}</p>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="flex flex-col">
                                                <span className="text-lg font-black text-foreground italic tracking-tighter">R$ {company.total_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                <div className="flex items-center gap-1 text-[9px] font-black text-emerald-400 mt-1 uppercase tracking-widest">
                                                    <TrendingUp className="size-3" />
                                                    Growth Sync
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <span className={cn(
                                                "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border transition-all",
                                                getStatusStyle(company.status)
                                            )}>
                                                {company.status}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="p-3 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all active:scale-90 focus:outline-none">
                                                        <MoreHorizontal className="size-6" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 bg-slate-950 border-white/10 text-slate-300 p-2 rounded-2xl shadow-2xl">
                                                    <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Ações Enterprise</DropdownMenuLabel>
                                                    <DropdownMenuSeparator className="bg-white/5" />
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/companies/${company.id}`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 hover:text-white transition-all focus:bg-white/5">
                                                            <Eye className="size-4 text-indigo-400" />
                                                            <span className="font-bold text-xs uppercase italic">Control Panel</span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleImpersonate(company.id)}
                                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 hover:text-white transition-all focus:bg-white/5"
                                                    >
                                                        <UserCircle className="size-4 text-emerald-400" />
                                                        <span className="font-bold text-xs uppercase italic">Acessar como Cliente</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-white/5" />
                                                    <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-rose-500/10 hover:text-rose-400 transition-all focus:bg-rose-500/10 font-bold text-xs uppercase italic">
                                                        <Ban className="size-4" />
                                                        Bloquear Conta
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-slate-500">
                                            <SearchX className="size-16 opacity-10" />
                                            <p className="font-black uppercase italic tracking-[0.2em]">Nenhuma empresa encontrada</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
