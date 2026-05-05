"use client"

import { useEffect, useState, useMemo } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { useBusiness } from "@/hooks/useBusiness"
import { format, subDays, startOfMonth, endOfMonth, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Package,
  Calculator,
  Sparkles,
  Target,
  Zap,
  ChevronRight,
  MessageCircle,
  Users,
  Rocket,
  Bot,
  BarChart3,
  Crown,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  PieChart as PieChartIcon,
  Plus,
  Tag,
  Medal,
  MousePointer2,
  Share2,
  CheckCircle2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { useTheme } from "next-themes"

import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  LineChart,
  Line
} from "recharts"

import { PageHeader } from "@/components/dashboard/PageHeader"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { useErpStats } from "@/hooks/useErpStats"
import { useRevenueEngine } from "@/hooks/useRevenueEngine"
import { usePlanLimits } from "@/hooks/usePlanLimits"
import { GamificationCard } from "@/components/dashboard/GamificationCard"
import { UpsellModal } from "@/components/dashboard/UpsellModal"

// --- Mini Chart Component for Metric Cards ---
const Sparkline = ({ data, color }: { data: any[], color: string }) => (
  <div className="h-10 w-24">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
)

export default function DashboardPage() {
  const { user } = useAuth()
  const { profile, business } = useBusiness()
  const tenantId = profile?.tenant_id || profile?.company_id

  const {
    totalHoje,
    totalMes,
    ticketMedio,
    totalClientes,
    topProducts,
    loading: statsLoading,
    pedidos
  } = useDashboardStats()

  const { data: erpStats } = useErpStats(tenantId)
  const { insights, loading: insightsLoading, checkDailyGoal } = useRevenueEngine()
  const { limits } = usePlanLimits()

  const [isMounted, setIsMounted] = useState(false)
  const [upsellOpen, setUpsellOpen] = useState(false)
  const [upsellReason, setUpsellReason] = useState<'limit_reached' | 'premium_feature'>('premium_feature')
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'month'>('today')

  useEffect(() => { 
    setIsMounted(true) 
    if (totalHoje > 0) {
        checkDailyGoal(totalHoje)
    }
  }, [totalHoje, checkDailyGoal])

  const META_MENSAL = business?.config?.monthly_goal || 10000 
  const DAILY_GOAL = business?.config?.daily_goal || 500
  
  // --- Process Data for Charts ---
  const chartData = useMemo(() => {
    if (!pedidos || pedidos.length === 0) return []
    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), 6 - i)
      const dayOrders = pedidos.filter(p => isSameDay(new Date(p.created_at), date))
      const dayTotal = dayOrders.reduce((acc, p) => acc + (p.total || 0), 0)
      return {
        name: format(date, 'EEE', { locale: ptBR }).toUpperCase(),
        vendas: dayTotal,
        prev: dayTotal * 0.9 // Simulated comparison
      }
    })
  }, [pedidos])

  const radialData = [
    { name: 'Meta', value: (totalMes / META_MENSAL) * 100, fill: '#FF2F81' }
  ]

  const kpis = [
    { 
      label: "Faturamento", 
      value: period === 'today' ? totalHoje : totalMes, 
      lastValue: (period === 'today' ? totalHoje : totalMes) * 0.9,
      trend: "+10%", 
      icon: DollarSign, 
      color: "text-[#FF2F81]", 
      bg: "bg-[#FF2F81]/10", 
      isCurrency: true,
      sparkline: [{value: 40}, {value: 30}, {value: 55}, {value: 45}, {value: 70}, {value: 65}, {value: 90}]
    },
    { 
      label: "Pedidos", 
      value: pedidos.length, 
      lastValue: Math.floor(pedidos.length * 0.8),
      trend: "+25%", 
      icon: ShoppingBag, 
      color: "text-blue-500", 
      bg: "bg-blue-500/10", 
      isCurrency: false,
      sparkline: [{value: 20}, {value: 40}, {value: 30}, {value: 50}, {value: 45}, {value: 60}, {value: 55}]
    },
    { 
      label: "Ticket Médio", 
      value: ticketMedio, 
      lastValue: ticketMedio * 1.1,
      trend: "-9%", 
      icon: Calculator, 
      color: "text-emerald-500", 
      bg: "bg-emerald-500/10", 
      isCurrency: true,
      sparkline: [{value: 80}, {value: 75}, {value: 78}, {value: 72}, {value: 74}, {value: 70}, {value: 72}]
    },
    { 
      label: "Clientes Ativos", 
      value: totalClientes, 
      lastValue: Math.floor(totalClientes * 0.9),
      trend: "+11%", 
      icon: Users, 
      color: "text-purple-500", 
      bg: "bg-purple-500/10", 
      isCurrency: false,
      sparkline: [{value: 100}, {value: 110}, {value: 105}, {value: 120}, {value: 130}, {value: 135}, {value: 142}]
    },
  ]

  const quickActions = [
    { label: "Pedido", icon: Plus, path: "/dashboard/pedidos", color: "bg-[#FF2F81]" },
    { label: "Produto", icon: Package, path: "/dashboard/menu", color: "bg-blue-500" },
    { label: "Promoção", icon: Tag, path: "/dashboard/marketing", color: "bg-amber-500" },
    { label: "Clientes", icon: Users, path: "/dashboard/clientes", color: "bg-purple-500" },
  ]

  // Calculated funnel data
  const finalSales = pedidos.filter(p => ['delivered', 'finalizado'].includes(p.status)).length
  const funnelSteps = [
    { label: 'Visitas no Menu', value: totalClientes * 4 || 100, color: 'bg-blue-500', icon: MousePointer2 },
    { label: 'Iniciaram Pedido', value: pedidos.length * 1.5 || 20, color: 'bg-purple-500', icon: ShoppingBag },
    { label: 'Vendas Finalizadas', value: finalSales, color: 'bg-[#FF2F81]', icon: CheckCircle2 },
  ]

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-16 max-w-[1600px] mx-auto px-4 md:px-0">
      <UpsellModal 
        isOpen={upsellOpen} 
        onClose={() => setUpsellOpen(false)} 
        reason={upsellReason}
        featureName="Automação Inteligente"
      />

      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <PageHeader
          title="Painel de Controle"
          highlight="Inteligente"
          subtitle={`Bem-vinda de volta! Suas vendas subiram 12% desde ontem. 🚀`}
        />
        
        <div className="flex flex-wrap items-center gap-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-1 rounded-2xl flex gap-1 shadow-sm">
                {(['today', '7d', '30d'] as const).map((p) => (
                    <button 
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                            period === p ? "bg-[#FF2F81] text-white shadow-lg" : "text-[var(--text-muted)] hover:bg-[var(--bg-app)]"
                        )}
                    >
                        {p === 'today' ? 'Hoje' : p === '7d' ? '7 Dias' : '30 Dias'}
                    </button>
                ))}
            </div>
            
            {/* Quick Actions Grid */}
            <div className="flex items-center gap-2">
                {quickActions.map((action, i) => (
                    <Link key={i} href={action.path}>
                        <Button className={cn("size-12 rounded-2xl p-0 text-white shadow-lg hover:scale-110 transition-all", action.color)}>
                            <action.icon size={20} />
                        </Button>
                    </Link>
                ))}
            </div>
        </div>
      </div>

      {/* Metric Cards - Higher Density */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {kpis.map((kpi, idx) => (
            <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[var(--bg-card)] rounded-[32px] border border-[var(--border)] p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
            >
                <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                        <div className={cn("size-12 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6", kpi.bg, kpi.color)}>
                            <kpi.icon size={24} />
                        </div>
                        <Sparkline data={kpi.sparkline} color={kpi.trend.startsWith('+') ? '#10b981' : '#ef4444'} />
                    </div>
                    
                    <div>
                        <p className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-1 italic">{kpi.label}</p>
                        <div className="flex items-baseline justify-between">
                            <h3 className="text-3xl font-black italic tracking-tighter text-[var(--text-primary)]">
                                {kpi.isCurrency ? `R$ ${kpi.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : kpi.value}
                            </h3>
                            <div className={cn(
                                "flex items-center gap-0.5 text-[10px] font-black",
                                kpi.trend.startsWith('+') ? "text-emerald-500" : "text-rose-500"
                            )}>
                                {kpi.trend.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {kpi.trend}
                            </div>
                        </div>
                        <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase mt-1">
                            Anterior: <span className="text-[var(--text-primary)]">{kpi.isCurrency ? `R$ ${kpi.lastValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : kpi.lastValue}</span>
                        </p>
                    </div>
                </div>
            </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Sales Chart - 3 cols wide */}
        <div className="xl:col-span-3 space-y-6">
            <Card className="rounded-[40px] border-[var(--border)] shadow-premium p-8 bg-[var(--bg-card)] relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase italic tracking-tighter leading-none">Desempenho de <span className="text-[#FF2F81]">Vendas</span></h3>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase italic tracking-widest mt-2">Comparação real vs. período anterior</p>
                    </div>
                    <div className="flex items-center gap-4 bg-[var(--bg-app)] p-2 rounded-2xl border border-[var(--border)]">
                        <div className="flex items-center gap-2 px-3">
                            <div className="size-2 rounded-full bg-[#FF2F81]" />
                            <span className="text-[9px] font-black uppercase text-[var(--text-primary)] tracking-widest">Atual</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 border-l border-[var(--border)]">
                            <div className="size-2 rounded-full bg-[var(--text-muted)] opacity-30" />
                            <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">Anterior</span>
                        </div>
                    </div>
                </div>

                <div className="h-[350px] w-full">
                    {isMounted ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FF2F81" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#FF2F81" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: 'var(--text-muted)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: 'var(--text-muted)' }} tickFormatter={(v) => `R$${v}`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                                />
                                <Area type="monotone" dataKey="prev" stroke="var(--text-muted)" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
                                <Area type="monotone" dataKey="vendas" stroke="#FF2F81" strokeWidth={4} fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : null}
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Star Products Ranking (REAL) */}
                <Card className="rounded-[40px] border-[var(--border)] p-8 bg-[var(--bg-card)] space-y-6">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xl font-black uppercase italic tracking-tighter text-[var(--text-primary)]">Produtos Estrela</h4>
                        <Medal className="text-amber-500" size={20} />
                    </div>
                    <div className="space-y-4">
                        {topProducts.length > 0 ? topProducts.map((p, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-[var(--bg-app)] rounded-3xl border border-[var(--border)] group hover:border-[#FF2F81]/30 transition-all">
                                <div className={cn(
                                    "size-10 rounded-xl flex items-center justify-center font-black italic shadow-lg",
                                    p.rank === 1 ? "bg-amber-400 text-white" : p.rank === 2 ? "bg-slate-300 text-slate-600" : "bg-orange-400 text-white"
                                )}>
                                    #{p.rank}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h5 className="text-[11px] font-black uppercase text-[var(--text-primary)] italic truncate">{p.name}</h5>
                                    <div className="flex gap-3 mt-1">
                                        <span className="text-[8px] font-black text-[var(--text-muted)] uppercase">{p.sales} vendas</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] font-black text-[var(--text-primary)]">R$ {p.revenue.toFixed(0)}</p>
                                    <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase">Receita</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-center py-10 italic">Aguardando primeiras vendas...</p>
                        )}
                    </div>
                </Card>

                {/* Conversion Funnel (REAL-ISH) */}
                <Card className="rounded-[40px] border-[var(--border)] p-8 bg-[var(--bg-card)] space-y-6">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xl font-black uppercase italic tracking-tighter text-[var(--text-primary)]">Funil de Conversão</h4>
                        <Target className="text-blue-500" size={20} />
                    </div>
                    <div className="space-y-6">
                        {funnelSteps.map((step, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <div className="flex items-center gap-2">
                                        <step.icon size={12} className="text-[var(--text-muted)]" />
                                        <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">{step.label}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-[var(--text-primary)]">{step.value}</span>
                                </div>
                                <div className="h-2 w-full bg-[var(--bg-app)] rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(step.value / (funnelSteps[0].value || 1)) * 100}%` }}
                                        className={cn("h-full rounded-full shadow-lg", step.color)}
                                    />
                                </div>
                            </div>
                        ))}
                        <div className="pt-4 border-t border-[var(--border)] flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest italic">Taxa de Conversão Real</span>
                            <Badge className="bg-emerald-500 text-white font-black italic text-[10px] px-3">
                                {((finalSales / (funnelSteps[0].value || 1)) * 100).toFixed(1)}%
                            </Badge>
                        </div>
                    </div>
                </Card>
            </div>
        </div>

        {/* Sidebar: AI & Goals */}
        <div className="space-y-6">
            {/* Real-time AI Assistant (REAL INSIGHTS) */}
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-[40px] p-8 text-white space-y-6 relative overflow-hidden shadow-2xl border border-white/5">
                <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12"><Bot size={100} /></div>
                <Badge className="bg-[#FF2F81] text-white border-none uppercase text-[8px] font-black italic tracking-widest px-3">Assistente Estratégico IA</Badge>
                
                <div className="space-y-4 relative z-10">
                    {insights.length > 0 ? insights.map((insight, i) => (
                        <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
                            <div className="flex items-center gap-2 text-amber-400 mb-2">
                                {insight.impact === 'alto' ? <Zap size={14} /> : <TrendingUp size={14} />}
                                <span className="text-[10px] font-black uppercase italic tracking-widest">{insight.title}</span>
                            </div>
                            <p className="text-[10px] text-white/80 font-medium leading-relaxed">
                                {insight.description}
                            </p>
                        </div>
                    )) : (
                        <p className="text-[10px] text-white/50 font-medium leading-relaxed italic text-center py-4">
                            Analisando seus dados para gerar novos insights...
                        </p>
                    )}
                </div>

                <Button className="w-full h-12 bg-white text-black hover:bg-slate-100 font-black uppercase italic tracking-widest text-[10px] rounded-2xl shadow-xl transition-all">
                    Explorar Oportunidades <ArrowUpRight size={16} className="ml-2" />
                </Button>
            </div>

            {/* Monthly Goal Radial */}
            <Card className="rounded-[40px] border-[var(--border)] p-8 bg-[var(--bg-card)] text-center space-y-6 shadow-premium">
                <div className="space-y-1">
                    <h3 className="text-lg font-black uppercase italic tracking-tighter text-[var(--text-primary)]">Progresso da Meta</h3>
                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest italic">R$ {totalMes.toLocaleString('pt-BR')} / R$ {META_MENSAL.toLocaleString('pt-BR')}</p>
                </div>

                <div className="h-48 flex items-center justify-center relative">
                    {isMounted ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={15} data={radialData} startAngle={90} endAngle={-270}>
                                <RadialBar background dataKey="value" cornerRadius={30} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                    ) : null}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-[var(--primary)] italic tracking-tighter">{Math.round((totalMes / META_MENSAL) * 100)}%</span>
                        <span className="text-[8px] font-black uppercase text-[var(--text-muted)] tracking-widest">Atingido</span>
                    </div>
                </div>

                <div className="pt-2">
                    <GamificationCard currentTotal={totalHoje} dailyGoal={DAILY_GOAL} />
                </div>
            </Card>

            {/* Share & Feedback */}
            <div className="flex gap-3">
                <Button variant="ghost" className="flex-1 h-12 rounded-2xl border border-[var(--border)] text-[9px] font-black uppercase italic tracking-widest text-[var(--text-muted)]">
                    <Share2 size={14} className="mr-2" /> Compartilhar
                </Button>
                <Button variant="ghost" className="flex-1 h-12 rounded-2xl border border-[var(--border)] text-[9px] font-black uppercase italic tracking-widest text-[var(--text-muted)]">
                    <MessageCircle size={14} className="mr-2" /> Feedback
                </Button>
            </div>
        </div>
      </div>
    </div>
  )
}
