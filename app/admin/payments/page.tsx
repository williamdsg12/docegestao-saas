"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    DollarSign,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Smartphone,
    CreditCard,
    FileText,
    Download,
    Calendar,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Building2,
    SearchX,
    Clock
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
    const [isGatewayDialogOpen, setIsGatewayDialogOpen] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    const handleExportCSV = () => {
        setIsExporting(true)
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: 'Gerando arquivo CSV...',
                success: 'Relatório exportado com sucesso!',
                error: 'Erro ao exportar relatório',
                finally: () => setIsExporting(false)
            }
        )
    }

    const handleSaveGateway = (e: React.FormEvent) => {
        e.preventDefault()
        toast.success("Configurações do gateway salvas com sucesso!")
        setIsGatewayDialogOpen(false)
    }

    useEffect(() => {
        fetchPayments()
    }, [])

    async function fetchPayments() {
        setLoading(true)
        try {
            const response = await fetch('/api/admin/payments')
            if (!response.ok) throw new Error('API Error')
            const data = await response.json()

            if (!data || data.length === 0) {
                setPayments([])
                return
            }

            const formatted: Payment[] = data.map((p: any) => ({
                id: p.id,
                company_name: p.subscriptions?.companies?.name || p.subscriptions?.profiles?.business_name || 'Desconhecido',
                amount: p.amount || 0,
                date: p.created_at,
                method: (p.payment_method || 'pix').toLowerCase() as any,
                status: (p.status || 'paid').toLowerCase() as any,
                plan_name: p.subscriptions?.plans?.name || 'N/A'
            }))

            setPayments(formatted)
        } catch (error: any) {
            console.error("error fetching payments:", error)
            toast.error("Erro ao carregar banco financeiro")
        } finally {
            setLoading(false)
        }
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'paid': return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-sm"
            case 'pending': return "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-sm"
            case 'failed': return "bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-sm"
            case 'refunded': return "bg-slate-500/10 text-slate-500 border-slate-500/20 shadow-sm"
            default: return "bg-slate-50/10 text-slate-400 border-slate-100 shadow-sm"
        }
    }

    const filteredPayments = payments.filter(p => 
        p.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalRevenue = payments.filter(p => p.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0)
    const pendingRevenue = payments.filter(p => p.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0)

    return (
        <div className="space-y-12 pb-24">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] italic">Financial Intelligence</span>
                    </div>
                    <h2 className="text-6xl font-black text-slate-900 italic uppercase tracking-tighter leading-[0.8]">
                        Fluxo <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400">Financeiro</span>
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] italic">Revenue Ops // Conciliação Global</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <Button 
                        variant="outline" 
                        onClick={handleExportCSV}
                        disabled={isExporting}
                        className="h-14 px-8 rounded-[20px] border-slate-100 bg-white/40 backdrop-blur-md font-black uppercase italic text-[10px] tracking-widest gap-3 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                    >
                        <Download className={cn("size-5", isExporting && "animate-bounce")} /> 
                        {isExporting ? 'Exportando...' : 'Exportar Ledger'}
                    </Button>
                    
                    <Dialog open={isGatewayDialogOpen} onOpenChange={setIsGatewayDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-14 px-10 rounded-[22px] bg-slate-900 text-white font-black uppercase italic text-xs tracking-[0.1em] shadow-2xl shadow-slate-900/30 hover:scale-105 transition-all">
                                Protocolo de Gateway
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] border-white/60 bg-white/90 backdrop-blur-2xl p-10 rounded-[40px] shadow-2xl overflow-hidden">
                            <div className="absolute -top-20 -right-20 size-40 bg-indigo-500/10 rounded-full blur-3xl text-indigo-500" />
                            <DialogHeader className="mb-8">
                                <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">Gateway <span className="text-indigo-600 italic">Interface</span></DialogTitle>
                                <DialogDescription className="font-bold uppercase tracking-widest text-[10px] text-slate-400">
                                    Configurações de infraestrutura de pagamento
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSaveGateway} className="space-y-8 py-4">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Provedor Principal</Label>
                                    <Select defaultValue="stripe">
                                        <SelectTrigger className="h-14 rounded-2xl bg-slate-50/50 border-slate-100 font-black uppercase italic text-xs tracking-tighter">
                                            <SelectValue placeholder="Selecione o provedor" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                            <SelectItem value="stripe" className="font-bold">Stripe Architecture</SelectItem>
                                            <SelectItem value="mercadopago" className="font-bold">Mercado Pago Core</SelectItem>
                                            <SelectItem value="asaas" className="font-bold">Asaas Financial</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Environment Key (Public)</Label>
                                    <Input placeholder="pk_live_..." className="h-14 rounded-2xl bg-slate-50/50 border-slate-100 font-mono text-xs focus:ring-4 focus:ring-indigo-500/5 transition-all" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Secure Protocol (Secret)</Label>
                                    <Input type="password" placeholder="sk_live_..." className="h-14 rounded-2xl bg-slate-50/50 border-slate-100 font-mono text-xs focus:ring-4 focus:ring-indigo-500/5 transition-all" />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase italic tracking-widest shadow-xl shadow-slate-900/40 hover:scale-[1.02] transition-all">
                                        Atualizar Conexão ✨
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-emerald-600 rounded-[48px] p-10 text-white relative overflow-hidden shadow-2xl shadow-emerald-600/20 group"
                >
                    <div className="absolute -top-10 -right-10 size-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-all duration-1000" />
                    <div className="relative z-10">
                        <DollarSign className="size-10 mb-6 opacity-40 group-hover:rotate-12 transition-transform" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 opacity-60">Giro Bruto Acumulado</p>
                        <h3 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-4">
                            R$ {totalRevenue.toLocaleString('pt-BR')}
                        </h3>
                        <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest italic bg-white/20 px-4 py-2 rounded-full border border-white/10">
                            <ArrowUpRight className="size-3" /> Tendência Positiva Detectada
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-900 rounded-[48px] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20 group"
                >
                    <div className="absolute -top-10 -right-10 size-48 bg-emerald-500/20 rounded-full blur-3xl group-hover:scale-150 transition-all duration-1000" />
                    <div className="relative z-10">
                        <CreditCard className="size-10 mb-6 opacity-40 group-hover:-rotate-12 transition-transform shadow-lg" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 opacity-40">Ticket Médio Plataforma</p>
                        <h3 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-4 tracking-[-0.05em]">
                            R$ {(totalRevenue / (payments.length || 1)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </h3>
                        <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest italic bg-white/5 px-4 py-2 rounded-full border border-white/5">
                            Insights baseados em {payments.length} transações
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-[48px] p-10 text-slate-900 border border-slate-100 relative overflow-hidden shadow-2xl shadow-slate-200/50 group"
                >
                    <div className="absolute -top-10 -right-10 size-48 bg-rose-500/5 rounded-full blur-3xl group-hover:scale-150 transition-all duration-1000" />
                    <div className="relative z-10">
                        <AlertCircle className="size-10 mb-6 text-rose-500 opacity-60 group-hover:scale-110 transition-transform" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 text-slate-400">Aging Pendente</p>
                        <h3 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-4 text-rose-600">
                            R$ {pendingRevenue.toLocaleString('pt-BR')}
                        </h3>
                        <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest italic bg-rose-50 text-rose-500 px-4 py-2 rounded-full border border-rose-100">
                            Foco em Recuperação de Carrinho
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Transaction Ledger Table */}
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-[56px] border border-white/40 shadow-2xl overflow-hidden bg-white/60 backdrop-blur-md"
            >
                <div className="p-10 border-b border-slate-100/50 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-slate-50/30">
                    <div className="space-y-1">
                        <h4 className="text-xl font-black text-slate-900 italic uppercase italic tracking-tighter leading-tight">Ledger de Transações</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Registros de conciliação do ecossistema</p>
                    </div>
                    <div className="relative group max-w-sm w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="SEARCH REFERENCE..."
                            className="w-full h-14 pl-14 pr-6 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-500/5 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/20">
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Beneficiary Entity</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Value Transfer</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Timing Log</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Methodology</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center">Settlement Status</th>
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
                                ) : filteredPayments.length > 0 ? (
                                    filteredPayments.map((p) => (
                                        <motion.tr
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            key={p.id}
                                            className="hover:bg-emerald-50/20 transition-all group"
                                        >
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="size-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-xl group-hover:shadow-emerald-600/20 group-hover:scale-110 transition-all duration-500 relative overflow-hidden">
                                                        <Building2 className="size-7 relative z-10" />
                                                        <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-emerald-500/10" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-900 italic uppercase tracking-tighter text-lg">{p.company_name}</span>
                                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1 italic border-l-2 border-emerald-500 pl-2 leading-none">{p.plan_name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900 italic uppercase tracking-tighter text-2xl leading-none">R$ {p.amount.toLocaleString('pt-BR')}</span>
                                                    <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1 italic opacity-60">Gross Settlement</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-xs font-bold text-slate-600">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-black uppercase italic tracking-tighter">{new Date(p.date).toLocaleDateString()}</span>
                                                    <span className="text-[10px] text-slate-400 font-black transition-colors group-hover:text-emerald-500 uppercase tracking-widest italic">{new Date(p.date).toLocaleTimeString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-3 text-slate-900 font-black uppercase italic text-xs tracking-widest bg-slate-50 w-fit px-4 py-2 rounded-2xl border border-slate-100 group-hover:border-emerald-200 group-hover:bg-white transition-all">
                                                    <div className="size-6 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                        {(p.method || 'pix') === 'pix' ? <Smartphone className="size-3 text-emerald-500" /> : <CreditCard className="size-3 text-indigo-500" />}
                                                    </div>
                                                    <span className="text-[10px]">{p.method || 'TRANSFER'}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <div className={cn(
                                                    "inline-flex items-center gap-3 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.25em] italic border transition-all duration-700 shadow-xl",
                                                    getStatusStyle(p.status)
                                                )}>
                                                    {p.status === 'paid' && <CheckCircle2 className="size-4 animate-bounce" />}
                                                    {p.status === 'pending' && <Clock className="size-4 animate-pulse" />}
                                                    {p.status === 'failed' && <XCircle className="size-4 animate-shake" />}
                                                    {p.status === 'paid' ? 'Settled' : p.status === 'pending' ? 'Auth Required' : 'Critical Failure'}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-40 text-center">
                                            <div className="flex flex-col items-center gap-8">
                                                <div className="size-32 rounded-[48px] bg-white border border-slate-100 flex items-center justify-center text-slate-100 shadow-2xl shadow-emerald-500/5 animate-pulse">
                                                    <SearchX className="size-16" />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-slate-900 font-black uppercase tracking-[0.2em] text-sm italic">Nenhuma transação conciliada</p>
                                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">O ledger financeiro está aguardando novos registros de transferência</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Ledger Footer */}
                <div className="px-10 py-10 border-t border-slate-100/50 flex flex-col sm:flex-row items-center justify-between bg-white text-[10px] font-black uppercase tracking-widest italic text-slate-400 gap-8">
                    <div className="flex items-center gap-4">
                        <div className="size-3 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                        Platform Integrity Validated by Global Treasury Audit
                    </div>
                    <div className="flex items-center gap-6">
                        <span className="text-slate-900 border-b-2 border-emerald-500 pb-1 cursor-pointer hover:text-emerald-500 transition-colors">Download Annual Ledger</span>
                        <span className="cursor-not-allowed opacity-30">Security Protocol V4.2</span>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
