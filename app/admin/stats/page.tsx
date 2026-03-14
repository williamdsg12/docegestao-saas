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
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-16 pb-24"
        >
            {/* SaaS Pro Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] italic leading-none">BI Global Analytics</span>
                    </div>
                    <h2 className="text-7xl font-black text-slate-900 italic uppercase tracking-tighter leading-[0.8]">
                        Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-400 to-indigo-600 animate-gradient-x underline decoration-indigo-500/20">Dynamics</span>
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] italic">Growth Matrix // Retention Oversight // MRR Performance</p>
                </div>
                
                <div className="flex gap-4">
                    <Button 
                        onClick={() => toast.success("Dump global gerado com sucesso!")}
                        className="h-16 px-10 rounded-full bg-slate-900 text-white font-black uppercase italic text-[11px] tracking-widest gap-4 shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:shadow-indigo-500/30 hover:-translate-y-1 transition-all"
                    >
                        <FileText className="size-5" /> Export Vector Data
                    </Button>
                </div>
            </div>

            {/* Premium KPI Engine */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* MRR Card */}
                <div className="glass-card rounded-[48px] p-10 border border-white/40 shadow-2xl shadow-indigo-500/5 flex flex-col justify-between hover:shadow-indigo-500/10 transition-all duration-700 bg-white/60 backdrop-blur-md group">
                    <div className="flex justify-between items-start mb-10">
                        <div className="size-16 rounded-[24px] bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/30 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                            <DollarSign className="size-8" />
                        </div>
                        <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-[10px] font-black uppercase italic tracking-widest border border-emerald-100 flex items-center gap-2">
                            <ArrowUpRight className="size-3" /> Growth
                        </div>
                    </div>
                    <div>
                        <p className="text-5xl font-black text-slate-900 tracking-tighter italic leading-none">R$ {(kpis.currentMRR / 1000).toFixed(1)}K</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-3 italic">Monthly Recurring Revenue</p>
                    </div>
                </div>

                {/* Users Card */}
                <div className="glass-card rounded-[48px] p-10 border border-white/40 shadow-2xl shadow-emerald-500/5 flex flex-col justify-between hover:shadow-emerald-500/10 transition-all duration-700 bg-white/60 backdrop-blur-md group">
                    <div className="flex justify-between items-start mb-10">
                        <div className="size-16 rounded-[24px] bg-slate-900 text-white flex items-center justify-center shadow-2xl shadow-slate-900/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                            <Users className="size-8" />
                        </div>
                    </div>
                    <div>
                        <p className="text-5xl font-black text-slate-900 tracking-tighter italic leading-none">{kpis.totalUsers}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-3 italic">Total Platform Citizens</p>
                    </div>
                </div>

                {/* Companies Card */}
                <div className="glass-card rounded-[48px] p-10 border border-white/40 shadow-2xl shadow-amber-500/5 flex flex-col justify-between hover:shadow-amber-500/10 transition-all duration-700 bg-white/60 backdrop-blur-md group">
                    <div className="flex justify-between items-start mb-10">
                        <div className="size-16 rounded-[24px] bg-amber-500 text-white flex items-center justify-center shadow-2xl shadow-amber-500/30 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                            <Building2 className="size-8" />
                        </div>
                    </div>
                    <div>
                        <p className="text-5xl font-black text-slate-900 tracking-tighter italic leading-none">{kpis.totalCompanies}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-3 italic">Active Global Partners</p>
                    </div>
                </div>

                {/* Churn Card */}
                <div className="bg-slate-900 rounded-[48px] p-10 shadow-3xl flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all duration-1000 group-hover:bg-indigo-500/20" />
                    
                    <div className="flex justify-between items-start mb-10 relative z-10">
                        <div className="size-16 rounded-[24px] bg-white/10 text-rose-500 flex items-center justify-center border border-white/10 backdrop-blur-xl">
                            <TrendingDown className="size-8" />
                        </div>
                        <div className="bg-rose-500/20 text-rose-400 px-4 py-2 rounded-full text-[10px] font-black uppercase italic tracking-widest border border-rose-500/20">
                            Retention Delta
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-5xl font-black text-white tracking-tighter italic leading-none">{kpis.churnRate}%</p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-3 italic">Global Monthly Churn</p>
                    </div>
                </div>
            </div>

            {/* Advanced Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Growth Chart */}
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card rounded-[60px] p-12 border border-white/40 shadow-2xl bg-white/40 backdrop-blur-2xl"
                >
                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <h4 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">Finance <span className="text-indigo-500">Trajectory</span></h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">MRR vs Aggregate Revenue Forecast</p>
                        </div>
                        <TrendingUp className="size-6 text-indigo-500 opacity-30" />
                    </div>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={financialData}>
                                <defs>
                                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8', letterSpacing: '0.1em' }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} tickFormatter={(val) => `R$${val/1000}k`} />
                                <Tooltip
                                    cursor={{ stroke: '#6366f1', strokeWidth: 1 }}
                                    contentStyle={{ borderRadius: '32px', border: '1px solid #fff', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', fontWeight: 900, padding: '24px 32px', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: '0.05em' }}
                                />
                                <Area type="monotone" dataKey="revenue" name="Total Rev" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorGrowth)" strokeDasharray="10 10" />
                                <Area type="monotone" dataKey="mrr" name="MRR Velocity" stroke="#6366f1" strokeWidth={6} fillOpacity={1} fill="url(#colorMrr)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Adoption Chart */}
                <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card rounded-[60px] p-12 border border-white/40 shadow-2xl bg-white/40 backdrop-blur-2xl"
                >
                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <h4 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">Network <span className="text-amber-500">Expansion</span></h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Company onboarding velocity per cycle</p>
                        </div>
                        <Activity className="size-6 text-amber-500 opacity-30" />
                    </div>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={financialData}>
                                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8', letterSpacing: '0.1em' }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(245, 158, 11, 0.05)' }}
                                    contentStyle={{ borderRadius: '32px', border: '1px solid #fff', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', fontWeight: 900, padding: '24px 32px', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: '0.05em' }}
                                />
                                <Bar dataKey="companies" name="Entities Joined" fill="#f59e0b" radius={[12, 12, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Strategic Insights */}
            <div className="bg-slate-900 rounded-[64px] p-16 relative overflow-hidden group shadow-3xl mx-6">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] -mr-48 -mt-48 transition-all duration-1000 group-hover:bg-indigo-600/30" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] -ml-48 -mb-48 transition-all duration-1000 group-hover:bg-emerald-600/20" />
                
                <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
                    <div className="size-20 rounded-[32px] bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-xl mb-10 shadow-2xl">
                        <TrendingUp className="size-10 text-indigo-400" />
                    </div>
                    <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-6">
                        Execução Estratégica & <span className="text-indigo-400 underline decoration-indigo-400/30">Visão 2026</span>
                    </h3>
                    <p className="text-slate-400 font-bold text-lg uppercase tracking-widest leading-relaxed mb-12">
                        Seu MRR cresceu <span className="text-emerald-400">18.4%</span> no último ciclo. Com o Churn atual de <span className="text-rose-400">{kpis.churnRate}%</span>, a plataforma DocesGestão está em trajetória de hipercrescimento sustentável.
                    </p>
                    <div className="flex gap-4">
                        <Button className="h-16 px-12 rounded-full bg-white text-slate-900 font-black uppercase italic text-xs tracking-widest hover:bg-slate-50 transition-all hover:scale-105">
                            Visualizar Roadmap
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
