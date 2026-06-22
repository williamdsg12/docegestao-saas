"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    DollarSign,
    Search,
    CreditCard,
    Download,
    Calendar,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Clock,
    TrendingUp,
    MoreHorizontal,
    ArrowRightLeft,
    History,
    Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
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

interface Payment {
    id: string
    company_name: string
    amount: number
    date: string
    method: 'pix' | 'card' | 'boleto'
    status: 'paid' | 'pending' | 'failed' | 'refunded'
    plan_name: string
}

export default function PaymentsManagement() {
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [exportLoading, setExportLoading] = useState(false)

    useEffect(() => {
        fetchPayments()
    }, [])

    async function fetchPayments() {
        setLoading(true)
        try {
            const response = await fetch('/api/admin/payments')
            if (!response.ok) throw new Error('API Error')
            const data = await response.json()

            const formatted: Payment[] = data.map((p: any) => ({
                id: p.id,
                company_name: p.pedidos?.empresas?.name || 'Venda Avulsa',
                amount: p.amount || 0,
                date: p.created_at,
                method: (p.payment_method || 'pix').toLowerCase() as any,
                status: (p.status || 'paid').toLowerCase() as any,
                plan_name: p.pedidos?.nome_pedido || 'N/A'
            }))

            setPayments(formatted)
        } catch (error: any) {
            console.error("error fetching payments:", error)
            toast.error("Erro ao carregar pagamentos")
        } finally {
            setLoading(false)
        }
    }

    const handleExport = () => {
        setExportLoading(true)
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 1500)),
            {
                loading: 'Exportando fluxo financeiro...',
                success: () => {
                    setExportLoading(false)
                    return 'CSV financeiro gerado!'
                },
                error: 'Erro na exportação'
            }
        )
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredPayments.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredPayments.map(p => p.id))
        }
    }

    const filteredPayments = payments.filter(p => 
        p.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleConfirmLiquidation = async (paymentId: string) => {
        try {
            const res = await fetch('/api/admin/payments', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId, status: 'paid' })
            })
            if (!res.ok) throw new Error('API Error')
            toast.success("Pagamento confirmado com sucesso!")
            fetchPayments()
        } catch (error) {
            toast.error("Erro ao confirmar pagamento")
        }
    }

    const totalPaid = payments.filter(p => p.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0)
    const totalPending = payments.filter(p => p.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0)
    const mrrEstimated = totalPaid * 0.85

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                        Nexus <span className="text-emerald-500">Finance</span>
                    </h2>
                    <p className="text-sm text-slate-500 mt-2">Gestão de faturamento, conciliação e fluxos de receita SaaS.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col text-right pr-4 border-r border-white/[0.05]">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest leading-none mb-1">Liquidado Hoje</p>
                        <p className="text-xl font-bold text-white">R$ {totalPaid.toLocaleString('pt-BR')}</p>
                    </div>
                    <AdminButton 
                        label="Exportar CSV"
                        loading={exportLoading}
                        icon={Download}
                        onClick={handleExport}
                        className="bg-emerald-500 text-slate-950 h-11 px-6 rounded-xl hover:bg-emerald-400 font-semibold"
                    />
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Faturamento Total', value: `R$ ${totalPaid.toLocaleString('pt-BR')}`, icon: DollarSign, color: 'text-emerald-500' },
                    { label: 'MRR Estimado', value: `R$ ${mrrEstimated.toLocaleString('pt-BR')}`, icon: TrendingUp, color: 'text-indigo-500' },
                    { label: 'Pendentes (Aging)', value: `R$ ${totalPending.toLocaleString('pt-BR')}`, icon: Clock, color: 'text-amber-500' },
                    { label: 'Inadimplência', value: '2.4%', icon: AlertCircle, color: 'text-rose-500' }
                ].map((m, i) => (
                    <div key={i} className="bg-[#09090b] border border-white/[0.05] p-6 rounded-xl shadow-sm hover:border-white/10 transition-colors">
                        <div className={cn("size-8 rounded-lg flex items-center justify-center bg-white/[0.03] border border-white/[0.05] mb-4", m.color)}>
                            <m.icon className="size-4" />
                        </div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">{m.label}</p>
                        <h3 className="text-xl font-bold text-white tracking-tight">{m.value}</h3>
                    </div>
                ))}
            </div>

            {/* Actions Bar */}
            <AdminTableActions 
                selectedCount={selectedIds.length}
                onExport={handleExport}
                onBulkAction={(a) => toast.info(`Bulk: ${a}`)}
            >
                <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar transação..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900/30 border border-white/5 text-slate-300 text-sm rounded-2xl pl-14 pr-4 h-14 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all placeholder:text-slate-600 backdrop-blur-sm"
                    />
                </div>
            </AdminTableActions>

            {/* Table Area */}
            <div className="bg-card border border-white/5 rounded-[40px] overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="overflow-x-auto relative z-10 p-2">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-10 py-6 w-10">
                                    <Checkbox 
                                        checked={selectedIds.length === filteredPayments.length && filteredPayments.length > 0} 
                                        onCheckedChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Transação / Origem</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Valor Bruto</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Método</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Status</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-10 py-8"><Skeleton className="h-5 w-5" /></td>
                                        <td className="px-6 py-8"><Skeleton className="h-12 w-48 rounded-xl" /></td>
                                        <td className="px-8 py-8"><Skeleton className="h-12 w-24 rounded-xl" /></td>
                                        <td className="px-8 py-8"><Skeleton className="h-12 w-20 rounded-xl" /></td>
                                        <td className="px-8 py-8"><Skeleton className="h-12 w-24 rounded-xl mx-auto" /></td>
                                        <td className="px-10 py-8 text-right"><Skeleton className="ml-auto h-12 w-12 rounded-xl" /></td>
                                    </tr>
                                ))
                            ) : (
                                filteredPayments.map((p) => (
                                    <tr key={p.id} className={cn(
                                        "hover:bg-white/[0.02] transition-colors group",
                                        selectedIds.includes(p.id) && "bg-emerald-500/5"
                                    )}>
                                        <td className="px-10 py-8">
                                            <Checkbox 
                                                checked={selectedIds.includes(p.id)} 
                                                onCheckedChange={() => setSelectedIds(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                                            />
                                        </td>
                                        <td className="px-6 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="size-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-emerald-400 group-hover:bg-emerald-400/10 transition-all shadow-inner">
                                                    <ArrowRightLeft className="size-6" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground text-base mb-1 tracking-tight">{p.company_name}</p>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">REF: {p.id.split('-')[0]}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <p className="font-black text-xl text-foreground italic tracking-tighter">R$ {p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{format(new Date(p.date), "dd/MM/yyyy HH:mm")}</p>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="flex items-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                                                {p.method === 'pix' && <Zap className="size-4 text-emerald-500" />}
                                                {p.method === 'card' && <CreditCard className="size-4 text-indigo-400" />}
                                                {p.method}
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 text-center">
                                            <span className={cn(
                                                "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border inline-flex items-center gap-2",
                                                p.status === 'paid' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                            )}>
                                                {p.status === 'paid' ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                             <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="p-3 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all focus:outline-none">
                                                        <MoreHorizontal className="size-6" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 bg-slate-950 border-white/10 text-slate-300 p-2 rounded-2xl shadow-2xl">
                                                    <DropdownMenuItem 
                                                        disabled={p.status === 'paid'}
                                                        onClick={() => handleConfirmLiquidation(p.id)}
                                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 hover:text-white transition-all disabled:opacity-50"
                                                    >
                                                        <CheckCircle2 className="size-4 text-emerald-400" />
                                                        <span className="font-bold text-xs uppercase italic">Confirmar Liquidação</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 hover:text-white transition-all">
                                                        <History className="size-4 text-indigo-400" />
                                                        <span className="font-bold text-xs uppercase italic">Ver Histórico</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
