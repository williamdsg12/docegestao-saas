"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useBusiness } from "@/hooks/useBusiness"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Users,
  ArrowRight,
  Package,
  Calculator,
  Calendar,
  Sparkles,
  TrendingDown,
  Clock,
  ChevronRight,
  Target,
  Zap,
  BarChart3,
  CheckCircle2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { calcularMeta } from "@/utils/meta"

export default function DashboardPage() {
  const { user } = useAuth()
  const { profile, business } = useBusiness()

  // Realtime Analytics Hook
  const {
    totalHoje,
    totalMes,
    pedidosAtivos,
    ticketMedio,
    receitaEstimada,
    loading,
    pedidos
  } = useDashboardStats()

  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])

  const META_MENSAL = business?.config?.monthly_goal || 10000 
  const progressoMeta = calcularMeta(totalMes, META_MENSAL)

  useEffect(() => {
    if (pedidos.length > 0) {
      // Display last 5 orders only
      setRecentOrders(pedidos.slice(0, 5))

      // Business Intelligence Alerts
      const newAlerts = []
      if (totalHoje > 500) {
        newAlerts.push({
          title: "Performance Ótima",
          desc: "Você superou a média diária de vendas hoje!",
          icon: Zap,
          color: "text-amber-500",
          bg: "bg-amber-50"
        })
      }
      if (progressoMeta > 80) {
        newAlerts.push({
          title: "Meta Quase Lá!",
          desc: "Você atingiu 80% da meta mensal. Continue assim!",
          icon: Target,
          color: "text-blue-500",
          bg: "bg-blue-50"
        })
      }
      setAlerts(newAlerts)
    }
  }, [pedidos, totalHoje, progressoMeta])

  return (
    <div className="space-y-10 pb-20 max-w-[1400px] mx-auto">
      <PageHeader
        title="Painel de"
        highlight="Controle"
        subtitle={`Bem-vinda de volta, ${user?.user_metadata?.first_name || 'Chef'}! Veja o que está acontecendo hoje.`}
        actions={(
          <div className="flex gap-3">
            <Link href="/dashboard/painel-pedidos">
              <Button className="h-11 px-6 rounded-xl bg-slate-900 text-white font-black uppercase text-[10px] shadow-lg hover:translate-y-[-2px] transition-all">
                <ShoppingBag size={16} className="mr-2" /> Gerenciar Pedidos
              </Button>
            </Link>
          </div>
        )}
      />

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
            </div>
          </motion.div>
        ))}
      </div>

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
    </div>
  )
}
