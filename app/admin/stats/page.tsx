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
    DollarSign
} from "lucide-react"
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
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Simular carregamento inicial
        const timer = setTimeout(() => setLoading(false), 800)
        return () => clearTimeout(timer)
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="size-12 border-4 border-slate-900/10 border-t-slate-900 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">Analytics da <span className="text-primary">Plataforma</span></h2>
                    <p className="text-slate-500 font-medium">Métricas avançadas de crescimento e saúde do negócio</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => toast.success("Dados exportados para CSV com sucesso!")}
                        className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors uppercase tracking-wider"
                    >
                        Exportar CSV
                    </button>
                    <button 
                        onClick={() => {
                            toast.promise(
                                new Promise((resolve) => setTimeout(resolve, 1500)),
                                {
                                    loading: 'Gerando relatório executivo...',
                                    success: 'Relatório gerado com sucesso!',
                                    error: 'Erro ao gerar relatório',
                                }
                            )
                        }}
                        className="px-6 py-3 bg-slate-900 hover:bg-slate-800 rounded-2xl text-sm font-bold text-white transition-colors uppercase tracking-wider shadow-lg shadow-slate-900/20"
                    >
                        Gerar Relatório
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Atletas Ativos / Sessões */}
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-cyan-100/50 transition-all group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="size-14 rounded-2xl bg-cyan-50 text-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Activity className="size-6" />
                        </div>
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic bg-emerald-50 text-emerald-600">
                            <ArrowUpRight className="size-3" />
                            18%
                        </div>
                    </div>
                    <div>
                        <p className="text-4xl font-black text-slate-900 tracking-tighter italic">2.431</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Logins M/M</p>
                    </div>
                </div>
                
                {/* Churn Rate */}
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-rose-100/50 transition-all group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="size-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <TrendingDown className="size-6" />
                        </div>
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic bg-emerald-50 text-emerald-600">
                            <ArrowDownRight className="size-3" />
                            -2.1%
                        </div>
                    </div>
                    <div>
                        <p className="text-4xl font-black text-slate-900 tracking-tighter italic">1.2%</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Churn Rate Mensal</p>
                    </div>
                </div>

                {/* MRR */}
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-emerald-100/50 transition-all group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="size-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <DollarSign className="size-6" />
                        </div>
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic bg-emerald-50 text-emerald-600">
                            <ArrowUpRight className="size-3" />
                            36%
                        </div>
                    </div>
                    <div>
                        <p className="text-4xl font-black text-slate-900 tracking-tighter italic line-clamp-1">R$ 48.2K</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">MRR Atual</p>
                    </div>
                </div>

                {/* ARR */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] p-8 border border-slate-800 flex flex-col justify-between shadow-xl shadow-slate-900/20 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700" />
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="size-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-sm">
                            <TrendingUp className="size-6 text-emerald-400" />
                        </div>
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                            <ArrowUpRight className="size-3" />
                            Previsão
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-4xl font-black tracking-tighter italic line-clamp-1">R$ 578K</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ARR Projetado</p>
                    </div>
                </div>
            </div>

            {/* Principal Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Growth Chart */}
                <div className="bg-white rounded-[40px] p-8 md:p-10 border border-slate-100 shadow-sm">
                    <div className="mb-10">
                        <h4 className="text-xl font-black text-slate-900 italic uppercase">Crescimento <span className="text-emerald-500">Financeiro</span></h4>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Comparativo de MRR vs Receita Bruta</p>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={financialData}>
                                <defs>
                                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(val) => `R$${val/1000}k`} />
                                <Tooltip
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    contentStyle={{ borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800, padding: '16px 24px' }}
                                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                                />
                                <Area type="monotone" dataKey="revenue" name="Receita Bruta" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                <Area type="monotone" dataKey="mrr" name="MRR" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorMrr)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Activity Chart */}
                <div className="bg-white rounded-[40px] p-8 md:p-10 border border-slate-100 shadow-sm">
                    <div className="mb-10 flex justify-between items-start">
                        <div>
                            <h4 className="text-xl font-black text-slate-900 italic uppercase">Atividade do <span className="text-indigo-500">Sistema</span></h4>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Usuários ativos e volume de logins (30 dias)</p>
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={activityData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <Tooltip
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    contentStyle={{ borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800 }}
                                />
                                <Line yAxisId="left" type="monotone" dataKey="logins" name="Logins" stroke="#6366f1" strokeWidth={4} dot={{ strokeWidth: 4, r: 4 }} activeDot={{ r: 8 }} />
                                <Line yAxisId="right" type="monotone" dataKey="active_companies" name="Empresas" stroke="#f59e0b" strokeWidth={4} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            
            {/* Secondary KPIs / Logs */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
                    <h4 className="text-lg font-black text-slate-900 italic uppercase mb-6">Métricas de Adoção</h4>
                    <div className="space-y-6">
                        {[
                            { name: "Gestão Financeira (Módulo)", usage: 89, color: "bg-blue-500" },
                            { name: "Ponto de Venda (PDV)", usage: 76, color: "bg-emerald-500" },
                            { name: "Controle de Estoque", usage: 64, color: "bg-indigo-500" },
                            { name: "Catálogo Online (Website)", usage: 42, color: "bg-purple-500" },
                        ].map((module, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-slate-700">{module.name}</span>
                                    <span className="text-sm font-black italic">{module.usage}%</span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className={cn("h-full rounded-full transition-all duration-1000", module.color)} style={{ width: `${module.usage}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[40px] p-8 text-white relative overflow-hidden flex flex-col justify-center items-center text-center shadow-xl shadow-slate-900/10">
                    <div className="absolute -right-10 -top-10 size-40 bg-primary/20 rounded-full blur-3xl" />
                    <div className="absolute -left-10 -bottom-10 size-40 bg-blue-500/20 rounded-full blur-3xl" />
                    
                    <FileText className="size-16 text-slate-400 mb-6 relative z-10" />
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4 relative z-10">Exportação de<br/>Dados Completa</h3>
                    <p className="text-slate-400 font-medium text-sm mb-8 relative z-10">Faça o donwload do Data Lake completo para análise no PowerBI ou Excel.</p>
                    <button className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-colors relative z-10">
                        Baixar Dump CSV
                    </button>
                </div>
             </div>
        </motion.div>
    )
}
