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
    Target,
    Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"
import { FeatureGuard } from "@/components/dashboard/FeatureGuard"
import { PageHeader } from "@/components/dashboard/PageHeader"

export default function RelatoriosPage() {
    return (
        <FeatureGuard feature="relatorios" planRequired="pro">
            <div className="space-y-8 pb-20">
              <RelatoriosContent />
            </div>
        </FeatureGuard>
    )
}

function RelatoriosContent() {
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

            const { data: pedidosData } = await supabase
                .from('pedidos')
                .select('valor_total, created_at')
                .eq('company_id', profile?.company_id)
                .gte('created_at', startDate.toISOString())

            const { count: totalClientes } = await supabase
                .from('clientes')
                .select('id', { count: 'exact' })
                .eq('company_id', profile?.company_id)
                .gte('created_at', startDate.toISOString())

            const totalFaturamento = pedidosData?.reduce((acc, p) => acc + (p.valor_total || 0), 0) || 0
            const totalPedidos = pedidosData?.length || 0
            const ticketMedio = totalPedidos > 0 ? totalFaturamento / totalPedidos : 0

            setStats({
                faturamento: totalFaturamento,
                pedidos: totalPedidos,
                clientes: totalClientes || 0,
                ticketMedio
            })
        } catch (e) {
            console.error("Error fetching stats:", e)
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async () => {
        setIsExporting(true)
        toast.info("Gerando relatório...")
        await new Promise(r => setTimeout(r, 1500))
        toast.success("Relatório exportado!")
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
        <>
            <PageHeader 
                title="Insights e" 
                highlight="Relatórios" 
                subtitle="Análise profunda de desempenho, lucratividade e comportamento dos clientes"
                actions={(
                   <div className="flex gap-3">
                      <Select value={dateRange} onValueChange={setDateRange}>
                          <SelectTrigger className="w-44 h-11 bg-white border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 px-4 shadow-sm">
                              <SelectValue placeholder="Período" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                              <SelectItem value="7" className="font-bold text-xs uppercase">7 dias</SelectItem>
                              <SelectItem value="30" className="font-bold text-xs uppercase">30 dias</SelectItem>
                              <SelectItem value="90" className="font-bold text-xs uppercase">90 dias</SelectItem>
                          </SelectContent>
                      </Select>
                      <Button onClick={handleExport} disabled={isExporting} className="h-11 px-6 rounded-xl bg-slate-900 text-white font-black uppercase text-[10px] shadow-lg">
                          <Download size={16} className="mr-2" /> PDF
                      </Button>
                   </div>
                )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Faturamento", value: stats.faturamento, icon: DollarSign, color: "text-rose-500", bg: "bg-rose-50/50" },
                    { label: "Ticket Médio", value: stats.ticketMedio, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50/50" },
                    { label: "Pedidos", value: stats.pedidos, icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-50/50" },
                    { label: "Novos Clientes", value: stats.clientes, icon: Users, color: "text-indigo-500", bg: "bg-indigo-50/50" },
                ].map((kpi, idx) => (
                    <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className={cn("p-6 rounded-[32px] border border-slate-100 shadow-sm transition-all hover:translate-y-[-4px]", kpi.bg)}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="size-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                <kpi.icon size={20} className={kpi.color} />
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[8px] uppercase px-2 py-0.5 rounded-full">+12%</Badge>
                        </div>
                        <p className="text-[9px] font-black uppercase text-slate-400 italic mb-1 tracking-widest">{kpi.label}</p>
                        <h3 className="text-2xl font-black text-slate-900 italic tracking-tight">
                            {typeof kpi.value === 'number' ? `R$ ${kpi.value.toFixed(2)}` : kpi.value}
                        </h3>
                    </motion.div>
                ))}
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                <div className="mb-8">
                    <h3 className="text-xl font-black text-slate-900 uppercase italic">Evolução de <span className="text-rose-500">Recita</span></h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase italic tracking-widest mt-1 italic">Performance financeira diária no período selecionado</p>
                </div>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F472B6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#F472B6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} />
                            <RechartsTooltip cursor={{ stroke: '#F472B6', strokeWidth: 1 }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="faturamento" stroke="#F472B6" strokeWidth={4} fillOpacity={1} fill="url(#colorFaturamento)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="rounded-[32px] border-slate-100 shadow-sm p-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                           <h3 className="text-lg font-black italic uppercase text-slate-900">Produtos Estrela</h3>
                           <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest italic">Performance do cardápio</p>
                        </div>
                        <Star size={24} className="text-amber-500 fill-amber-500" />
                    </div>
                    <div className="space-y-6">
                        {[
                            { name: "Bolo Red Velvet", growth: 85, color: "bg-rose-500" },
                            { name: "Docinhos Gourmet", growth: 65, color: "bg-emerald-500" },
                            { name: "Torta de Limão", growth: 45, color: "bg-blue-500" },
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-[11px] font-black uppercase italic">
                                    <span className="text-slate-700">{item.name}</span>
                                    <span className="text-slate-400">{item.growth}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${item.growth}%` }} className={cn("h-full", item.color)} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="rounded-[32px] border-slate-100 shadow-sm p-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                           <h3 className="text-lg font-black italic uppercase text-slate-900">Novos Leads</h3>
                           <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest italic">Conversão de clientes</p>
                        </div>
                        <Users size={24} className="text-indigo-500" />
                    </div>
                    <div className="flex items-center justify-center h-40">
                         <div className="text-center">
                            <span className="text-5xl font-black italic text-slate-900">{stats.clientes}</span>
                            <p className="text-[10px] font-black uppercase text-slate-400 mt-2 tracking-widest">Pessoas alcançadas</p>
                         </div>
                    </div>
                </Card>
            </div>
        </>
    )
}
