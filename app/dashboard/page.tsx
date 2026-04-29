"use client"

import { useEffect, useState, useMemo } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { useBusiness } from "@/hooks/useBusiness"
import { format } from "date-fns"
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
  Legend
} from "recharts"

import { PageHeader } from "@/components/dashboard/PageHeader"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { useErpStats } from "@/hooks/useErpStats"
import { calcularMeta } from "@/utils/meta"

export default function DashboardPage() {
  const { user } = useAuth()
  const { profile, business } = useBusiness()
  const tenantId = profile?.tenant_id || profile?.company_id

  // Realtime Analytics Hook
  const {
    totalHoje,
    totalMes,
    ticketMedio,
    loading,
    pedidos
  } = useDashboardStats()

  const { data: erpStats, isLoading: erpLoading } = useErpStats(tenantId)

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => { setIsMounted(true) }, [])

  const META_MENSAL = business?.config?.monthly_goal || 10000 
  const progressoMeta = useMemo(() => calcularMeta(totalMes, META_MENSAL), [totalMes, META_MENSAL])

  // Computed Alerts using useMemo for stability
  const alerts = useMemo(() => {
    const list: any[] = []
    if (erpStats?.itensBaixos && erpStats.itensBaixos > 0) {
      list.push({
        title: "Estoque em Alerta",
        desc: `Existem ${erpStats.itensBaixos} itens com estoque baixo ou zerado.`,
        icon: Package,
        color: "text-rose-500",
        bg: "bg-rose-50",
        href: "/dashboard/estoque"
      })
    }
    if (totalHoje > 500) {
      list.push({
        title: "Performance Ótima",
        desc: "Você superou a média diária de vendas hoje!",
        icon: Zap,
        color: "text-amber-500",
        bg: "bg-amber-50"
      })
    }
    if (progressoMeta > 80) {
      list.push({
        title: "Meta Quase Lá!",
        desc: "Você atingiu 80% da meta mensal. Continue assim!",
        icon: Target,
        color: "text-blue-500",
        bg: "bg-blue-50"
      })
    }
    return list
  }, [erpStats, totalHoje, progressoMeta])

  const chartData = useMemo(() => 
    pedidos.slice(-7).map(p => ({
      name: format(new Date(p.created_at), 'EEE', { locale: ptBR }),
      v: p.total
    })), [pedidos])

  const pieData = useMemo(() => {
    if (pedidos.length === 0) return [{ name: 'Sem Vendas', value: 1, color: '#f1f5f9' }]
    
    const statuses = pedidos.reduce((acc: any, p: any) => {
      const s = p.status || 'pendente'
      acc[s] = (acc[s] || 0) + 1
      return acc
    }, {})

    const mapLabel: any = {
      'delivered': 'Entregue',
      'finalizado': 'Finalizado',
      'pendente_pagamento': 'Aguard. Pagto',
      'pendente': 'Pendente',
      'cancelado': 'Cancelado',
      'arquivado': 'Arquivado'
    }

    const mapColors: any = {
      'Entregue': '#2ECC71',
      'Finalizado': '#4C1D95',
      'Aguard. Pagto': '#F59E0B',
      'Pendente': '#3B82F6',
      'Cancelado': '#EF4444',
      'Arquivado': '#94A3B8'
    }

    return Object.keys(statuses).map(k => {
      const name = mapLabel[k] || k
      return { name, value: statuses[k], color: mapColors[name] || '#94A3B8' }
    })
  }, [pedidos])

  const kpis = [
    { label: "Pedidos Hoje", value: totalHoje > 0 ? pedidos.filter(p => format(new Date(p.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length : 0, icon: ShoppingBag, color: "text-[var(--secondary)]", bg: "bg-[var(--secondary)]/10", isCurrency: false },
    { label: "Faturamento (Mês)", value: totalMes, icon: TrendingUp, color: "text-[var(--primary)]", bg: "bg-[var(--primary)]/10", isCurrency: true },
    { label: "Lucro Líquido", value: totalMes * 0.4, icon: Calculator, color: "text-emerald-500", bg: "bg-emerald-500/10", isCurrency: true, badge: "ESTIMADO" },
    { label: "Clientes Ativos", value: 124, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", isCurrency: false },
  ]

  const { theme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const chartColors = {
    stroke: isDark ? "#F47C52" : "#6B1F12",
    fill: isDark ? "#F47C52" : "#6B1F12",
    grid: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    text: isDark ? "#B3B3B3" : "#6B1F12"
  }

  return (
    <div className="space-y-6 md:space-y-10 pb-24 md:pb-20 max-w-[1600px] mx-auto px-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-4 md:px-0">
        <PageHeader
          title="Dashboard"
          highlight="Premium"
          subtitle={`Bem-vinda, ${user?.user_metadata?.first_name || 'Chef'}! Aqui está o panorama estratégico do seu negócio hoje.`}
        />
        <div className="flex items-center gap-3">
          <Link href="/dashboard/painel-pedidos">
            <Button className="h-12 px-8 rounded-2xl bg-[var(--primary)] text-white font-black uppercase text-[10px] shadow-xl hover:translate-y-[-2px] transition-all hover:brightness-110 active:scale-95">
              <ShoppingBag size={18} className="mr-2" /> Novo Pedido
            </Button>
          </Link>
          <Link href="/dashboard/mensagens">
            <Button variant="ghost" className="size-12 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--accent-light)] transition-all shadow-sm">
              <MessageCircle size={20} />
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[var(--bg-card)] rounded-3xl md:rounded-[40px] border border-[var(--border)] p-5 md:p-8 shadow-sm hover:shadow-2xl hover:translate-y-[-6px] transition-all duration-500 flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div className={cn("size-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg", kpi.bg, kpi.color)}>
                  <kpi.icon size={28} />
                </div>
                {kpi.badge ? (
                  <Badge className="bg-[var(--secondary)]/10 text-[var(--secondary)] border-none font-black text-[8px] uppercase px-2 py-0.5 tracking-widest italic">{kpi.badge}</Badge>
                ) : (
                  <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                    <TrendingUp size={12} /> +12%
                  </div>
                )}
              </div>
              <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2 italic transition-colors group-hover:text-[var(--text-primary)]">{kpi.label}</p>
              <h3 className="text-3xl font-black italic tracking-tighter text-[var(--text-primary)] transition-all group-hover:scale-105 origin-left">
                {kpi.isCurrency ? `R$ ${kpi.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : kpi.value}
              </h3>
            </div>
            <div className="absolute -bottom-6 -right-6 size-32 bg-[var(--primary)]/5 rounded-full blur-3xl group-hover:bg-[var(--primary)]/10 transition-colors" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Chart Section */}
        <div className="xl:col-span-2 space-y-8 px-4 md:px-0">
          <Card className="rounded-3xl md:rounded-[48px] border-[var(--border)] shadow-premium p-6 md:p-10 bg-[var(--bg-card)] relative overflow-hidden">
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div>
                <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase italic tracking-tighter">Fluxo <span className="text-[var(--secondary)]">Financeiro</span></h3>
                <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase italic tracking-widest mt-1">Inteligência de Vendas em tempo real</p>
              </div>
              <div className="flex gap-2">
                {['Hoje', '7D', '30D', '12M'].map((t) => (
                  <button key={t} className={cn("px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", t === '7D' ? "bg-[var(--primary)] text-white" : "bg-[var(--bg-app)] text-[var(--text-muted)] hover:bg-[var(--accent-light)]")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-[250px] md:h-[380px] w-full relative z-10">
              {isMounted && !loading ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.fill} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={chartColors.fill} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: chartColors.text, fontSize: 10, fontWeight: 900 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: chartColors.text, fontSize: 10, fontWeight: 900 }} 
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '24px', 
                        border: '1px solid var(--border)', 
                        backgroundColor: isDark ? 'rgba(27,27,27,0.95)' : 'rgba(255,255,255,0.95)', 
                        color: isDark ? '#FFFFFF' : '#1E1E1E', 
                        boxShadow: '0 20px 50px rgba(0,0,0,0.1)', 
                        fontSize: '12px', 
                        fontWeight: '900',
                        backdropFilter: 'blur(10px)'
                      }} 
                      cursor={{ stroke: 'var(--secondary)', strokeWidth: 1, strokeDasharray: '5 5' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="v" 
                      stroke={chartColors.stroke} 
                      strokeWidth={6} 
                      fillOpacity={1} 
                      fill="url(#colorV)" 
                      animationDuration={2000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="size-full bg-[var(--bg-app)] rounded-[32px] animate-pulse" />
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Produtos Mais Vendidos */}
            <Card className="rounded-[40px] border-[var(--border)] shadow-sm p-8 bg-[var(--bg-card)]">
              <h4 className="text-[11px] font-black uppercase text-[var(--text-primary)] italic tracking-widest mb-6">Produtos Mais Vendidos</h4>
              <div className="space-y-6">
                {[
                  { name: "Bolo de Chocolate Belga", sales: 42, growth: "+15%", color: "bg-amber-900" },
                  { name: "Brownie Red Velvet", sales: 38, growth: "+8%", color: "bg-rose-700" },
                  { name: "Cupcake de Baunilha", sales: 25, growth: "+5%", color: "bg-yellow-200" },
                  { name: "Coxinha Gourmet", sales: 21, growth: "-2%", color: "bg-orange-500" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("size-10 rounded-xl shadow-sm", item.color)} />
                      <div>
                        <p className="text-[11px] font-black text-[var(--text-primary)] uppercase italic leading-none">{item.name}</p>
                        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase mt-1">{item.sales} vendas este mês</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-emerald-500">{item.growth}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Próximos Vencimentos */}
            <Card className="rounded-[40px] border-[var(--border)] shadow-sm p-8 bg-[var(--bg-card)]">
              <h4 className="text-[11px] font-black uppercase text-[var(--text-primary)] italic tracking-widest mb-6">Próximos Vencimentos</h4>
              <div className="space-y-6">
                {[
                  { name: "Chocolate em Barra 1kg", date: "Em 2 dias", status: "critical" },
                  { name: "Farinha de Trigo Premium", date: "Em 5 dias", status: "warning" },
                  { name: "Leite Condensado Itambé", date: "Em 12 dias", status: "ok" },
                  { name: "Manteiga com Sal", date: "Em 15 dias", status: "ok" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "size-2 rounded-full",
                        item.status === 'critical' ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" : 
                        item.status === 'warning' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-emerald-500"
                      )} />
                      <div>
                        <p className="text-[11px] font-black text-[var(--text-primary)] uppercase italic leading-none">{item.name}</p>
                        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase mt-1">{item.date}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 px-3 rounded-full text-[8px] font-black uppercase bg-[var(--bg-app)]">Ver</Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8 px-4 md:px-0">
          {/* Goals / Stats Pie */}
          <Card className="rounded-3xl md:rounded-[40px] border-[var(--border)] shadow-sm p-6 md:p-8 bg-[var(--bg-card)] text-center relative overflow-hidden group">
            <h4 className="text-[11px] font-black uppercase text-[var(--text-primary)] italic tracking-widest mb-6 relative z-10">Performance por Status</h4>
            <div className="h-[280px] w-full relative z-10">
               {isMounted && !loading ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie
                         data={pieData}
                         innerRadius={65}
                         outerRadius={90}
                         paddingAngle={5}
                         dataKey="value"
                         animationBegin={0}
                         animationDuration={1500}
                       >
                         {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                         ))}
                       </Pie>
                       <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', backgroundColor: isDark ? '#1B1B1B' : '#FFFFFF', color: isDark ? '#FFFFFF' : '#1E1E1E', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                       <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-muted)' }} />
                    </PieChart>
                  </ResponsiveContainer>
               ) : (
                  <div className="size-full bg-[var(--bg-app)] rounded-full animate-pulse" />
               )}
            </div>
          </Card>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--bg-card)] p-6 rounded-[32px] border border-[var(--border)] shadow-sm text-center group hover:border-[var(--secondary)]/30 transition-all">
              <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 italic">Conversão</p>
              <h4 className="text-2xl font-black text-[var(--text-primary)] leading-none italic group-hover:scale-110 transition-transform">84%</h4>
            </div>
            <div className="bg-[var(--bg-card)] p-6 rounded-[32px] border border-[var(--border)] shadow-sm text-center group hover:border-[var(--secondary)]/30 transition-all">
              <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 italic">NPS</p>
              <h4 className="text-2xl font-black text-[var(--text-primary)] leading-none italic group-hover:scale-110 transition-transform">9.8</h4>
            </div>
          </div>

          {/* Recent Orders Stream */}
          <Card className="rounded-[40px] border-[var(--border)] shadow-sm p-8 bg-[var(--bg-card)] space-y-8 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[11px] font-black uppercase text-[var(--text-primary)] italic tracking-widest">Feed de Vendas</h4>
                <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Real-time update</p>
              </div>
              <Link href="/dashboard/painel-pedidos">
                <Button variant="ghost" size="sm" className="h-8 rounded-xl text-[9px] font-black uppercase text-[var(--secondary)] hover:bg-[var(--accent-light)]">Ver Todos</Button>
              </Link>
            </div>
            <div className="space-y-6">
              {(pedidos as any[]).slice(0, 4).map((order, i) => (
                <motion.div 
                  key={order.id} 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between group cursor-pointer hover:translate-x-1 transition-transform"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-11 rounded-2xl bg-[var(--bg-app)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--secondary)] transition-colors border border-[var(--border)] shadow-sm">
                      <ShoppingBag size={20} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-[var(--text-primary)] uppercase italic truncate max-w-[140px] leading-none mb-1">{order.customers?.name || 'Venda Catálogo'}</p>
                      <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{format(new Date(order.created_at), 'HH:mm • dd MMM')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-black text-[var(--text-primary)] italic leading-none">R$ {order.total?.toFixed(2)}</p>
                    <div className="mt-1 flex items-center justify-end gap-1.5">
                       <div className="size-1.5 rounded-full bg-emerald-500" />
                       <span className="text-[8px] font-black text-[var(--text-muted)] uppercase italic">Status Ok</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

