"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Plus,
    TrendingUp,
    TrendingDown,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Filter,
    Download,
    Wallet,
    PieChart,
    Activity,
    ArrowRight,
    Copy,
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as PieChartComponent, Pie, Cell } from "recharts"

const data = [
    { name: "Jan", receita: 4000, custos: 2400 },
    { name: "Fev", receita: 3000, custos: 1398 },
    { name: "Mar", receita: 7000, custos: 4800 },
]

interface Transaction {
    id: string
    description: string
    amount: number
    transaction_date: string
    type: "entrada" | "saida"
    category: string
}

// Removendo mock

export default function FinanceiroPage() {
    const { user } = useAuth()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [monthFilter, setMonthFilter] = useState("")

    useEffect(() => {
        if (user) {
            fetchData()
        }
    }, [user])

    const filteredTransactions = transactions.filter(t => {
        if (!monthFilter) return true
        return t.transaction_date.startsWith(monthFilter)
    })

    const rec = filteredTransactions.filter((t: any) => t.type === 'entrada').reduce((acc: number, t: any) => acc + t.amount, 0) || 0
    const cus = filteredTransactions.filter((t: any) => t.type === 'saida').reduce((acc: number, t: any) => acc + t.amount, 0) || 0

    const totals = {
        receita: rec,
        custos: cus,
        saldo: rec - cus
    }

    async function fetchData() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .order('transaction_date', { ascending: false })

            if (error) throw error
            if (error) throw error
            setTransactions(data || [])
        } catch (error: any) {
            console.error("Error fetching finance data:", error.message || error)
            toast.error("Erro ao carregar dados financeiros")
        } finally {
            setLoading(false)
        }
    }

    const stats = [
        { label: "Saldo Atual", value: `R$ ${totals.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: Wallet, color: "text-primary", bg: "bg-rose-50", trend: "+0%" },
        { label: "Receita (Total)", value: `R$ ${totals.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", trend: "+0%" },
        { label: "Custos (CMV)", value: `R$ ${totals.custos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingDown, color: "text-red-600", bg: "bg-red-50", trend: "-0%" },
        { label: "Lucro Líquido", value: `R$ ${(totals.receita - totals.custos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: Activity, color: "text-blue-600", bg: "bg-blue-50", trend: "+0%" },
    ]

    const chartData = transactions.reduce((acc: any[], curr) => {
        const date = new Date(curr.transaction_date)
        const month = date.toLocaleString('default', { month: 'short' })
        let existing = acc.find(a => a.name === month)
        if (!existing) {
            existing = { name: month, receita: 0, custos: 0 }
            acc.push(existing)
        }
        if (curr.type === 'entrada') existing.receita += curr.amount
        else existing.custos += curr.amount
        return acc
    }, []).reverse()

    const [newTxOpen, setNewTxOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [txForm, setTxForm] = useState({
        description: "",
        amount: "",
        type: "saida" as "entrada" | "saida",
        category: "Geral",
        transaction_date: new Date().toISOString().split('T')[0]
    })

    async function handleSaveTransaction() {
        if (!txForm.description || !txForm.amount) {
            toast.error("Preencha os campos obrigatórios")
            return
        }

        setIsSaving(true)
        try {
            const { data, error } = await supabase
                .from('transactions')
                .insert({
                    user_id: user?.id,
                    description: txForm.description,
                    amount: parseFloat(txForm.amount),
                    type: txForm.type,
                    category: txForm.category,
                    transaction_date: txForm.transaction_date
                })
                .select()
                .single()

            if (error) throw error

            setTransactions(prev => [data, ...prev].sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()))

            setNewTxOpen(false)
            setTxForm({
                description: "",
                amount: "",
                type: "saida",
                category: "Geral",
                transaction_date: new Date().toISOString().split('T')[0]
            })
            toast.success("Transação salva!")
        } catch (error: any) {
            console.error("Error saving transaction:", error.message || error)
            toast.error("Erro ao salvar transação")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-12 pb-24">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
            >
                <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-2 uppercase italic leading-none">
                        Gestão <span className="text-primary tracking-tighter">Financeira</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Controle cada centavo da sua produção e maximize seus lucros.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <Button variant="outline" className="h-14 px-8 rounded-3xl border-white bg-white/40 backdrop-blur-md text-slate-600 hover:text-primary font-black uppercase tracking-widest text-[10px] shadow-lg border transition-all">
                        <Download className="mr-2 size-4" />
                        Relatórios (PDF)
                    </Button>
                    <Input 
                        type="month"
                        className="h-14 w-40 rounded-3xl border-white/60 bg-white/40 backdrop-blur-md text-slate-900 font-bold px-5 shadow-lg"
                        value={monthFilter}
                        onChange={e => setMonthFilter(e.target.value)}
                    />

                    <Dialog open={newTxOpen} onOpenChange={setNewTxOpen}>
                        <DialogTrigger asChild>
                            <div className="flex gap-2">
                                <Button 
                                    onClick={() => setTxForm(prev => ({ ...prev, type: "entrada" }))}
                                    className="h-14 px-8 rounded-[20px] bg-green-500 hover:bg-green-600 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-green-500/30 transition-all hover:scale-105 active:scale-95"
                                >
                                    <TrendingUp className="mr-2 size-4" />
                                    Nova Entrada
                                </Button>
                                <Button 
                                    onClick={() => setTxForm(prev => ({ ...prev, type: "saida" }))}
                                    className="h-14 px-8 rounded-[20px] bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-rose-500/30 transition-all hover:scale-105 active:scale-95"
                                >
                                    <TrendingDown className="mr-2 size-4" />
                                    Nova Despesa
                                </Button>
                            </div>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl border-white/60 bg-white/90 backdrop-blur-2xl p-10 rounded-[40px] shadow-2xl overflow-hidden text-slate-900">
                            <div className="absolute -top-24 -right-24 size-48 bg-primary/10 rounded-full blur-3xl" />
                            <DialogHeader className="mb-8 relative z-10">
                                <DialogTitle className="text-3xl font-black tracking-tighter uppercase italic">
                                    Novo <span className="text-primary italic">Lançamento</span>
                                </DialogTitle>
                                <p className="text-slate-500 text-sm font-medium">Registre entradas ou saídas de caixa com precisão.</p>
                            </DialogHeader>

                            <div className="grid gap-8 relative z-10">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Descrição</Label>
                                    <Input
                                        placeholder="Ex: Compra de insumos, Venda de bolo..."
                                        className="h-14 border-rose-100 bg-rose-50/30 rounded-2xl px-5 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all font-primary text-slate-900"
                                        value={txForm.description}
                                        onChange={e => setTxForm({ ...txForm, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Valor</Label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                                            <Input
                                                type="number"
                                                className="h-14 border-rose-100 bg-rose-50/30 rounded-2xl pl-12 focus:ring-primary/10 font-bold text-slate-900"
                                                value={txForm.amount}
                                                onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo</Label>
                                        <select
                                            className="w-full h-14 border-rose-100 bg-rose-50/30 rounded-2xl px-5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer text-slate-900"
                                            value={txForm.type}
                                            onChange={e => setTxForm({ ...txForm, type: e.target.value as any })}
                                        >
                                            <option value="saida">Saída (Despesa)</option>
                                            <option value="entrada">Entrada (Receita)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Categoria</Label>
                                        <Input
                                            placeholder="Ex: Ingredientes"
                                            className="h-14 border-rose-100 bg-rose-50/30 rounded-2xl px-5 focus:ring-primary/10 font-bold text-slate-900 font-primary"
                                            value={txForm.category}
                                            onChange={e => setTxForm({ ...txForm, category: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Data</Label>
                                        <Input
                                            type="date"
                                            className="h-14 border-rose-100 bg-rose-50/30 rounded-2xl px-5 focus:ring-primary/10 font-bold text-slate-900"
                                            value={txForm.transaction_date}
                                            onChange={e => setTxForm({ ...txForm, transaction_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <Button
                                    className="h-14 mt-4 rounded-2xl bg-gradient-to-r from-primary to-rose-500 hover:from-primary/90 hover:to-rose-600 font-black text-lg shadow-xl shadow-primary/20 text-white uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95"
                                    onClick={handleSaveTransaction}
                                    disabled={isSaving}
                                >
                                    {isSaving ? "PROCESSANDO..." : "CONFIRMAR LANÇAMENTO ✨"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </motion.div>

            {/* Financial Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                    >
                        <div className="group relative h-full overflow-hidden rounded-[32px] border border-white/60 bg-white/40 backdrop-blur-xl p-8 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2">
                            <div className="absolute -top-12 -right-12 size-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div className={cn("flex size-14 items-center justify-center rounded-2xl text-white shadow-xl transform group-hover:rotate-6 transition-transform duration-500", stat.bg.replace('bg-', 'bg-').replace('50', '400'))}>
                                    <stat.icon className="size-7" />
                                </div>
                                <Badge className="bg-white/50 text-[10px] font-black border-none px-3 py-1 text-slate-500 uppercase">{stat.trend}</Badge>
                            </div>

                            <div className="relative z-10">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-10 lg:grid-cols-3">
                {/* Main Cash Flow Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 rounded-[40px] border border-white/50 bg-white/30 backdrop-blur-xl p-10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] relative overflow-hidden"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                                Histórico de <span className="text-primary underline decoration-primary/20 underline-offset-8">Caixa</span>
                            </h3>
                            <p className="text-sm text-slate-500 mt-2 font-medium">Comparativo mensal de faturamento versus custos.</p>
                        </div>
                        <div className="flex items-center gap-6 bg-white/50 p-2 rounded-2xl border border-rose-50 shadow-sm">
                            <div className="flex items-center gap-2 px-3 text-[10px] font-black uppercase text-primary">
                                <div className="size-2 rounded-full bg-primary" />
                                Receita
                            </div>
                            <div className="flex items-center gap-2 px-3 text-[10px] font-black uppercase text-rose-300">
                                <div className="size-2 rounded-full bg-rose-300" />
                                Custos
                            </div>
                        </div>
                    </div>

                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData.length > 0 ? chartData : [{ name: 'S/ dados', receita: 0, custos: 0 }]}>
                                <defs>
                                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F472B6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#F472B6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorCus" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FBCFE8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#FBCFE8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="6 6" stroke="#F5E6D3" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 800 }}
                                    dy={15}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 800 }}
                                    dx={-10}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#F472B6', strokeWidth: 2 }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const d = payload[0].payload;
                                            return (
                                                <div className="bg-white/80 backdrop-blur-xl border border-rose-100 p-6 rounded-[24px] shadow-2xl">
                                                    <p className="text-xs font-black text-primary uppercase tracking-widest mb-3 border-b border-rose-50 pb-2">{d.name}</p>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between gap-12 items-center">
                                                            <span className="text-xs font-bold text-slate-500 uppercase">Receita:</span>
                                                            <span className="text-base font-black text-slate-900 italic">R$ {d.receita.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between gap-12 items-center">
                                                            <span className="text-xs font-bold text-slate-400 uppercase">Custos:</span>
                                                            <span className="text-sm font-black text-slate-400">R$ {d.custos.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area type="monotone" dataKey="receita" stroke="#F472B6" strokeWidth={5} fillOpacity={1} fill="url(#colorRec)" activeDot={{ r: 8, fill: '#F472B6', stroke: '#fff', strokeWidth: 4 }} />
                                <Area type="monotone" dataKey="custos" stroke="#FBCFE8" strokeWidth={3} fillOpacity={1} fill="url(#colorCus)" strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Categories & Transactions Column */}
                <div className="space-y-10">
                    <div className="rounded-[40px] border border-white/50 bg-white/40 backdrop-blur-xl p-8 flex flex-col gap-8 shadow-lg shadow-rose-200/5">
                        <h3 className="text-xl font-black italic text-slate-900 uppercase flex items-center gap-2 leading-none">
                            <PieChart className="size-5 text-primary" />
                            Distribuição <span className="text-primary tracking-tighter">Despesas</span>
                        </h3>
                        <div className="relative h-[220px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChartComponent>
                                    <Pie
                                        data={[
                                            { name: 'Insumos', value: 65, color: '#F472B6' },
                                            { name: 'Freelancers', value: 20, color: '#FBCFE8' },
                                            { name: 'Outros', value: 15, color: '#F5E6D3' },
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={85}
                                        paddingAngle={10}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {[
                                            { color: '#F472B6' },
                                            { color: '#FBCFE8' },
                                            { color: '#F5E6D3' },
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChartComponent>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-black text-slate-800 tracking-tight">100%</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {[
                                { name: 'Insumos / Produção', value: '65%', color: 'bg-[#F472B6]' },
                                { name: 'Freelancers / Entregas', value: '20%', color: 'bg-[#FBCFE8]' },
                                { name: 'Manutenção / Outros', value: '15%', color: 'bg-[#F5E6D3]' },
                            ].map((cat) => (
                                <div key={cat.name} className="flex items-center justify-between p-3 rounded-2xl bg-white/50 border border-white/40 shadow-sm transition-all hover:translate-x-1">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("size-3 rounded-full shadow-sm", cat.color)} />
                                        <span className="text-[10px] font-black uppercase text-slate-600 tracking-tighter">{cat.name}</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-900">{cat.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 rounded-[40px] border border-white/50 bg-white/40 backdrop-blur-xl p-10 flex flex-col gap-10 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 size-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px]" />

                    <div className="flex items-center justify-between relative z-10">
                        <h3 className="text-2xl font-black italic text-slate-900 uppercase">Fluxo de <span className="text-primary italic">Lançamentos</span></h3>
                        <div className="flex bg-white/50 p-1.5 rounded-2xl border border-rose-50 shadow-sm">
                            <Button variant="ghost" className="h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary bg-white shadow-sm transition-all">Recente</Button>
                            <Button variant="ghost" className="h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400">Ver Todas</Button>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 relative z-10">
                        {filteredTransactions.slice(0, 6).map((tx, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={tx.id}
                                className="group flex items-center justify-between p-5 rounded-3xl bg-white/50 border border-white hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-5">
                                    <div className={cn(
                                        "flex size-14 items-center justify-center rounded-[20px] transform group-hover:rotate-6 transition-transform duration-500 shadow-lg",
                                        tx.type === "entrada" ? "bg-green-500 text-white" : "bg-rose-500 text-white"
                                    )}>
                                        {tx.type === "entrada" ? <ArrowUpRight className="size-7" /> : <ArrowDownRight className="size-7" />}
                                    </div>
                                    <div>
                                        <h4 className="text-base font-black text-slate-900 leading-none mb-2 uppercase italic transition-colors group-hover:text-primary">{tx.description}</h4>
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-tighter border-none px-2 py-0.5">{tx.category}</Badge>
                                            <span className="text-[10px] text-slate-300 font-bold">•</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(tx.transaction_date).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right pl-4">
                                    <p className={cn("text-xl font-black tracking-tighter", tx.type === "entrada" ? "text-green-600" : "text-rose-600")}>
                                        {tx.type === "entrada" ? "+" : "-"} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
