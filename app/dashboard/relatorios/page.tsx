"use client"

import { useState, useMemo, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import {
    BarChart3,
    TrendingUp,
    Users,
    ShoppingBag,
    DollarSign,
    Download,
    PieChart,
    ArrowUpRight,
    Search,
    Cake,
    Heart,
    Star,
    ChevronRight,
    Target
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"

export default function RelatoriosPage() {
    const { profile } = useBusiness()
    const [dateRange, setDateRange] = useState("30")
    const [isExporting, setIsExporting] = useState(false)
    const [stats, setStats] = useState({
        faturamento: 0,
        pedidos: 0,
        clientes: 0,
        ticketMedio: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (profile?.company_id) {
            fetchStats()
        }
    }, [profile, dateRange])

    async function fetchStats() {
        setLoading(true)
        try {
            const days = parseInt(dateRange)
            const startDate = new Date()
            startDate.setDate(startDate.getDate() - days)

            const [ordersRes, transRes, clientsRes] = await Promise.all([
                supabase.from('orders').select('id, total').eq('company_id', profile?.company_id).gte('created_at', startDate.toISOString()),
                supabase.from('transactions').select('amount').eq('company_id', profile?.company_id).eq('type', 'receita').gte('transaction_date', startDate.toISOString()),
                supabase.from('clients').select('id', { count: 'exact' }).eq('company_id', profile?.company_id).gte('created_at', startDate.toISOString())
            ])

            const totalFaturamento = transRes.data?.reduce((acc, t) => acc + t.amount, 0) || 0
            const totalPedidos = ordersRes.data?.length || 0
            const totalClientes = clientsRes.count || 0
            const ticketMedio = totalPedidos > 0 ? totalFaturamento / totalPedidos : 0

            setStats({
                faturamento: totalFaturamento,
                pedidos: totalPedidos,
                clientes: totalClientes,
                ticketMedio
            })
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async () => {
        setIsExporting(true)
        toast.info("Gerando relatório...")
        await new Promise(r => setTimeout(r, 1500))
        toast.success("Relatório exportado com sucesso!")
        setIsExporting(false)
    }

    const chartData = useMemo(() => [
      { name: "Seg", faturamento: 400 },
      { name: "Ter", faturamento: 300 },
      { name: "Qua", faturamento: 550 },
      { name: "Qui", faturamento: 450 },
      { name: "Sex", faturamento: 800 },
      { name: "Sáb", faturamento: 1200 },
      { name: "Dom", faturamento: 950 },
    ], [])

    return (
        <div className="space-y-12 pb-24">
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"
            >
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 italic uppercase leading-none">
                        Relatórios <span className="text-primary tracking-tighter italic">& Insights</span>
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight italic">Análise profunda do seu império de doces.</p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-[180px] h-16 bg-white/60 backdrop-blur-xl border border-white/80 rounded-[28px] text-[10px] font-black uppercase tracking-widest text-slate-600 px-6 shadow-xl">
                            <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-white/80 bg-white/90 backdrop-blur-xl shadow-2xl">
                            <SelectItem value="7" className="font-bold text-xs">Últimos 7 dias</SelectItem>
                            <SelectItem value="30" className="font-bold text-xs">Últimos 30 dias</SelectItem>
                            <SelectItem value="90" className="font-bold text-xs">Últimos 90 dias</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleExport} disabled={isExporting} className="h-16 px-10 rounded-[28px] bg-white border border-slate-100 hover:bg-slate-50 text-slate-900 font-black italic uppercase text-[10px] tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95">
                        <Download className="mr-3 size-5 text-primary" />
                        {isExporting ? "Gerando..." : "Exportar Relatório"}
                    </Button>
                </div>
            </motion.div>

            {/* Premium KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: "Faturamento", value: `R$ ${stats.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, trend: "+18%", icon: DollarSign, color: "rose", bg: "bg-rose-50/50" },
                    { label: "Ticket Médio", value: `R$ ${stats.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, trend: "+5%", icon: TrendingUp, color: "amber", bg: "bg-amber-50/50" },
                    { label: "Pedidos", value: stats.pedidos.toString(), trend: "+12%", icon: ShoppingBag, color: "indigo", bg: "bg-indigo-50/50" },
                    { label: "Novos Clientes", value: stats.clientes.toString(), trend: "+8%", icon: Users, color: "emerald", bg: "bg-emerald-50/50" },
                ].map((kpi, idx) => (
                    <motion.div
                        key={kpi.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={cn(
                            "group relative overflow-hidden rounded-[40px] p-8 border border-white shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1",
                            kpi.bg
                        )}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className={cn(
                                "size-14 rounded-[20px] flex items-center justify-center shadow-inner relative overflow-hidden",
                                `bg-white/50 text-${kpi.color}-500`
                            )}>
                                <kpi.icon className="size-7 relative z-10" />
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px] uppercase px-3 py-1 rounded-full">
                                {kpi.trend}
                            </Badge>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">
                                {kpi.label}
                            </p>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tightest italic">
                                {kpi.value}
                            </h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Performance Chart */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="w-full rounded-[48px] border border-white/50 bg-white/40 backdrop-blur-2xl p-10 shadow-2xl relative overflow-hidden"
            >
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                            Evolução de <span className="text-primary tracking-tighter">Faturamento</span>
                        </h3>
                        <p className="text-sm text-slate-500 mt-2 font-medium">Análise visual da receita ao longo do tempo.</p>
                    </div>
                </div>

                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F472B6" stopOpacity={0.5} />
                                    <stop offset="95%" stopColor="#F472B6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }}
                                dx={-10}
                            />
                            <RechartsTooltip
                                cursor={{ stroke: '#F472B6', strokeWidth: 1, strokeDasharray: '4 4' }}
                                contentStyle={{ borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="faturamento"
                                stroke="#F472B6"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorFaturamento)"
                                activeDot={{ r: 8, fill: '#F472B6', stroke: '#fff', strokeWidth: 4 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {/* Product Performance ranking */}
                <Card className="border-none bg-white/40 backdrop-blur-2xl rounded-[48px] shadow-2xl overflow-hidden border border-white/60">
                    <CardHeader className="p-10 pb-6 border-b border-white/40">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-2xl font-black italic uppercase tracking-tighter text-slate-800">Produtos Estrela</CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">Top performance do cardápio</CardDescription>
                            </div>
                            <div className="size-14 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
                                <Star className="size-6 fill-current" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 space-y-10">
                        {[
                            { name: "Bolo Red Velvet", sales: 42, growth: 15, color: "rose" },
                            { name: "Donuts de Pistache", sales: 38, growth: 22, color: "emerald" },
                            { name: "Bolo de Cenoura G.", sales: 25, growth: -5, color: "amber" },
                            { name: "Brigadeiro Belga", sales: 850, growth: 10, color: "indigo" },
                        ].map((item, id) => (
                            <div key={id} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("size-2 rounded-full", `bg-${item.color}-500`)} />
                                        <span className="text-sm font-black text-slate-800 italic uppercase tracking-tight">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">
                                        {item.sales} {item.name === "Brigadeiro Belga" ? 'und' : 'unid'}
                                    </span>
                                </div>
                                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden relative border border-white">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.growth + 60}%` }}
                                        transition={{ duration: 1, delay: id * 0.1 }}
                                        className={cn(
                                            "h-full rounded-full relative overflow-hidden",
                                            `bg-${item.color}-400`
                                        )}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-shimmer" style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent)' }} />
                                    </motion.div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Profit Margins section */}
                <Card className="border-none bg-white/40 backdrop-blur-2xl rounded-[48px] shadow-2xl overflow-hidden border border-white/60">
                    <CardHeader className="p-10 pb-6 border-b border-white/40">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-2xl font-black italic uppercase tracking-tighter text-slate-800">Rentabilidade</CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">Margem real por categoria</CardDescription>
                            </div>
                            <div className="size-14 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                <PieChart className="size-6" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { label: "Bolos Decorados", margin: "65%", status: "Excelente", color: "rose" },
                                { label: "Doces Finos", margin: "82%", status: "Premium", color: "indigo" },
                                { label: "Salgados", margin: "45%", status: "Melhorar", color: "amber" },
                                { label: "Pronta Entrega", margin: "58%", status: "Saudável", color: "emerald" },
                            ].map((cat, id) => (
                                <motion.div
                                    key={id}
                                    whileHover={{ scale: 1.02 }}
                                    className={cn(
                                        "p-8 rounded-[40px] border border-white/60 relative overflow-hidden shadow-sm",
                                        `bg-${cat.color}-50/50`
                                    )}
                                >
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 italic leading-none">{cat.label}</p>
                                        <div className="flex items-end justify-between">
                                            <h4 className={cn("text-4xl font-black tracking-tightest italic", `text-${cat.color}-600`)}>{cat.margin}</h4>
                                            <Badge className={cn("rounded-full px-3 py-1 font-black italic border-none text-[8px] uppercase tracking-widest shadow-sm", `bg-white text-${cat.color}-500`)}>
                                                {cat.status}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className={cn("absolute -right-4 -bottom-4 size-20 opacity-[0.05]", `text-${cat.color}-600`)}>
                                        <TrendingUp className="size-full rotate-12" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* VIP Client section */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative overflow-hidden bg-slate-900 rounded-[56px] p-12 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] border border-slate-800"
            >
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                    <Target className="size-[400px]" />
                </div>

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary">
                            <Star className="size-4 fill-current" />
                            <span className="text-[10px] font-black uppercase tracking-widest italic">Hall da Fama VIP</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-none">
                            Ranking de <br /> <span className="text-primary tracking-tighter">Clientes VIP</span>
                        </h2>
                        <p className="text-slate-400 font-medium italic text-lg opacity-80">
                            Identifique suas maiores parceiras e crie programas de fidelidade exclusivos.
                        </p>
                    </div>

                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { name: "Patrícia Amorim", spend: "R$ 3.840", orders: 12, rank: 1 },
                            { name: "Juliana Mendes", spend: "R$ 2.950", orders: 8, rank: 2 },
                            { name: "Renata Oliveira", spend: "R$ 2.100", orders: 6, rank: 3 },
                        ].map((vip, id) => (
                            <motion.div
                                key={id}
                                whileHover={{ y: -10 }}
                                className="bg-white/5 backdrop-blur-3xl rounded-[40px] p-10 border border-white/10 flex flex-col items-center text-center group/card transition-all hover:bg-white/10"
                            >
                                <div className={cn(
                                    "size-20 rounded-[28px] flex items-center justify-center text-3xl font-black mb-6 shadow-2xl relative transition-transform group-hover/card:scale-110",
                                    vip.rank === 1 ? "bg-primary text-white shadow-primary/40 rotate-12" : "bg-white/10 text-white"
                                )}>
                                    {vip.rank === 1 ? <Star className="size-8 fill-current" /> : vip.rank}
                                </div>
                                <h4 className="text-xl font-black italic uppercase tracking-tighter text-white mb-2">{vip.name}</h4>
                                <div className="space-y-1 mb-8">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Gasto Total</p>
                                    <p className="text-3xl font-black text-primary tracking-tightest italic">R$ {vip.spend}</p>
                                </div>
                                <Badge className="bg-white/10 text-white border-none font-black text-[9px] uppercase tracking-widest px-4 py-2 rounded-full">
                                    {vip.orders} pedidos registrados
                                </Badge>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* AI Strategic Footer */}
            <section className="relative py-16 px-10 rounded-[48px] overflow-hidden group text-center flex flex-col items-center gap-10">
                <div className="absolute inset-0 bg-rose-50/50 backdrop-blur-xl -z-10 group-hover:bg-rose-100/50 transition-colors" />

                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                    <div className="size-24 rounded-[32px] bg-white text-primary shadow-2xl flex items-center justify-center relative z-10 animate-pulse border border-primary/10">
                        <Target className="size-10" />
                    </div>
                </div>

                <div className="max-w-2xl space-y-6">
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">
                        A Doce IA está <span className="text-primary italic tracking-tight">Pronta para agir</span>
                    </h2>
                    <p className="text-slate-500 font-bold italic text-xl">
                        Analisamos todo o seu histórico e identificamos <span className="text-slate-900">3 estratégias de faturamento explosivo</span> para os próximos 7 dias.
                    </p>
                    <div className="pt-6">
                        <Button className="h-20 px-12 rounded-[32px] bg-slate-900 border-none hover:bg-slate-800 text-white font-black italic uppercase text-xs tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-4 mx-auto">
                            Ver Estratégias da IA
                            <ArrowUpRight className="size-6 text-primary" />
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    )
}
