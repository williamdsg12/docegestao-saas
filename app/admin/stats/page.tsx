"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    Activity,
    FileText,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    Building2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
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
    LineChart,
    Line
} from 'recharts'

const financialData = [
    { name: 'Jan', mrr: 12000, arr: 144000, revenue: 15400 },
    { name: 'Fev', mrr: 15500, arr: 186000, revenue: 18900 },
    { name: 'Mar', mrr: 19800, arr: 237600, revenue: 22100 },
    { name: 'Abr', mrr: 26400, arr: 316800, revenue: 29500 },
    { name: 'Mai', mrr: 35200, arr: 422400, revenue: 38000 },
    { name: 'Jun', mrr: 48200, arr: 578400, revenue: 52400 },
]

const activityData = [
    { day: '01', logins: 450, active_companies: 290 },
    { day: '05', logins: 820, active_companies: 305 },
    { day: '10', logins: 1200, active_companies: 312 },
    { day: '15', logins: 1650, active_companies: 318 },
    { day: '20', logins: 2100, active_companies: 322 },
    { day: '25', logins: 2350, active_companies: 326 },
    { day: '30', logins: 2431, active_companies: 328 },
]

export default function StatsAdmin() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    async function fetchStats() {
        setLoading(true)
        try {
            const response = await fetch('/api/admin/stats')
            if (!response.ok) throw new Error('API Error')
            const result = await response.json()
            setData(result)
        } catch (error) {
            console.error("error fetching stats:", error)
            toast.error("Erro ao sincronizar motor analítico")
        } finally {
            setLoading(false)
        }
    }

    if (loading || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] gap-8">
                <div className="size-20 border-t-4 border-indigo-600 border-r-4 border-r-transparent rounded-full animate-spin shadow-2xl shadow-indigo-500/20" />
                <div className="space-y-2 text-center">
                    <p className="text-slate-900 font-black uppercase tracking-[0.4em] italic text-sm">Synchronizing Data Lake</p>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aggregating live metrics from global infrastructure...</p>
                </div>
            </div>
        )
    }

    const { financialData, kpis } = data

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                        Analytics <span className="text-indigo-400">Hub</span>
                    </h2>
                    <p className="text-sm text-slate-500 mt-2">Visão consolidada de crescimento, retenção e saúde financeira do ecossistema.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={() => toast.success("Relatório gerado com sucesso!")}
                        className="h-11 px-6 rounded-xl bg-indigo-600 text-white font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-all text-xs"
                    >
                        <FileText className="size-4" /> Exportar Dados
                    </Button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'MRR Atual', value: `R$ ${(kpis.currentMRR / 1000).toFixed(1)}K`, icon: DollarSign, color: 'text-indigo-500' },
                    { label: 'Usuários Totais', value: kpis.totalUsers, icon: Users, color: 'text-emerald-500' },
                    { label: 'Empresas Ativas', value: kpis.totalCompanies, icon: Building2, color: 'text-amber-500' },
                    { label: 'Taxa de Churn', value: `${kpis.churnRate}%`, icon: TrendingDown, color: 'text-rose-500' }
                ].map((m, i) => (
                    <div key={i} className="bg-[#09090b] border border-white/[0.05] p-6 rounded-xl shadow-sm">
                        <div className={cn("size-10 rounded-lg flex items-center justify-center bg-white/[0.03] border border-white/[0.05] mb-6", m.color)}>
                            <m.icon className="size-5" />
                        </div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">{m.label}</p>
                        <h3 className="text-2xl font-bold text-white tracking-tight">{m.value}</h3>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#09090b] border border-white/[0.05] rounded-xl p-8 shadow-sm">
                    <h4 className="text-lg font-bold text-white tracking-tight mb-8">Fluxo de Receita</h4>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={financialData}>
                                <defs>
                                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} tickFormatter={(val) => `R$${val/1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff10', borderRadius: '8px', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="mrr" name="MRR" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorMrr)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-[#09090b] border border-white/[0.05] rounded-xl p-8 shadow-sm">
                    <h4 className="text-lg font-bold text-white tracking-tight mb-8">Expansão de Base</h4>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={financialData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff10', borderRadius: '8px', fontSize: '12px' }}
                                />
                                <Bar dataKey="revenue" name="Empresas" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Insight */}
            <div className="bg-[#09090b] border border-white/[0.05] rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="size-14 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10">
                        <TrendingUp className="size-6" />
                    </div>
                    <div className="text-center md:text-left">
                        <h4 className="text-lg font-bold text-white tracking-tight">Execução Estratégica</h4>
                        <p className="text-sm text-slate-500 mt-1 max-w-xl">
                            Seu MRR cresceu <span className="text-emerald-500 font-bold">18.4%</span> no último ciclo. Trajetória de crescimento sustentável confirmada.
                        </p>
                    </div>
                </div>
                <Button variant="outline" className="h-10 border-white/10 text-xs font-semibold px-6 rounded-xl">
                    Ver Roadmap
                </Button>
            </div>
        </div>
    )
}
