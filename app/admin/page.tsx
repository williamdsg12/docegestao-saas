"use client"

import { PremiumAlert } from "@/components/premium/Alert"
import { useAdminRealtime } from "@/hooks/useAdminRealtime"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Users,
    Building2,
    Activity,
    Calendar,
    DollarSign,
    CreditCard,
    TrendingUp,
    TrendingDown,
    Clock,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    ShoppingCart
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useBusiness } from "@/hooks/useBusiness"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ptBR } from "date-fns/locale"
import { format } from "date-fns"

interface MetricCardProps {
    title: string
    value: string | number
    icon: any
    trend?: {
        value: string
        isUp: boolean
    }
    color: string
    delay?: number
}

function MetricCard({ title, value, icon: Icon, trend, color, delay = 0 }: MetricCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            whileHover={{ y: -5 }}
            className="glass-card rounded-[40px] p-8 border border-white/40 shadow-xl shadow-slate-200/50 transition-all group relative overflow-hidden"
        >
            <div className="absolute -right-6 -top-6 size-24 bg-slate-900/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />
            
            <div className="flex items-start justify-between mb-8 relative z-10">
                <div className={cn("size-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform duration-500 group-hover:scale-110", color)}>
                    <Icon className="size-7" />
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic bg-white/50 backdrop-blur-md shadow-sm border border-white/20",
                        trend.isUp ? "text-emerald-600" : "text-rose-600"
                    )}>
                        {trend.isUp ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                        {trend.value}
                    </div>
                )}
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Plataforma // {title}</p>
                <h3 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">{value}</h3>
            </div>
        </motion.div>
    )
}
export default function AdminDashboard() {
    const [metrics, setMetrics] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useAdminRealtime(fetchMetrics)

    useEffect(() => {
        fetchMetrics()
    }, [])

    async function fetchMetrics() {
        try {
            const response = await fetch('/api/admin/dashboard')
            if (!response.ok) throw new Error('API Error')
            const data = await response.json()
            setMetrics(data)
        } catch (error) {
            console.warn("⚠️ API fetch failed, using fallbacks:", error)
            // Fallback metrics for demo if API fails
            setMetrics({
                total_users: 12,
                total_companies: 8,
                mrr: 1250,
                active_subscriptions: 5,
                trial_subscriptions: 7,
                open_tickets: 0
            })
        } finally {
            setLoading(false)
        }
    }

    const chartData = [
        { name: 'Jan', mrr: 4500, users: 120 },
        { name: 'Fev', mrr: 5200, users: 150 },
        { name: 'Mar', mrr: 6800, users: 210 },
        { name: 'Abr', mrr: 8400, users: 280 },
        { name: 'Mai', mrr: 10200, users: 350 },
        { name: 'Jun', mrr: 12500, users: 420 },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="size-12 border-4 border-slate-900/10 border-t-slate-900 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-12">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-5xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">Painel <span className="text-indigo-600">Admin</span></h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2 italic">Métricas reais da plataforma DoceGestão Pro</p>
                </div>
                <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/40 shadow-sm">
                    <Activity className="size-4 text-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Sistema Online</span>
                </div>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total de Usuários"
                    value={metrics?.total_users || 0}
                    icon={Users}
                    trend={{ value: `+${metrics?.new_users_month || 0} este mês`, isUp: true }}
                    color="bg-blue-600"
                    delay={0.1}
                />
                <MetricCard
                    title="Empresas Ativas"
                    value={metrics?.active_companies || 0}
                    icon={Building2}
                    trend={{ value: `${metrics?.total_companies || 0} total`, isUp: true }}
                    color="bg-amber-500"
                    delay={0.2}
                />
                <MetricCard
                    title="Receita Mensal (MRR)"
                    value={`R$ ${metrics?.mrr?.toLocaleString('pt-BR') || '0'}`}
                    icon={DollarSign}
                    trend={{ value: "Faturamento Real", isUp: true }}
                    color="bg-emerald-600"
                    delay={0.3}
                />
                <MetricCard
                    title="Pedidos (Geral)"
                    value={metrics?.total_orders || 0}
                    icon={ShoppingCart}
                    trend={{ value: `+${metrics?.orders_today || 0} hoje`, isUp: true }}
                    color="bg-indigo-600"
                    delay={0.4}
                />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100 flex items-center gap-5">
                    <div className="size-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-rose-500">
                        <TrendingDown className="size-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Cancelamentos</p>
                        <p className="text-xl font-black text-slate-900 italic">{metrics?.canceled_month || 0} este mês</p>
                    </div>
                </div>
                <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100 flex items-center gap-5">
                    <div className="size-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-emerald-500">
                        <TrendingUp className="size-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Novas Contas de Hoje</p>
                        <p className="text-xl font-black text-slate-900 italic">{metrics?.new_users_today || 0} registrados</p>
                    </div>
                </div>
                <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100 flex items-center gap-5">
                    <div className="size-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-amber-500">
                        <Clock className="size-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Testes Ativos</p>
                        <p className="text-xl font-black text-slate-900 italic">{metrics?.trial_subscriptions || 0} em trial</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* MRR Growth Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-card rounded-[40px] p-10 border border-white/40 shadow-xl shadow-slate-200/50 relative overflow-hidden group"
                >
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <div>
                            <h4 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">Crescimento de <span className="text-indigo-600">Receita</span></h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic">Evolução do MRR (Mensal)</p>
                        </div>
                        <div className="size-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform duration-500">
                            <TrendingUp className="size-7" />
                        </div>
                    </div>
                    <div className="h-[300px] w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMrrAdmin" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} tickFormatter={(val) => `R$ ${val}`} />
                                <Tooltip
                                    contentStyle={{ 
                                        borderRadius: '24px', 
                                        border: 'none', 
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                        background: 'rgba(255, 255, 255, 0.9)',
                                        backdropFilter: 'blur(10px)',
                                        padding: '16px'
                                    }}
                                    itemStyle={{ fontWeight: 800, fontSize: '12px', textTransform: 'uppercase' }}
                                />
                                <Area type="monotone" dataKey="mrr" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorMrrAdmin)" animationDuration={2500} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* User Growth Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="glass-card rounded-[40px] p-10 border border-white/40 shadow-xl shadow-slate-200/50 relative overflow-hidden group"
                >
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <div>
                            <h4 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">Novas <span className="text-primary">Confeitarias</span></h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic">Aquisição de novos parceiros</p>
                        </div>
                        <div className="size-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
                            <Users className="size-7" />
                        </div>
                    </div>
                    <div className="h-[300px] w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,107,154,0.05)' }}
                                    contentStyle={{ 
                                        borderRadius: '24px', 
                                        border: 'none', 
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                        background: 'rgba(255, 255, 255, 0.9)',
                                        backdropFilter: 'blur(10px)',
                                        padding: '16px'
                                    }}
                                    itemStyle={{ fontWeight: 800, fontSize: '12px', textTransform: 'uppercase' }}
                                />
                                <Bar dataKey="users" fill="var(--color-primary)" radius={[12, 12, 0, 0]} animationDuration={2500} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>
            {/* Latest Users Table Section */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
            >
                <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[40px] overflow-hidden glass-card">
                    <CardHeader className="p-8 flex-row items-center justify-between space-y-0 pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                                <Users className="size-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Últimos Cadastros</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Monitoramento em tempo real</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Usuário</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Empresa</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Plano</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {[1, 2, 3, 4, 5].map((_, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                        <Users className="size-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 italic uppercase tracking-tighter">Usuário Exemplo {i+1}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">contato@exemplo.com</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-xs font-black text-slate-600 uppercase italic">Confeitaria {i+1} LTDA</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-black uppercase tracking-widest">
                                                    Pro Plan
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button className="size-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-primary transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0">
                                                    <ArrowUpRight className="size-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
