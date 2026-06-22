"use client"

import { useAdminRealtime } from "@/hooks/useAdminRealtime"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Users,
    Building2,
    Activity,
    DollarSign,
    ShoppingCart,
    TrendingUp,
    TrendingDown,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    ChevronRight,
    Search,
    Download,
    Calendar,
    Zap,
    ShieldCheck,
    CreditCard,
    AlertCircle
} from "lucide-react"
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
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

interface DashboardMetrics {
    total_companies: number
    active_companies: number
    inactive_companies: number
    new_today: number
    churn_last_month: number
    mrr: number
    arr: number
    total_orders: number
    latest_companies: any[]
    latest_payments: any[]
    chart_data: {
        revenue: any[]
        growth: any[]
    }
}

function MetricCard({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    color = { text: 'text-slate-400' }, 
    loading, 
    delay = 0 
}: any) {
    if (loading) return <Skeleton className="h-[120px] rounded-xl" />
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="bg-[#09090b] border border-white/[0.05] rounded-xl p-6 shadow-sm flex flex-col justify-between hover:border-white/10 transition-colors"
        >
            <div className="flex items-center justify-between mb-4">
                <div className={cn("size-8 rounded-lg flex items-center justify-center bg-white/[0.03] border border-white/[0.05]", color.text)}>
                    <Icon className="size-4" />
                </div>
                {trend && (
                    <div className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1",
                        trend.isUp ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"
                    )}>
                        {trend.value}
                    </div>
                )}
            </div>
            <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
            </div>
        </motion.div>
    )
}

export default function AdminDashboard() {
    const [data, setData] = useState<DashboardMetrics | null>(null)
    const [loading, setLoading] = useState(true)

    useAdminRealtime(fetchData)

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const res = await fetch('/api/admin/dashboard')
            const json = await res.json()
            if (!res.ok) {
                throw new Error(json.error || "Erro ao carregar dados do dashboard")
            }
            setData(json)
        } catch (error) {
            toast.error("Erro ao carregar dados do dashboard")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Visão Geral</h2>
                    <p className="text-sm text-slate-500">Monitoramento e performance do sistema em tempo real.</p>
                </div>

                <div className="flex items-center gap-2 bg-white/[0.03] px-4 py-2 rounded-lg border border-white/[0.05]">
                    <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Sistema Operacional</span>
                </div>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <MetricCard
                    loading={loading}
                    title="Receita Recorrente (MRR)"
                    value={`R$ ${(data?.mrr || 0).toLocaleString('pt-BR')}`}
                    icon={DollarSign}
                    trend={{ value: "+12.5%", isUp: true }}
                    color={{ bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'bg-emerald-500' }}
                    delay={0}
                />
                <MetricCard
                    loading={loading}
                    title="Usuários Ativos"
                    value={data?.active_companies || 0}
                    icon={Users}
                    trend={{ value: `+${data?.new_today || 0} hoje`, isUp: true }}
                    color={{ bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', glow: 'bg-indigo-500' }}
                    delay={0.1}
                />
                <MetricCard
                    loading={loading}
                    title="Assinaturas Ativas"
                    value={data?.active_companies || 0}
                    icon={CreditCard}
                    trend={{ value: "High Activity", isUp: true }}
                    color={{ bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', glow: 'bg-blue-500' }}
                    delay={0.2}
                />
                <MetricCard
                    loading={loading}
                    title="Assinaturas Vencidas"
                    value={data?.churn_last_month || 0}
                    icon={AlertCircle}
                    trend={{ value: "Atenção", isUp: false }}
                    color={{ text: 'text-rose-500' }}
                    delay={0.3}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-[#09090b] border border-white/[0.05] rounded-xl p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-tight">Fluxo de Receita</h3>
                            <p className="text-xs text-slate-500 mt-1">Estimativa de ganhos diários</p>
                        </div>
                    </div>

                    {loading ? <Skeleton className="h-[300px] w-full rounded-xl" /> : (
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data?.chart_data?.revenue || []}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="#475569" 
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis 
                                        stroke="#475569" 
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => `R$${val}`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff10', borderRadius: '8px', fontSize: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* B2B Growth Chart */}
                <div className="bg-[#09090b] border border-white/[0.05] rounded-xl p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-tight">Crescimento B2B</h3>
                            <p className="text-xs text-slate-500 mt-1">Novas empresas registradas</p>
                        </div>
                    </div>

                    {loading ? <Skeleton className="h-[300px] w-full rounded-xl" /> : (
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.chart_data?.growth || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="#475569" 
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis 
                                        stroke="#475569" 
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff10', borderRadius: '8px', fontSize: '12px' }}
                                        cursor={{ fill: '#ffffff05' }}
                                    />
                                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
            {/* Bottom Section: Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#09090b] border border-white/[0.05] rounded-xl p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-white tracking-tight">Últimas Transações</h3>
                        <Button variant="outline" size="sm" className="h-8 border-white/10 text-[10px] uppercase tracking-wider font-bold">Ver Tudo</Button>
                    </div>

                    <div className="space-y-4">
                        {loading ? Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />) : (
                            data?.latest_payments?.map((payment, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/[0.05]">
                                    <div className="flex items-center gap-4">
                                        <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                            <DollarSign className="size-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">{payment.company_name}</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{payment.plan_name} • {format(new Date(payment.created_at), "dd MMM, HH:mm")}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-white">R$ {payment.amount.toFixed(2)}</p>
                                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">Liquidado</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-[#09090b] border border-white/[0.05] rounded-xl p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-white tracking-tight mb-8">Novas Empresas</h3>
                    <div className="space-y-6">
                        {loading ? Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />) : (
                            data?.latest_companies?.map((company, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="size-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                                        {company.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white leading-none mb-1">{company.name}</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{format(new Date(company.created_at), "dd/MM/yyyy")}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
