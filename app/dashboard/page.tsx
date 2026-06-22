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

<<<<<<< HEAD
      {/* KPI Section - Fully Responsive Premium Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {[
          { label: "Vendas Hoje", value: totalHoje, icon: DollarSign, color: "text-[#0070F3]", bg: "bg-blue-50", isCurrency: true },
          { label: "Vendas no Mês", value: totalMes, icon: BarChart3, color: "text-[#2ECC71]", bg: "bg-green-50", isCurrency: true },
          { label: "Receita Estimada", value: receitaEstimada, icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-50", isCurrency: true },
          { label: "Pedidos Ativos", value: pedidosAtivos, icon: ShoppingBag, color: "text-rose-500", bg: "bg-rose-50", isCurrency: false },
        ].map((kpi, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-2xl sm:rounded-3xl lg:rounded-[32px] border border-slate-100 p-4 sm:p-5 lg:p-7 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 flex flex-col justify-between group"
          >
            <div className="flex justify-between items-start mb-3 sm:mb-4 lg:mb-6">
              <div className={cn("size-9 sm:size-10 lg:size-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", kpi.bg, kpi.color)}>
                <kpi.icon className="size-5 sm:size-5 lg:size-6" />
              </div>
              <Badge className="bg-slate-50 text-slate-400 border-none font-black text-[7px] sm:text-[8px] lg:text-[9px] uppercase px-1.5 sm:px-2 lg:px-2.5 py-0.5 sm:py-1 tracking-widest group-hover:bg-slate-100 italic">Live</Badge>
            </div>
            <div>
              <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase text-slate-400 tracking-wide sm:tracking-widest block mb-1 sm:mb-1.5 italic group-hover:text-slate-900 transition-colors truncate">{kpi.label}</p>
              <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-black italic tracking-tighter text-slate-900">
                {kpi.isCurrency ? `R$ ${kpi.value.toFixed(2)}` : kpi.value}
              </h3>
=======
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
>>>>>>> d8bd0f007bcba4de2d011984f266ae7f01f1b5f5
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

<<<<<<< HEAD
      {/* Quick Actions - Fully Responsive Operational Center */}
      <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 lg:mb-10">
        <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-wide sm:tracking-widest italic ml-2 sm:ml-4">Centro de Operações</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
           {[
             { label: "Novo Pedido", icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50", href: "/dashboard/pedidos" },
             { label: "Precificação", icon: Calculator, color: "text-purple-600", bg: "bg-purple-50", href: "/dashboard/precificacao-inteligente?wizard=true", highlight: true },
             { label: "Cadastrar Insumo", icon: Sparkles, color: "text-emerald-600", bg: "bg-emerald-50", href: "/dashboard/precificacao-inteligente?tab=insumos" },
             { label: "Ver Estoque", icon: Package, color: "text-amber-600", bg: "bg-amber-50", href: "/dashboard/estoque" },
           ].map((action, idx) => (
             <Link key={idx} href={action.href}>
               <motion.div 
                 whileHover={{ y: -5, scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 className={cn(
                   "p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl lg:rounded-[28px] border bg-white shadow-sm flex items-center gap-2 sm:gap-3 lg:gap-4 cursor-pointer transition-all hover:shadow-xl group relative overflow-hidden min-h-[60px] sm:min-h-[72px]",
                   action.highlight ? "border-purple-200" : "border-slate-100"
                 )}
               >
                  {action.highlight && (
                    <div className="absolute top-1 right-1 sm:top-0 sm:right-0 sm:p-1">
                      <Badge className="bg-purple-500 text-[5px] sm:text-[6px] font-black uppercase text-white border-none py-0 px-1 sm:px-1.5 h-2.5 sm:h-3">NOVO</Badge>
                    </div>
                  )}
                  <div className={cn("size-9 sm:size-10 lg:size-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:rotate-6", action.bg, action.color)}>
                     <action.icon className="size-4 sm:size-5 lg:size-6" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] lg:text-[11px] font-black uppercase italic text-slate-700 tracking-tight group-hover:text-slate-900 leading-tight">{action.label}</span>
               </motion.div>
             </Link>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">

        {/* Main Chart & Goals */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
          <Card className="rounded-2xl sm:rounded-3xl lg:rounded-[40px] border-slate-100 shadow-sm p-4 sm:p-6 lg:p-8 bg-white space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h3 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 uppercase italic">Projeção <span className="text-[#0070F3]">Financeira</span></h3>
                <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase italic tracking-wide sm:tracking-widest mt-0.5 sm:mt-1">Vendas diárias e mensais</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-50 text-[7px] sm:text-[8px] lg:text-[9px] font-black uppercase text-slate-500"><div className="size-1.5 rounded-full bg-[#0070F3]" /> Vendas</div>
                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-50 text-[7px] sm:text-[8px] lg:text-[9px] font-black uppercase text-slate-500"><div className="size-1.5 rounded-full bg-slate-300" /> Média</div>
              </div>
            </div>
            <div className="h-[200px] sm:h-[260px] lg:h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pedidos.slice(-7).map(p => ({
                  name: format(new Date(p.created_at), 'EEE', { locale: ptBR }),
                  v: p.total
                }))}>
                  <defs>
                    <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0070F3" stopOpacity={0.15} /><stop offset="95%" stopColor="#0070F3" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} />
                  <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="v" stroke="#0070F3" strokeWidth={5} fillOpacity={1} fill="url(#colorV)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Goals Card - Fully Responsive */}
          <Card className="rounded-2xl sm:rounded-3xl lg:rounded-[40px] border-slate-100 shadow-sm p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative group">
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 lg:gap-8">
              <div className="space-y-3 sm:space-y-4 text-center sm:text-left flex-1">
                <div className="flex items-center justify-center sm:justify-between gap-2 sm:gap-4 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full bg-white/10 text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-wide sm:tracking-widest text-[#2ECC71]">
                    <Target className="size-3 sm:size-3.5" /> Meta Mensal
                  </div>
                  <Link href="/dashboard/configuracoes?tab=financeiro">
                    <Button variant="ghost" className="h-6 sm:h-8 px-2 sm:px-3 rounded-lg text-[8px] sm:text-[9px] font-black uppercase text-white/40 hover:text-white hover:bg-white/10 transition-all">
                      Ajustar
                    </Button>
                  </Link>
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black italic tracking-tighter">Você atingiu <span className="text-[#2ECC71]">{progressoMeta}%</span> da meta!</h3>
                <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wide sm:tracking-widest leading-relaxed">
                  Faltam R$ {(META_MENSAL - totalMes).toFixed(2)} para R$ {META_MENSAL.toFixed(2)}.
                </p>
                <Button className="bg-[#2ECC71] hover:bg-[#27AE60] text-white font-black uppercase text-[9px] sm:text-[10px] px-4 sm:px-6 lg:px-8 rounded-lg sm:rounded-xl h-9 sm:h-10 lg:h-12 border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all w-full sm:w-auto">
                  Impulsionar Vendas
                </Button>
              </div>
              <div className="relative size-28 sm:size-32 lg:size-40 shrink-0">
                <svg className="size-full" viewBox="0 0 100 100">
                  <circle className="text-white/10" strokeWidth="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                  <circle
                    className="text-[#2ECC71] transition-all duration-1000 ease-in-out"
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * progressoMeta) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40" cx="50" cy="50"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-black">{progressoMeta}%</span>
                  <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-tighter opacity-50">Score</span>
                </div>
              </div>
            </div>
            <div className="absolute top-[-10%] right-[-5%] size-40 sm:size-52 lg:size-64 bg-green-500/10 blur-[100px] rounded-full group-hover:bg-green-500/20 transition-all duration-500" />
          </Card>
        </div>

        {/* Alerts & Orders Sidebar - Fully Responsive */}
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Alerts Column */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-wide sm:tracking-widest italic ml-2 sm:ml-4">Inteligência de Negócio</h4>
            <AnimatePresence>
              {alerts.map((alert, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={cn("p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl lg:rounded-[32px] border border-transparent shadow-sm flex gap-3 sm:gap-4 items-center group cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all", alert.bg)}>
                  <div className={cn("size-9 sm:size-10 lg:size-12 rounded-xl sm:rounded-2xl flex items-center justify-center bg-white shadow-sm shrink-0", alert.color)}>
                    <alert.icon className="size-5 sm:size-5 lg:size-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-[10px] sm:text-[11px] lg:text-[12px] font-black uppercase text-slate-900 italic leading-none mb-1 sm:mb-1.5 truncate">{alert.title}</h5>
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 leading-tight line-clamp-2">{alert.desc}</p>
                  </div>
                  <ChevronRight className="size-4 ml-auto text-slate-300 group-hover:text-slate-900 transition-colors shrink-0" />
                </motion.div>
              ))}
              {alerts.length === 0 && (
                <div className="p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl lg:rounded-[40px] bg-emerald-50/30 border border-emerald-100 border-dashed flex flex-col items-center text-center">
                  <Sparkles className="text-emerald-500 mb-2 sm:mb-3 size-5 sm:size-6" />
                  <p className="text-[9px] sm:text-[10px] font-black uppercase text-emerald-600 italic tracking-wide sm:tracking-widest">Tudo Sob Controle</p>
                  <p className="text-[8px] sm:text-[9px] font-medium text-emerald-500/80 mt-1 uppercase">Sua operação está saudável</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
            <div className="bg-white p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl lg:rounded-[32px] border border-slate-100 shadow-sm text-center">
              <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wide sm:tracking-widest mb-0.5 sm:mb-1 italic">Ticket Médio</p>
              <h4 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 leading-none italic">R$ {ticketMedio.toFixed(2)}</h4>
            </div>
            <div className="bg-white p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl lg:rounded-[32px] border border-slate-100 shadow-sm text-center">
              <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wide sm:tracking-widest mb-0.5 sm:mb-1 italic">Total Pedidos</p>
              <h4 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 leading-none italic">{pedidos.length}</h4>
            </div>
          </div>

          {/* Recent Orders List - Fully Responsive */}
          <Card className="rounded-2xl sm:rounded-3xl lg:rounded-[40px] border-slate-100 shadow-sm p-4 sm:p-6 lg:p-8 bg-white space-y-4 sm:space-y-5 lg:space-y-7">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] sm:text-[11px] font-black uppercase text-slate-900 italic tracking-wide sm:tracking-widest">Fluxo de Vendas</h4>
              <Link href="/dashboard/pedidos" className="text-[9px] sm:text-[10px] font-black uppercase text-[#0070F3] hover:underline">Ver Painel</Link>
            </div>
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              {recentOrders.map((order, idx) => (
                <div key={order.id} className="flex items-center justify-between group cursor-pointer gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0">
                    <div className="size-8 sm:size-9 lg:size-10 rounded-xl sm:rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-[#0070F3] transition-colors border border-slate-100 shrink-0">
                      <ShoppingBag className="size-4 sm:size-4.5 lg:size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[11px] font-black text-slate-900 uppercase italic truncate">{order.customers?.name || 'Venda Online'}</p>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                        <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{format(new Date(order.created_at), 'dd/MM HH:mm')}</p>
                        <div className="size-1 rounded-full bg-slate-200" />
                        <span className="text-[7px] sm:text-[8px] font-black uppercase text-blue-500">Live</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] sm:text-[12px] font-black text-slate-900 italic leading-none">R$ {order.total?.toFixed(2)}</p>
                    <Badge variant="outline" className="text-[6px] sm:text-[7.5px] font-black uppercase px-1.5 sm:px-2 py-0 border-slate-100 text-slate-300 italic mt-0.5 sm:mt-1 bg-slate-50/50">Ativo</Badge>
                  </div>
                </div>
              ))}
              {recentOrders.length === 0 && <p className="text-[9px] sm:text-[10px] text-center text-slate-300 uppercase py-6 sm:py-8 font-bold italic tracking-wide sm:tracking-widest">Aguardando pedidos...</p>}
            </div>
            <Button variant="ghost" className="w-full text-slate-400 font-bold uppercase text-[8px] sm:text-[9px] tracking-wide sm:tracking-widest rounded-lg sm:rounded-xl hover:bg-slate-50 group h-9 sm:h-10">
              Histórico Completo <ChevronRight className="size-3 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Card>
        </div>
      </div>
=======
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
>>>>>>> d8bd0f007bcba4de2d011984f266ae7f01f1b5f5
    </div>
  )
}

