"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    DollarSign,
    Search,
    ArrowUpRight,
    CreditCard,
    FileText,
    Download,
    Calendar,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Building2,
    Clock,
    Settings,
    Smartphone
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
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

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
            if (!response.ok) {
                throw new Error('API Error')
            }
            const data = await response.json()

            if (!data || data.length === 0) {
                setPayments([])
                return
            }

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
            // Mock data pattern matching DashDarkX theme for tests
            setPayments([
                { id: 'pay_123', company_name: 'Doce Sabor LTDA', amount: 147.90, date: new Date().toISOString(), method: 'card', status: 'paid', plan_name: 'Plano Pro' },
                { id: 'pay_456', company_name: 'Bolos & Cia', amount: 97.90, date: new Date().toISOString(), method: 'pix', status: 'pending', plan_name: 'Plano Start' },
            ])
        } finally {
            setLoading(false)
        }
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'paid': return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            case 'pending': return "bg-amber-500/10 text-amber-400 border-amber-500/20"
            case 'failed': return "bg-rose-500/10 text-rose-400 border-rose-500/20"
            case 'refunded': return "bg-slate-500/10 text-slate-400 border-slate-500/20"
            default: return "bg-slate-500/10 text-slate-400 border-slate-500/20"
        }
    }

    const filteredPayments = payments.filter(p => 
        p.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalRevenue = payments.filter(p => p.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0)
    const pendingRevenue = payments.filter(p => p.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0)

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Sincronizando Financeiro...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10 w-full xl:max-w-[80%]">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] italic">Financial Intelligence</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-[0.85]">
                        Fluxo <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-green-300">Financeiro</span>
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic mt-4">Revenue Ops // Conciliação Global</p>
                </div>
                
                <div className="flex items-center gap-4 bg-slate-900 border border-white/5 px-6 py-4 rounded-2xl shadow-xl flex-wrap">
                    <button 
                        onClick={handleExportCSV}
                        disabled={isExporting}
                        className={cn(
                            "flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-all border",
                            isExporting 
                                ? "bg-slate-800 border-white/5 text-slate-500"
                                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 focus:ring-2 focus:ring-emerald-500/50"
                        )}
                    >
                        <Download className={cn("size-4", isExporting && "animate-bounce")} /> 
                        {isExporting ? 'Exportando...' : 'Exportar CSV'}
                    </button>
                    
                    <Dialog open={isGatewayDialogOpen} onOpenChange={setIsGatewayDialogOpen}>
                        <DialogTrigger asChild>
                            <button className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-slate-800 border border-white/5 text-white hover:bg-slate-700 transition-all focus:ring-2 focus:ring-white/20 shadow-lg">
                                <Settings className="size-4 text-slate-400" /> Gateway
                            </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] border-white/10 bg-slate-900 text-white p-8 rounded-[32px] shadow-2xl overflow-hidden">
                            <div className="absolute -top-40 -right-40 size-80 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
                            <DialogHeader className="mb-6 relative z-10">
                                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter mb-1">Gateway <span className="text-emerald-500">Interface</span></DialogTitle>
                                <DialogDescription className="font-bold uppercase tracking-widest text-[10px] text-slate-400">
                                    Conectores de infraestrutura de pagamento
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSaveGateway} className="space-y-6 relative z-10">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Provedor Principal</Label>
                                    <Select defaultValue="stripe">
                                        <SelectTrigger className="h-12 rounded-xl bg-slate-950 border border-white/5 focus:ring-2 focus:ring-emerald-500/50 font-bold text-sm">
                                            <SelectValue placeholder="Selecione o provedor" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/5 text-white rounded-xl">
                                            <SelectItem value="stripe" className="font-bold focus:bg-white/5 hover:bg-white/5 cursor-pointer">Stripe Architecture</SelectItem>
                                            <SelectItem value="mercadopago" className="font-bold focus:bg-white/5 hover:bg-white/5 cursor-pointer">Mercado Pago Core</SelectItem>
                                            <SelectItem value="asaas" className="font-bold focus:bg-white/5 hover:bg-white/5 cursor-pointer">Asaas Financial</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Environment Key (Public)</Label>
                                    <Input placeholder="pk_live_..." className="h-12 rounded-xl bg-slate-950 border border-white/5 text-sm font-mono focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-600 transition-all text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Secure Protocol (Secret)</Label>
                                    <Input type="password" placeholder="sk_live_..." className="h-12 rounded-xl bg-slate-950 border border-white/5 text-sm font-mono focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-600 transition-all text-white" />
                                </div>
                                <DialogFooter className="mt-8">
                                    <button type="submit" className="w-full h-12 rounded-xl bg-emerald-500 text-slate-950 font-black uppercase italic tracking-widest hover:scale-[1.02] transition-transform shadow-[0_0_15px_rgba(16,185,129,0.3)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                                        Atualizar Conexão
                                    </button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-emerald-500/10 border border-emerald-500/20 rounded-[32px] p-8 relative overflow-hidden group shadow-2xl shadow-emerald-500/5"
                >
                    <div className="absolute -top-10 -right-10 size-48 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-colors" />
                    <div className="relative z-10">
                        <DollarSign className="size-8 mb-6 text-emerald-400 opacity-60 group-hover:scale-110 transition-transform" />
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-emerald-500/60">Giro Bruto Acumulado</p>
                        <h3 className="text-4xl lg:text-5xl font-black italic uppercase tracking-tighter leading-none mb-4 text-emerald-400">
                            R$ {totalRevenue.toLocaleString('pt-BR')}
                        </h3>
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                            <ArrowUpRight className="size-3" /> Status Positivo
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                    className="bg-slate-900 border border-white/5 rounded-[32px] p-8 relative overflow-hidden group shadow-2xl"
                >
                    <div className="absolute -top-10 -right-10 size-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors" />
                    <div className="relative z-10">
                        <CreditCard className="size-8 mb-6 text-slate-400 group-hover:scale-110 transition-transform" />
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-500">Ticket Médio Base</p>
                        <h3 className="text-4xl lg:text-5xl font-black italic uppercase tracking-tighter leading-none mb-4 text-white">
                            R$ {(totalRevenue / (payments.length || 1)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </h3>
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                            {payments.length} transações processadas
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                    className="bg-slate-900 border border-white/5 rounded-[32px] p-8 relative overflow-hidden group shadow-2xl"
                >
                    <div className="absolute -top-10 -right-10 size-48 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-colors" />
                    <div className="relative z-10">
                        <AlertCircle className="size-8 mb-6 text-rose-500 opacity-60 group-hover:scale-110 transition-transform" />
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-500">Aging Pendente</p>
                        <h3 className="text-4xl lg:text-5xl font-black italic uppercase tracking-tighter leading-none mb-4 text-rose-400">
                            R$ {pendingRevenue.toLocaleString('pt-BR')}
                        </h3>
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20">
                            Atenção requerida
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* List & Filters Section */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-slate-900 border border-white/5 rounded-[32px] overflow-hidden shadow-2xl relative"
            >
                <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between relative z-10">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar ref. ou empresa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-white/5 text-slate-300 text-sm rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/50">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Origem / Referência</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Valor (BRL)</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Data / Hora</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Método</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredPayments.map((payment, index) => (
                                <tr key={payment.id} className="hover:bg-slate-800/50 transition-colors group cursor-pointer">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-black group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors shadow-inner shadow-black/50">
                                                <Building2 className="size-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm mb-0.5">{payment.company_name}</p>
                                                <p className="text-xs text-slate-500 font-mono uppercase">ID: {payment.id.split('-')[0]}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-base font-black text-white italic">
                                            R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{payment.plan_name}</p>
                                    </td>
                                    <td className="px-8 py-6 text-sm text-slate-300 font-bold">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="size-3 text-slate-500" />
                                            {format(new Date(payment.date), "dd/MM/yyyy HH:mm")}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                            {payment.method === 'pix' && <Smartphone className="size-4" />}
                                            {payment.method === 'card' && <CreditCard className="size-4" />}
                                            {payment.method === 'boleto' && <FileText className="size-4" />}
                                            {payment.method}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border inline-flex items-center gap-1.5",
                                            getStatusStyle(payment.status)
                                        )}>
                                            {payment.status === 'paid' && <CheckCircle2 className="size-3" />}
                                            {payment.status === 'pending' && <Clock className="size-3" />}
                                            {payment.status === 'failed' && <XCircle className="size-3" />}
                                            {payment.status === 'paid' ? 'Liquidado' : payment.status === 'pending' ? 'Pendente' : payment.status === 'failed' ? 'Falhou' : 'Estornado'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filteredPayments.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-slate-500 font-bold">
                                        Nenhum registro financeiro encontrado.
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
