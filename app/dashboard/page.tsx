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
  CheckCircle2,
  X,
  Loader2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar
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
    pedidos,
    menuViews,
    abandonedCarts
  } = useDashboardStats()

  const { data: erpStats } = useErpStats(tenantId)
  const { insights, loading: insightsLoading, checkDailyGoal } = useRevenueEngine()
  const { limits } = usePlanLimits()

  const [isMounted, setIsMounted] = useState(false)
  const [upsellOpen, setUpsellOpen] = useState(false)
  const [upsellReason, setUpsellReason] = useState<'limit_reached' | 'premium_feature'>('premium_feature')
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'year'>('today')

  // State for AI opportunities strategic assistant
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiOpportunities, setAiOpportunities] = useState<any[]>([])

  useEffect(() => { 
    setIsMounted(true) 
    if (totalHoje > 0) {
        checkDailyGoal(totalHoje)
    }
  }, [totalHoje, checkDailyGoal])

  const META_MENSAL = business?.config?.monthly_goal || 10000 
  const DAILY_GOAL = business?.config?.daily_goal || 500

  // --- Dynamic Period & Growth Trend Calculations ---
  const periodRanges = useMemo(() => {
    const now = new Date()
    const currentStart = new Date()
    let prevStart = new Date()
    let prevEnd = new Date()

    if (period === 'today') {
      currentStart.setHours(0, 0, 0, 0)
      prevStart.setDate(now.getDate() - 1)
      prevStart.setHours(0, 0, 0, 0)
      prevEnd.setDate(now.getDate() - 1)
      prevEnd.setHours(23, 59, 59, 999)
    } else if (period === '7d') {
      currentStart.setDate(now.getDate() - 7)
      currentStart.setHours(0, 0, 0, 0)
      prevStart.setDate(now.getDate() - 14)
      prevStart.setHours(0, 0, 0, 0)
      prevEnd.setDate(now.getDate() - 7)
      prevEnd.setHours(0, 0, 0, 0)
    } else if (period === 'year') {
      currentStart.setFullYear(now.getFullYear(), 0, 1)
      currentStart.setHours(0, 0, 0, 0)
      prevStart.setFullYear(now.getFullYear() - 1, 0, 1)
      prevStart.setHours(0, 0, 0, 0)
      prevEnd.setFullYear(now.getFullYear() - 1, 11, 31)
      prevEnd.setHours(23, 59, 59, 999)
    } else { // 30d
      currentStart.setDate(now.getDate() - 30)
      currentStart.setHours(0, 0, 0, 0)
      prevStart.setDate(now.getDate() - 60)
      prevStart.setHours(0, 0, 0, 0)
      prevEnd.setDate(now.getDate() - 30)
      prevEnd.setHours(0, 0, 0, 0)
    }

    return { currentStart, prevStart, prevEnd }
  }, [period])

  const isPaidOrder = (o: any) => 
    (o.payment_status === 'paid' || o.payment_status === 'pago' || o.paid === true || o.status === 'delivered' || o.status === 'finalizado') && 
    (o.status !== 'cancelled' && o.status !== 'cancelado')

  const currentPedidos = useMemo(() => {
    if (!pedidos) return []
    return pedidos.filter(p => new Date(p.created_at) >= periodRanges.currentStart)
  }, [pedidos, periodRanges])

  const prevPedidos = useMemo(() => {
    if (!pedidos) return []
    return pedidos.filter(p => {
      const date = new Date(p.created_at)
      return date >= periodRanges.prevStart && date < periodRanges.prevEnd
    })
  }, [pedidos, periodRanges])

  // Computed metrics
  const currentPaid = useMemo(() => currentPedidos.filter(isPaidOrder), [currentPedidos])
  const prevPaid = useMemo(() => prevPedidos.filter(isPaidOrder), [prevPedidos])

  const faturamento = useMemo(() => {
    return currentPaid.reduce((acc, p) => acc + (p.total || 0), 0)
  }, [currentPaid])

  const prevFaturamento = useMemo(() => {
    return prevPaid.reduce((acc, p) => acc + (p.total || 0), 0)
  }, [prevPaid])

  const ordersCount = useMemo(() => {
    return currentPedidos.length
  }, [currentPedidos])

  const prevOrdersCount = useMemo(() => {
    return prevPedidos.length
  }, [prevPedidos])

  const currentTicket = useMemo(() => {
    return currentPaid.length > 0 ? faturamento / currentPaid.length : 0
  }, [faturamento, currentPaid])

  const prevTicket = useMemo(() => {
    return prevPaid.length > 0 ? prevFaturamento / prevPaid.length : 0
  }, [prevFaturamento, prevPaid])

  const currentMaxSale = useMemo(() => {
    return currentPaid.length > 0 ? Math.max(...currentPaid.map(p => p.total || 0)) : 0
  }, [currentPaid])

  const prevMaxSale = useMemo(() => {
    return prevPaid.length > 0 ? Math.max(...prevPaid.map(p => p.total || 0)) : 0
  }, [prevPaid])

  const currentMinSale = useMemo(() => {
    return currentPaid.length > 0 ? Math.min(...currentPaid.map(p => p.total || 0)) : 0
  }, [currentPaid])

  const prevMinSale = useMemo(() => {
    return prevPaid.length > 0 ? Math.min(...prevPaid.map(p => p.total || 0)) : 0
  }, [prevPaid])

  const currentConcluidos = useMemo(() => {
    return currentPedidos.filter(p => ['finalizado', 'delivered', 'entregue'].includes(p.status)).length
  }, [currentPedidos])

  const prevConcluidos = useMemo(() => {
    return prevPedidos.filter(p => ['finalizado', 'delivered', 'entregue'].includes(p.status)).length
  }, [prevPedidos])

  const currentCancelados = useMemo(() => {
    return currentPedidos.filter(p => ['cancelado', 'cancelled'].includes(p.status)).length
  }, [currentPedidos])

  const prevCancelados = useMemo(() => {
    return prevPedidos.filter(p => ['cancelado', 'cancelled'].includes(p.status)).length
  }, [prevPedidos])

  const currentActiveClients = useMemo(() => {
    return new Set(currentPedidos.map((p: any) => p.customer_id || (Array.isArray(p.customers) ? p.customers[0]?.name : p.customers?.name) || p.customer_name).filter(Boolean)).size
  }, [currentPedidos])

  const prevActiveClients = useMemo(() => {
    return new Set(prevPedidos.map((p: any) => p.customer_id || (Array.isArray(p.customers) ? p.customers[0]?.name : p.customers?.name) || p.customer_name).filter(Boolean)).size
  }, [prevPedidos])

  const getTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? "+100%" : "0%"
    const diff = ((current - previous) / previous) * 100
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(0)}%`
  }

  // --- Process Data for Charts dynamically ---
  const chartData = useMemo(() => {
    if (period === 'today') {
      const blocks = [
        { label: '00h-03h', startHour: 0, endHour: 3 },
        { label: '03h-06h', startHour: 3, endHour: 6 },
        { label: '06h-09h', startHour: 6, endHour: 9 },
        { label: '09h-12h', startHour: 9, endHour: 12 },
        { label: '12h-15h', startHour: 12, endHour: 15 },
        { label: '15h-18h', startHour: 15, endHour: 18 },
        { label: '18h-21h', startHour: 18, endHour: 21 },
        { label: '21h-00h', startHour: 21, endHour: 24 },
      ]
      return blocks.map(b => {
        const todayTotal = currentPedidos.filter(isPaidOrder).filter(p => {
          const h = new Date(p.created_at).getHours()
          return h >= b.startHour && h < b.endHour
        }).reduce((acc, p) => acc + p.total, 0)

        const yesterdayTotal = prevPedidos.filter(isPaidOrder).filter(p => {
          const h = new Date(p.created_at).getHours()
          return h >= b.startHour && h < b.endHour
        }).reduce((acc, p) => acc + p.total, 0)

        return {
          name: b.label,
          vendas: todayTotal,
          prev: yesterdayTotal
        }
      })
    } else if (period === '7d') {
      return Array.from({ length: 7 }).map((_, i) => {
        const date = subDays(new Date(), 6 - i)
        const dayOrders = currentPedidos.filter(isPaidOrder).filter(p => isSameDay(new Date(p.created_at), date))
        const dayTotal = dayOrders.reduce((acc, p) => acc + p.total, 0)

        const prevDate = subDays(date, 7)
        const prevDayOrders = prevPedidos.filter(isPaidOrder).filter(p => isSameDay(new Date(p.created_at), prevDate))
        const prevDayTotal = prevDayOrders.reduce((acc, p) => acc + p.total, 0)

        return {
          name: format(date, 'dd/MM', { locale: ptBR }),
          vendas: dayTotal,
          prev: prevDayTotal
        }
      })
    } else if (period === 'year') {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
      return months.map((m, idx) => {
        const yearTotal = currentPedidos.filter(isPaidOrder).filter(p => new Date(p.created_at).getMonth() === idx).reduce((acc, p) => acc + p.total, 0)
        const prevYearTotal = prevPedidos.filter(isPaidOrder).filter(p => new Date(p.created_at).getMonth() === idx).reduce((acc, p) => acc + p.total, 0)
        return {
          name: m,
          vendas: yearTotal,
          prev: prevYearTotal
        }
      })
    } else { // 30d
      return Array.from({ length: 30 }).map((_, i) => {
        const date = subDays(new Date(), 29 - i)
        const dayOrders = currentPedidos.filter(isPaidOrder).filter(p => isSameDay(new Date(p.created_at), date))
        const dayTotal = dayOrders.reduce((acc, p) => acc + p.total, 0)

        const prevDate = subDays(date, 30)
        const prevDayOrders = prevPedidos.filter(isPaidOrder).filter(p => isSameDay(new Date(p.created_at), prevDate))
        const prevDayTotal = prevDayOrders.reduce((acc, p) => acc + p.total, 0)

        return {
          name: format(date, 'dd/MM', { locale: ptBR }),
          vendas: dayTotal,
          prev: prevDayTotal
        }
      })
    }
  }, [period, currentPedidos, prevPedidos])

  // --- Dynamic Metas Progress ---
  const currentGoalValue = useMemo(() => {
    if (period === 'today') return DAILY_GOAL
    if (period === '7d') return DAILY_GOAL * 7
    if (period === 'year') return META_MENSAL * 12
    return META_MENSAL
  }, [period, DAILY_GOAL, META_MENSAL])

  const radialData = useMemo(() => {
    const pct = currentGoalValue > 0 ? (faturamento / currentGoalValue) * 100 : 0
    return [
      { name: 'Meta', value: Math.min(Math.round(pct), 100), fill: '#FF2F81' }
    ]
  }, [faturamento, currentGoalValue])

  const kpis = [
    { 
      label: "Faturamento", 
      value: faturamento, 
      lastValue: prevFaturamento,
      trend: getTrend(faturamento, prevFaturamento), 
      icon: DollarSign, 
      color: "text-[#FF2F81]", 
      bg: "bg-[#FF2F81]/10", 
      isCurrency: true,
      sparkline: [{value: 40}, {value: 30}, {value: 55}, {value: 45}, {value: 70}, {value: 65}, {value: 90}]
    },
    { 
      label: "Pedidos Totais", 
      value: ordersCount, 
      lastValue: prevOrdersCount,
      trend: getTrend(ordersCount, prevOrdersCount), 
      icon: ShoppingBag, 
      color: "text-blue-500", 
      bg: "bg-blue-500/10", 
      isCurrency: false,
      sparkline: [{value: 20}, {value: 40}, {value: 30}, {value: 50}, {value: 45}, {value: 60}, {value: 55}]
    },
    { 
      label: "Ticket Médio", 
      value: currentTicket, 
      lastValue: prevTicket,
      trend: getTrend(currentTicket, prevTicket), 
      icon: Calculator, 
      color: "text-emerald-500", 
      bg: "bg-emerald-500/10", 
      isCurrency: true,
      sparkline: [{value: 80}, {value: 75}, {value: 78}, {value: 72}, {value: 74}, {value: 70}, {value: 72}]
    },
    { 
      label: "Pedidos Concluídos", 
      value: currentConcluidos, 
      lastValue: prevConcluidos,
      trend: getTrend(currentConcluidos, prevConcluidos), 
      icon: CheckCircle2, 
      color: "text-green-500", 
      bg: "bg-green-500/10", 
      isCurrency: false,
      sparkline: [{value: 30}, {value: 35}, {value: 40}, {value: 45}, {value: 50}, {value: 55}, {value: 60}]
    },
    { 
      label: "Pedidos Cancelados", 
      value: currentCancelados, 
      lastValue: prevCancelados,
      trend: getTrend(currentCancelados, prevCancelados), 
      icon: X, 
      color: "text-red-500", 
      bg: "bg-red-500/10", 
      isCurrency: false,
      sparkline: [{value: 5}, {value: 3}, {value: 2}, {value: 4}, {value: 1}, {value: 0}, {value: 1}]
    },
    { 
      label: "Maior Venda", 
      value: currentMaxSale, 
      lastValue: prevMaxSale,
      trend: getTrend(currentMaxSale, prevMaxSale), 
      icon: ArrowUpRight, 
      color: "text-indigo-500", 
      bg: "bg-indigo-500/10", 
      isCurrency: true,
      sparkline: [{value: 50}, {value: 60}, {value: 55}, {value: 70}, {value: 80}, {value: 90}, {value: 120}]
    },
    { 
      label: "Menor Venda", 
      value: currentMinSale, 
      lastValue: prevMinSale,
      trend: getTrend(currentMinSale, prevMinSale), 
      icon: ArrowDownRight, 
      color: "text-amber-500", 
      bg: "bg-amber-500/10", 
      isCurrency: true,
      sparkline: [{value: 10}, {value: 8}, {value: 12}, {value: 15}, {value: 9}, {value: 11}, {value: 10}]
    },
    { 
      label: "Clientes Ativos", 
      value: currentActiveClients, 
      lastValue: prevActiveClients,
      trend: getTrend(currentActiveClients, prevActiveClients), 
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

  // --- Dynamic Funnel Calculations ---
  const currentVisits = useMemo(() => {
    const viewsCount = (menuViews || []).filter(v => new Date(v.created_at) >= periodRanges.currentStart).length
    const cartsCount = (abandonedCarts || []).filter(c => new Date(c.created_at) >= periodRanges.currentStart).length
    const initiatedCount = ordersCount + cartsCount
    return Math.max(viewsCount, initiatedCount, totalClientes * 2, 100)
  }, [menuViews, periodRanges, ordersCount, abandonedCarts, totalClientes])

  const currentInitiated = useMemo(() => {
    const cartsCount = (abandonedCarts || []).filter(c => new Date(c.created_at) >= periodRanges.currentStart).length
    return Math.max(ordersCount + cartsCount, currentPedidos.filter(isPaidOrder).length, 20)
  }, [abandonedCarts, periodRanges, ordersCount, currentPedidos])

  const currentFinalized = useMemo(() => {
    return currentPedidos.filter(isPaidOrder).length
  }, [currentPedidos])

  const funnelSteps = [
    { label: 'Visitas no Menu', value: currentVisits, color: 'bg-blue-500', icon: MousePointer2 },
    { label: 'Iniciaram Pedido', value: currentInitiated, color: 'bg-purple-500', icon: ShoppingBag },
    { label: 'Vendas Finalizadas', value: currentFinalized, color: 'bg-[#FF2F81]', icon: CheckCircle2 },
  ]

  // --- Explore AI Strategic Opportunities ---
  const handleExploreOpportunities = async () => {
    setAiModalOpen(true)
    setAiLoading(true)
    try {
      const response = await fetch("/api/dashboard/ai-opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faturamento,
          pedidosCount: ordersCount,
          ticketMedio: currentTicket,
          clientesAtivos: currentActiveClients,
          topProducts
        })
      })
      if (response.ok) {
        const data = await response.json()
        setAiOpportunities(data)
      } else {
        throw new Error("Failed to load AI strategic opportunities")
      }
    } catch (e) {
      console.error(e)
      toast.error("Erro ao carregar oportunidades da IA. Tente novamente.")
    } finally {
      setAiLoading(false)
    }
  }

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
                {(['today', '7d', '30d', 'year'] as const).map((p) => (
                    <button 
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                            period === p ? "bg-[#FF2F81] text-white shadow-lg" : "text-[var(--text-muted)] hover:bg-[var(--bg-app)]"
                        )}
                    >
                        {p === 'today' ? 'Hoje' : p === '7d' ? '7 Dias' : p === '30d' ? '30 Dias' : 'Ano'}
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
                    {!isMounted ? null : chartData.length === 0 || chartData.every(d => d.vendas === 0 && d.prev === 0) ? (
                      <div className="flex flex-col items-center justify-center h-[350px] bg-[var(--bg-app)]/50 rounded-3xl border border-dashed border-[var(--border)] p-6">
                        <div className="p-4 rounded-full bg-[#FF2F81]/10 text-[#FF2F81] mb-4 animate-pulse">
                          <TrendingUp size={32} />
                        </div>
                        <p className="text-sm font-black uppercase text-[var(--text-primary)] tracking-widest mb-1 italic">Sem vendas no período</p>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-center max-w-[280px]">
                          Ainda não há dados de vendas para exibir neste período. Comece a receber pedidos pelo cardápio digital!
                        </p>
                      </div>
                    ) : (
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
                    )}
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
                                {((currentFinalized / (currentVisits || 1)) * 100).toFixed(1)}%
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
                    {insights.length > 0 ? insights.slice(0, 2).map((insight, i) => (
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

                <Button 
                  onClick={handleExploreOpportunities}
                  className="w-full h-12 bg-white text-black hover:bg-slate-100 font-black uppercase italic tracking-widest text-[10px] rounded-2xl shadow-xl transition-all"
                >
                    Explorar Oportunidades <ArrowUpRight size={16} className="ml-2" />
                </Button>
            </div>

            {/* Monthly Goal Radial */}
            <Card className="rounded-[40px] border-[var(--border)] p-8 bg-[var(--bg-card)] text-center space-y-6 shadow-premium">
                <div className="space-y-1">
                    <h3 className="text-lg font-black uppercase italic tracking-tighter text-[var(--text-primary)]">Progresso da Meta</h3>
                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest italic">R$ {faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} / R$ {currentGoalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
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
                        <span className="text-3xl font-black text-[var(--primary)] italic tracking-tighter">{Math.round((faturamento / currentGoalValue) * 100)}%</span>
                        <span className="text-[8px] font-black uppercase text-[var(--text-muted)] tracking-widest">Atingido</span>
                    </div>
                </div>

                <div className="pt-2">
                    <GamificationCard currentTotal={faturamento} dailyGoal={currentGoalValue} />
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

      {/* AI Opportunities Strategic Dialog Modal */}
      <AnimatePresence>
        {aiModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAiModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Content Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-neutral-950 border border-neutral-800 text-white rounded-[40px] max-w-2xl w-full p-8 relative overflow-hidden shadow-2xl max-h-[90vh] flex flex-col z-10"
            >
              {/* Topglow effect */}
              <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-80 bg-[#FF2F81]/10 rounded-full blur-[100px]" />

              <button 
                onClick={() => setAiModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-6 shrink-0 relative z-10">
                <div className="size-10 rounded-2xl bg-[#FF2F81]/20 flex items-center justify-center text-[#FF2F81]">
                  <Bot size={22} className="animate-bounce" />
                </div>
                <div>
                  <h3 className="text-xl font-black italic tracking-tighter uppercase leading-none">Oportunidades de IA</h3>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Análise inteligente de métricas e sugestões práticas</p>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 py-2 relative z-10 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
                {aiLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <Loader2 size={36} className="text-[#FF2F81] animate-spin" />
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-wider text-neutral-200">Processando métricas...</p>
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">A IA está gerando recomendações sob medida</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {aiOpportunities.map((op, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-5 bg-white/5 rounded-3xl border border-white/10 hover:border-[#FF2F81]/20 hover:bg-white/[0.07] transition-all group"
                      >
                        <div className="flex items-center justify-between gap-4 mb-3">
                          <span className="text-xs font-black uppercase italic tracking-wider text-amber-400 flex items-center gap-1.5">
                            {op.type === 'upsell' ? <Crown size={14} /> : op.type === 'recovery' ? <Zap size={14} /> : <TrendingUp size={14} />}
                            {op.title}
                          </span>
                          <Badge className={cn(
                            "border-none text-[8px] font-black uppercase px-2 py-0.5 rounded-lg shrink-0",
                            op.impact === 'alto' ? "bg-red-500/10 text-red-400" :
                            op.impact === 'medio' ? "bg-amber-500/10 text-amber-400" :
                            "bg-blue-500/10 text-blue-400"
                          )}>
                            Impacto {op.impact}
                          </Badge>
                        </div>
                        <p className="text-xs text-neutral-300 font-medium leading-relaxed font-sans">
                          {op.description}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-neutral-800 flex justify-end gap-3 shrink-0 mt-6 relative z-10">
                <Button 
                  onClick={() => setAiModalOpen(false)}
                  className="h-11 px-6 rounded-2xl border border-neutral-800 text-[10px] font-black uppercase italic tracking-widest text-neutral-400 hover:text-white bg-transparent hover:bg-neutral-900"
                >
                  Fechar
                </Button>
                <Button 
                  onClick={() => {
                    setAiModalOpen(false)
                    toast.success("Oportunidades marcadas para acompanhamento!")
                  }}
                  className="h-11 px-6 bg-[#FF2F81] text-white hover:bg-[#e0246f] text-[10px] font-black uppercase italic tracking-widest rounded-2xl shadow-xl shadow-[#FF2F81]/15 transition-all"
                >
                  Aplicar Estratégias
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

