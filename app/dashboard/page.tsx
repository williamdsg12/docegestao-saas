"use client"

import Link from "next/link"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Users,
  ClipboardList,
  ArrowRight,
  Calendar,
  Wallet,
  Package,
} from "lucide-react"
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useBusiness } from "@/hooks/useBusiness"
import { format, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function DashboardPage() {
  const { user } = useAuth()
  const { profile, loadingBusiness } = useBusiness()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    receitas: 0,
    clientes: 0,
    orcamentos: 0,
    pedidos: 0
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const topProducts = [
    { name: "Bolo de Cenoura", sales: 120 },
    { name: "Brigadeiro Gourmet", sales: 450 },
    { name: "Brownie de Nutella", sales: 300 },
    { name: "Torta de Limão", sales: 180 },
    { name: "Cupcake Rosa", sales: 250 },
  ]

  const orderStatus = [
    { name: "Pendente", value: 40, color: "#f59e0b" },
    { name: "Em Produção", value: 30, color: "#3b82f6" },
    { name: "Concluído", value: 20, color: "#10b981" },
    { name: "Cancelado", value: 10, color: "#ef4444" },
  ]

  useEffect(() => {
    async function fetchDashboardData() {
      if (!profile?.company_id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // 1. Refresh & Fetch KPIs from cached table
        await supabase.rpc('refresh_dashboard_stats', { p_company_id: profile.company_id })

        const [statsRes, ordersRes, transactionsRes] = await Promise.all([
          supabase.from('dashboard_stats')
            .select('metric_name, metric_value')
            .eq('company_id', profile.company_id)
            .eq('reference_date', format(new Date(), 'yyyy-MM-dd')),
          supabase.from('orders')
            .select('total_value, created_at')
            .eq('company_id', profile.company_id),
          supabase.from('transactions')
            .select('amount, created_at, type')
            .eq('company_id', profile.company_id)
        ])

        const statsData = statsRes.data || []
        const getMetric = (name: string) => statsData.find(s => s.metric_name === name)?.metric_value || 0

        setStats({
          receitas: getMetric('revenue_month'),
          clientes: getMetric('total_clients'),
          orcamentos: 0,
          pedidos: getMetric('orders_month')
        })

        // 2. Fetch Recent Orders
        const { data: upcomingOrders } = await supabase
          .from('orders')
          .select('*, clients(name)')
          .eq('company_id', profile.company_id)
          .gte('delivery_date', new Date().toISOString())
          .order('delivery_date', { ascending: true })
          .limit(5)

        setRecentOrders(upcomingOrders || [])

        // 3. Prepare Chart Data (Last 7 Days - will simulate 30 later if needed)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(new Date(), 6 - i)
          return {
            name: format(date, 'eee', { locale: ptBR }),
            dateStr: format(date, 'yyyy-MM-dd'),
            vendas: 0,
            gastos: 0
          }
        })

        ordersRes.data?.forEach(order => {
          const orderDate = format(new Date(order.created_at), 'yyyy-MM-dd')
          const day = last7Days.find(d => d.dateStr === orderDate)
          if (day) day.vendas += (order.total_value || 0)
        })

        transactionsRes.data?.forEach(t => {
          const tDate = format(new Date(t.created_at), 'yyyy-MM-dd')
          const day = last7Days.find(d => d.dateStr === tDate)
          if (day && t.type === 'expense') day.gastos += (t.amount || 0)
        })

        setChartData(last7Days)

      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (profile) fetchDashboardData()
  }, [profile])

  const kpis = [
    {
      title: "Faturamento",
      value: `R$ ${stats.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      link: "/dashboard/financeiro",
      icon: DollarSign,
      trend: "+12.5%",
      trendColor: "text-emerald-500",
      description: "Este mês",
      bg: "bg-emerald-500",
      lightBg: "bg-emerald-50"
    },
    {
      title: "Pedidos",
      value: stats.pedidos.toString(),
      link: "/dashboard/pedidos",
      icon: ShoppingBag,
      trend: "+8%",
      trendColor: "text-rose-500",
      description: "Últimos 7 dias",
      bg: "bg-rose-500",
      lightBg: "bg-rose-50"
    },
    {
      title: "Clientes",
      value: stats.clientes.toString(),
      link: "/dashboard/clientes",
      icon: Users,
      trend: "+15%",
      trendColor: "text-indigo-500",
      description: "Base ativa",
      bg: "bg-indigo-500",
      lightBg: "bg-indigo-50"
    },
    {
      title: "Orçamentos",
      value: stats.orcamentos.toString(),
      link: "/dashboard/orcamentos",
      icon: ClipboardList,
      trend: "-2%",
      trendColor: "text-amber-500",
      description: "Conversão: 65%",
      bg: "bg-amber-500",
    },
  ]

  if (loadingBusiness || loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-8">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            className="group"
          >
            <Card className="border-none shadow-[var(--shadow-card)] rounded-[32px] overflow-hidden bg-[var(--bg-card)] border border-[var(--border)] transition-all duration-300">
              <CardContent className="p-8 relative">
                <div className="flex justify-between items-start mb-6">
                  <div className={cn("size-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110", kpi.bg)}>
                    <kpi.icon className="size-7" />
                  </div>
                  <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md shadow-sm", kpi.trendColor)}>
                    {kpi.trend}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest italic">{kpi.title}</p>
                  <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter italic uppercase">{kpi.value}</h3>
                  <div className="flex items-center justify-between pt-4">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)]">{kpi.description}</span>
                    <Link href={kpi.link} className="size-8 rounded-full bg-[var(--text-primary)] text-[var(--bg-card)] flex items-center justify-center hover:bg-[var(--primary)] transition-colors">
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="border-none shadow-[var(--shadow-card)] rounded-[40px] overflow-hidden bg-[var(--bg-card)] border border-[var(--border)]">
            <CardHeader className="p-8 pb-2">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-[var(--primary)] flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <TrendingUp className="size-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic">Vendas 30 Dias</h3>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest italic">Análise de faturamento</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-10 pt-4">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 800 }}
                      dy={15}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 800 }}
                    />
                    <Tooltip
                      contentStyle={{ 
                        borderRadius: '24px', 
                        border: '1px solid var(--border)', 
                        boxShadow: 'var(--shadow-card)',
                        padding: '16px',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="vendas"
                      stroke="var(--primary)"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorSales)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Order Status */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.4 }}
        >
          <Card className="border-none shadow-[var(--shadow-card)] rounded-[40px] overflow-hidden bg-[var(--bg-card)] border border-[var(--border)] h-full">
            <CardHeader className="p-8 pb-2 text-center">
              <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic">Status de Pedidos</h3>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {orderStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-4 mt-4 w-full px-4">
                {orderStatus.map((s) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <div className="size-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">{s.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Product Bar Chart */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5 }}
           className="lg:col-span-3"
        >
          <Card className="border-none shadow-[var(--shadow-card)] rounded-[40px] overflow-hidden bg-[var(--bg-card)] border border-[var(--border)]">
            <CardHeader className="p-8 pb-4">
              <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic">Produtos Mais Vendidos</h3>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                    <Bar dataKey="sales" fill="var(--primary)" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
        {/* Recent Orders */}
        <Card className="border-none shadow-[var(--shadow-card)] rounded-[40px] overflow-hidden bg-[var(--bg-card)] border border-[var(--border)]">
          <CardHeader className="p-8 flex-row items-center justify-between border-b border-[var(--border)]">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg">
                <Calendar className="size-6" />
              </div>
              <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic">Próximos Pedidos</h3>
            </div>
            <Link href="/dashboard/pedidos" className="text-[10px] font-black uppercase text-[var(--primary)] tracking-widest hover:underline italic">Ver todos</Link>
          </CardHeader>
          <CardContent className="p-6">
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order, i) => (
                  <div key={order.id} className="p-4 rounded-3xl bg-[var(--bg-app)] border border-[var(--border)] flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                       <div className="size-12 rounded-2xl bg-[var(--bg-card)] flex items-center justify-center text-rose-500 shadow-sm border border-[var(--border)]">
                          <Package className="size-6" />
                       </div>
                       <div>
                         <p className="text-sm font-black text-[var(--text-primary)] tracking-tighter italic uppercase">{order.product_name}</p>
                         <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">{order.clients?.name || 'Cliente'}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-[var(--text-primary)] italic">{format(new Date(order.delivery_date), 'dd MMM', { locale: ptBR })}</p>
                       <Badge className="bg-[var(--primary)]/10 text-[var(--primary)] border-none text-[9px] font-black uppercase">{order.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-[var(--text-secondary)] uppercase font-black italic text-xs">Sem pedidos próximos</div>
            )}
          </CardContent>
        </Card>

        {/* Finances Placeholder */}
        <Card className="border-none shadow-[var(--shadow-card)] rounded-[40px] overflow-hidden bg-[var(--bg-card)] border border-[var(--border)]">
          <CardHeader className="p-8 flex-row items-center justify-between border-b border-[var(--border)]">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg">
                <Wallet className="size-6" />
              </div>
              <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic">Contas & Receitas</h3>
            </div>
            <Link href="/dashboard/financeiro" className="text-[10px] font-black uppercase text-indigo-500 tracking-widest hover:underline italic">Explorar</Link>
          </CardHeader>
          <CardContent className="p-10 flex flex-col items-center justify-center text-[var(--text-secondary)] bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.05),transparent)]">
            <p className="text-xs font-black uppercase tracking-widest italic">Tudo em dia por aqui!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
