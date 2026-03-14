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
    ShoppingCart,
    Package,
    ChevronRight,
    Search,
    Filter,
    Download,
    Eye
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
    Bar,
    PieChart,
    Pie,
    Cell
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="group relative"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-[40px] blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
            
            <div className="relative glass-card rounded-[40px] p-8 border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-md overflow-hidden h-full flex flex-col justify-between">
                <div className="absolute -right-10 -top-10 size-40 bg-slate-900/[0.02] rounded-full blur-3xl group-hover:bg-primary/5 transition-colors duration-700" />
                
                <div className="flex items-start justify-between mb-10 relative z-10">
                    <div className={cn(
                        "size-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6", 
                        color
                    )}>
                        <Icon className="size-7" />
                    </div>
                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest italic backdrop-blur-md shadow-sm border",
                            trend.isUp 
                                ? "text-emerald-600 bg-emerald-50/50 border-emerald-100/50" 
                                : "text-rose-600 bg-rose-50/50 border-rose-100/50"
                        )}>
                            {trend.isUp ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                            {trend.value}
                        </div>
                    )}
                </div>

                <div className="relative z-10 mt-auto">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic opacity-70 group-hover:opacity-100 transition-opacity">SaaS Insight // {title}</p>
                    <h3 className="text-4xl lg:text-5xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">{value}</h3>
                </div>
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
            setMetrics({
                total_users: 0,
                total_companies: 0,
                mrr: 0,
                active_subscriptions: 0,
                trial_subscriptions: 0,
                open_tickets: 0,
                latest_users: [],
                chart_data: { users: [], payments: [], orders: [] }
            })
        } finally {
            setLoading(false)
        }
    }

    // Helper p/ formatar dados dos gráficos (Agrupar por dia)
    const processChartData = () => {
        if (!metrics?.chart_data) return []
        
        // Vamos criar os últimos 7 dias p/ o gráfico
        const days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - (6 - i))
            return format(d, 'dd/MM')
        })

        return days.map(day => {
            const users = metrics.chart_data.users.filter((u: any) => format(new Date(u.created_at), 'dd/MM') === day).length
            const mrr = metrics.chart_data.payments
                .filter((p: any) => format(new Date(p.created_at), 'dd/MM') === day)
                .reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0)
            
            return { name: day, users, mrr }
        })
    }

    const chartData = processChartData()

    const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
            const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId)
            if (error) throw error
            toast.success(`Usuário ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso!`)
            fetchMetrics()
        } catch (e) {
            toast.error("Erro ao alterar status")
        }
    }

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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-2 bg-indigo-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] italic">Realtime SaaS Engine</span>
                    </div>
                    <h2 className="text-6xl font-black text-slate-900 italic uppercase tracking-tighter leading-[0.8]">
                        Central <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">Admin</span>
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] italic">Plataforma DoceGestão Pro // Governança & Growth</p>
                </div>
                
                <div className="flex items-center gap-4 bg-white/80 backdrop-blur-xl px-8 py-4 rounded-[32px] border border-white/50 shadow-2xl shadow-indigo-500/5">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status Global</p>
                        <p className="text-sm font-black text-emerald-600 italic uppercase tracking-tighter">Healthy & Scaling</p>
                    </div>
                    <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100/50">
                        <Activity className="size-6 animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Main KPIs Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                <MetricCard
                    title="Receita Mensal (MRR)"
                    value={`R$ ${metrics?.mrr?.toLocaleString('pt-BR') || '0'}`}
                    icon={DollarSign}
                    trend={{ value: `R$ ${metrics?.arr?.toLocaleString('pt-BR')} ARR`, isUp: true }}
                    color="bg-gradient-to-br from-emerald-600 to-emerald-500"
                    delay={0.1}
                />
                <MetricCard
                    title="Empresas Parceiras"
                    value={metrics?.total_companies || 0}
                    icon={Building2}
                    trend={{ value: `${metrics?.conversion_rate}% Conv.`, isUp: true }}
                    color="bg-gradient-to-br from-indigo-600 to-indigo-500"
                    delay={0.2}
                />
                <MetricCard
                    title="Pedidos Processados"
                    value={metrics?.total_orders || 0}
                    icon={ShoppingCart}
                    trend={{ value: `+${metrics?.orders_today || 0} hoje`, isUp: true }}
                    color="bg-gradient-to-br from-blue-600 to-blue-500"
                    delay={0.3}
                />
                <MetricCard
                    title="Usuários na Base"
                    value={metrics?.total_users || 0}
                    icon={Users}
                    trend={{ value: `+${metrics?.new_users_month || 0} este mês`, isUp: true }}
                    color="bg-gradient-to-br from-slate-900 to-slate-800"
                    delay={0.4}
                />
            </div>

            {/* Analytical Highlights Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/40 backdrop-blur-sm rounded-[32px] p-7 border border-white/50 flex items-center gap-6 group hover:bg-white/60 transition-all cursor-default"
                >
                    <div className="size-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100/50 group-hover:scale-110 transition-transform">
                        <Clock className="size-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5 opacity-60">Trial Ativos</p>
                        <p className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">{metrics?.trial_subscriptions || 0} <span className="text-sm font-bold text-slate-400 not-italic lowercase tracking-normal">contas em teste</span></p>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white/40 backdrop-blur-sm rounded-[32px] p-7 border border-white/50 flex items-center gap-6 group hover:bg-white/60 transition-all cursor-default"
                >
                    <div className="size-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100/50 group-hover:scale-110 transition-transform">
                        <TrendingUp className="size-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5 opacity-60">Ticket Médio</p>
                        <p className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">R$ 142,50 <span className="text-sm font-bold text-emerald-500 uppercase">+12%</span></p>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white/40 backdrop-blur-sm rounded-[32px] p-7 border border-white/50 flex items-center gap-6 group hover:bg-white/60 transition-all cursor-default"
                >
                    <div className="size-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100/50 group-hover:scale-110 transition-transform">
                        <ArrowDownRight className="size-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5 opacity-60">Churn Estimado</p>
                        <p className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">1.8% <span className="text-sm font-bold text-slate-400 not-italic opacity-50 lowercase tracking-normal">este mês</span></p>
                    </div>
                </motion.div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* MRR Growth Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="glass-card rounded-[40px] p-10 border border-white/40 shadow-2xl shadow-indigo-500/5 relative overflow-hidden group bg-white/60 backdrop-blur-md"
                >
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="size-3 text-emerald-500" />
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Performance Trend</span>
                            </div>
                            <h4 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">Crescimento de <span className="text-indigo-600">Receita</span></h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic opacity-60">Faturamento Diário da Plataforma (R$)</p>
                        </div>
                        <div className="size-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/30 group-hover:scale-110 transition-transform duration-500">
                            <Activity className="size-7" />
                        </div>
                    </div>
                    <div className="h-[320px] w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMrrAdminPro" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} tickFormatter={(val) => `R$${val}`} />
                                <Tooltip
                                    contentStyle={{ 
                                        borderRadius: '24px', 
                                        border: '1px solid rgba(226, 232, 240, 0.5)', 
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(10px)',
                                        padding: '20px'
                                    }}
                                    itemStyle={{ fontWeight: 800, fontSize: '14px', textTransform: 'uppercase', color: '#0f172a' }}
                                    labelStyle={{ fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '8px' }}
                                />
                                <Area type="monotone" dataKey="mrr" stroke="#4f46e5" strokeWidth={5} fillOpacity={1} fill="url(#colorMrrAdminPro)" animationDuration={3000} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Plan Distribution Donut Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="glass-card rounded-[40px] p-10 border border-white/40 shadow-2xl shadow-indigo-500/5 relative overflow-hidden group bg-white/60 backdrop-blur-md"
                >
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Package className="size-3 text-indigo-500" />
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">Plan Market Share</span>
                            </div>
                            <h4 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">Mix de <span className="text-primary">Planos</span></h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic opacity-60">Distribuição de Assinaturas Ativas</p>
                        </div>
                    </div>
                    
                    <div className="h-[320px] w-full flex items-center relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={Object.entries(metrics?.plan_distribution || {}).map(([name, value]) => ({ name, value }))}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={8}
                                    dataKey="value"
                                    animationDuration={2500}
                                >
                                    {[
                                        '#6366f1', // Pro / Indigo
                                        '#ec4899', // Premium / Pink
                                        '#f59e0b', // Starter / Amber
                                        '#10b981', // Emerald
                                    ].map((color, index) => (
                                        <Cell key={`cell-${index}`} fill={color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        
                        {/* Custom Legend for the Pie */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 space-y-4 pr-10">
                            {Object.entries(metrics?.plan_distribution || {}).map(([name, value], i) => (
                                <div key={name} className="flex items-center gap-4 group/item">
                                    <div className="size-3 rounded-full shadow-sm group-hover/item:scale-125 transition-transform" style={{ background: ['#6366f1', '#ec4899', '#f59e0b', '#10b981'][i % 4] }} />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-900 uppercase italic tracking-tighter leading-none">{String(name)}</span>
                                        <span className="text-[10px] font-bold text-slate-400 group-hover/item:text-slate-600 transition-colors uppercase tracking-widest leading-none mt-1">{String(value)} empresas</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Latest Activity Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Users Table */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    className="xl:col-span-2 glass-card rounded-[40px] border border-white/40 shadow-2xl shadow-indigo-500/5 overflow-hidden bg-white/60 backdrop-blur-md"
                >
                    <div className="p-8 border-b border-slate-100/50 flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="size-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-900/20">
                                <Users className="size-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Últimas Confeitarias</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60">Novos registros na plataforma</p>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all">
                            Ver Todas <ChevronRight className="size-3" />
                        </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/30">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Parceiro</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Plano</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50">
                                {(metrics?.latest_users || []).map((user: any, i: number) => (
                                    <tr key={user.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center text-slate-400 group-hover:from-indigo-500 group-hover:to-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
                                                    <span className="text-xs font-black italic uppercase">{(user.owner_name || 'U').charAt(0)}</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 italic uppercase tracking-tighter">{user.owner_name || 'Usuário Sem Nome'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase opacity-60">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                             <div className={cn(
                                                 "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em]",
                                                 user.status === 'inactive' 
                                                    ? "bg-slate-100 text-slate-500 border border-slate-200/50" 
                                                    : "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                                             )}>
                                                <div className={cn("size-1.5 rounded-full", user.status === 'inactive' ? "bg-slate-400" : "bg-emerald-500 animate-pulse")} />
                                                {user.status || 'active'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-[10px] font-black text-slate-600 uppercase italic bg-slate-100/50 px-2 py-1 rounded-md inline-block">{user.plan || 'Free'}</p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                                                <button className="size-9 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 flex items-center justify-center shadow-sm transition-all">
                                                    <Eye className="size-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleToggleUserStatus(user.id, user.status || 'active')}
                                                    className={cn(
                                                        "size-9 rounded-xl flex items-center justify-center shadow-lg transition-all",
                                                        user.status === 'inactive' 
                                                            ? "bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600" 
                                                            : "bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600"
                                                    )}
                                                >
                                                    {user.status === 'inactive' ? <ArrowUpRight className="size-4" /> : <TrendingDown className="size-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Payments Section */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 }}
                    className="flex flex-col gap-10"
                >
                    <div className="glass-card rounded-[40px] border border-white/40 shadow-2xl shadow-indigo-500/5 overflow-hidden bg-white/60 backdrop-blur-md flex-1 font-inter">
                        <div className="p-8 border-b border-slate-100/50 flex items-center gap-5">
                            <div className="size-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-600/20">
                                <CreditCard className="size-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Pagamentos</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60">Fluxo de caixa SaaS</p>
                            </div>
                        </div>
                        
                        <div className="p-2 overflow-y-auto max-h-[500px]">
                            <div className="space-y-2">
                                {(metrics?.latest_payments || []).slice(0, 6).map((pay: any) => (
                                    <div key={pay.id} className="flex items-center justify-between p-5 rounded-[28px] hover:bg-indigo-50/50 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm group-hover:rotate-6 transition-transform">
                                                <DollarSign className="size-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 italic uppercase tracking-tighter">{pay.companies?.name || 'Assinante'}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">{format(new Date(pay.created_at), 'dd MMM, HH:mm', { locale: ptBR })}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-emerald-600 italic">R$ {pay.amount?.toLocaleString('pt-BR')}</p>
                                            <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">via {pay.method || 'PIX'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="glass-card rounded-[40px] bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white shadow-2xl shadow-indigo-500/30 group overflow-hidden relative">
                        <div className="absolute -right-10 -bottom-10 size-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-700" />
                        <div className="relative z-10">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Suporte & Onboarding</h5>
                            <p className="text-2xl font-black italic uppercase tracking-tighter leading-tight mb-6">Precisa gerenciar<br /><span className="text-indigo-200">faturas pendentes?</span></p>
                            <button className="w-full py-4 rounded-2xl bg-white text-indigo-600 text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-lg shadow-black/10">
                                Abrir Financeiro
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
