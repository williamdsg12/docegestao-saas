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
  Target
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

export default function DashboardPage() {
  const { user } = useAuth()
  const { profile } = useBusiness()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    lucroHoje: 0,
    pedidosAtivos: 0,
    margemBaixa: 0,
    estoqueCritico: 0
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    if (profile?.tenant_id || profile?.company_id) {
      fetchDashboardData()
    }
  }, [profile])

  async function fetchDashboardData() {
    const tenantId = profile?.tenant_id || profile?.company_id
    if (!tenantId) return
    try {
      setLoading(true)
      const [ordersRes, ingredientsRes, transactionsRes] = await Promise.all([
        supabase.from('pedidos').select('*, clientes(nome)').eq('company_id', tenantId).order('created_at', { ascending: false }).limit(5),
        supabase.from('ingredients').select('*').eq('tenant_id', tenantId),
        supabase.from('transactions').select('*').eq('company_id', tenantId).gte('transaction_date', new Date().toISOString().split('T')[0])
      ])

      const todayTransactions = transactionsRes.data || []
      const revenue = todayTransactions.filter(t => t.type === 'entrada').reduce((acc, t) => acc + t.amount, 0)
      const expenses = todayTransactions.filter(t => t.type === 'saida').reduce((acc, t) => acc + t.amount, 0)

      setStats({
        lucroHoje: revenue - expenses,
        pedidosAtivos: ordersRes.data?.filter(o => o.status !== 'entregue' && o.status !== 'cancelado').length || 0,
        margemBaixa: 2, // Mock or calculated from recipes if fetched
        estoqueCritico: ingredientsRes.data?.filter(i => i.current_quantity < i.min_stock).length || 0
      })

      setRecentOrders(ordersRes.data || [])

      // Generate localized alerts
      const newAlerts = []
      if ((ingredientsRes.data?.filter(i => i.current_quantity < i.min_stock).length || 0) > 0) {
        newAlerts.push({
          title: "Estoque Crítico",
          desc: "Alguns insumos precisam de reposição imediata",
          icon: Package,
          color: "text-rose-500",
          bg: "bg-rose-50"
        })
      }
      setAlerts(newAlerts)

    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-10 pb-20">
      <PageHeader 
        title="Painel de" 
        highlight="Controle" 
        subtitle={`Bem-vinda de volta, ${user?.user_metadata?.first_name || 'Chef'}! Veja o que está acontecendo hoje.`}
        actions={(
          <div className="flex gap-3">
             <Button className="h-11 px-6 rounded-xl bg-slate-900 text-white font-black uppercase text-[10px] shadow-lg">
                <Calendar size={16} className="mr-2" /> Agenda de Hoje
             </Button>
          </div>
        )}
      />

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Resultado Hoje", value: stats.lucroHoje, icon: DollarSign, color: stats.lucroHoje >= 0 ? "text-emerald-500" : "text-rose-500", trend: "+15%" },
          { label: "Pedidos Ativos", value: stats.pedidosAtivos, icon: ShoppingBag, color: "text-blue-500", trend: "Em fila" },
          { label: "Alertas de Margem", value: stats.margemBaixa, icon: TrendingDown, color: "text-amber-500", trend: "Atenção" },
          { label: "Estoque Crítico", value: stats.estoqueCritico, icon: Package, color: "text-rose-500", trend: "Repor" },
        ].map((kpi, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className={cn("size-10 rounded-xl flex items-center justify-center bg-slate-50", kpi.color)}>
                <kpi.icon size={20} />
              </div>
              <Badge className="bg-slate-50 text-slate-400 border-none font-black text-[8px] uppercase px-2 py-0.5">{kpi.trend}</Badge>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1 italic">{kpi.label}</p>
              <h3 className="text-2xl font-black italic tracking-tight text-slate-900">
                {typeof kpi.value === 'number' && kpi.label.includes('Hoje') ? `R$ ${kpi.value.toFixed(2)}` : kpi.value}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Chart */}
        <Card className="xl:col-span-2 rounded-[40px] border-slate-100 shadow-sm p-8 bg-white space-y-8">
           <div className="flex items-center justify-between">
              <div>
                 <h3 className="text-xl font-black text-slate-900 uppercase italic">Fluxo de <span className="text-rose-500">Produção</span></h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase italic tracking-widest mt-1">Estimativa de demanda semanal</p>
              </div>
              <div className="flex gap-2">
                 <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 text-[9px] font-black uppercase text-slate-500"><div className="size-1.5 rounded-full bg-rose-500" /> Pedidos</div>
                 <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 text-[9px] font-black uppercase text-slate-500"><div className="size-1.5 rounded-full bg-blue-400" /> Orçamentos</div>
              </div>
           </div>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: "Seg", p: 40, o: 24 },
                    { name: "Ter", p: 30, o: 13 },
                    { name: "Qua", p: 70, o: 48 },
                    { name: "Qui", p: 45, o: 33 },
                    { name: "Sex", p: 90, o: 60 },
                    { name: "Sáb", p: 120, o: 80 },
                    { name: "Dom", p: 85, o: 50 },
                  ]}>
                    <defs>
                      <linearGradient id="colorP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F472B6" stopOpacity={0.1}/><stop offset="95%" stopColor="#F472B6" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="p" stroke="#F472B6" strokeWidth={4} fillOpacity={1} fill="url(#colorP)" />
                    <Area type="monotone" dataKey="o" stroke="#60A5FA" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
                  </AreaChart>
              </ResponsiveContainer>
           </div>
        </Card>

        {/* Alerts & Orders Sidebar */}
        <div className="space-y-8">
           {/* Alerts Column */}
           <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic ml-4">Inteligência de Negócio</h4>
              <AnimatePresence>
                {alerts.map((alert, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={cn("p-5 rounded-3xl border border-transparent shadow-sm flex gap-4 items-center group cursor-pointer hover:shadow-xl transition-all", alert.bg)}>
                    <div className={cn("size-10 rounded-2xl flex items-center justify-center bg-white shadow-sm", alert.color)}>
                      <alert.icon size={20} />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-black uppercase text-slate-900 italic leading-none mb-1">{alert.title}</h5>
                      <p className="text-[10px] font-bold text-slate-500 leading-tight">{alert.desc}</p>
                    </div>
                    <ChevronRight size={16} className="ml-auto text-slate-300 group-hover:text-slate-900 transition-colors" />
                  </motion.div>
                ))}
                {alerts.length === 0 && (
                  <div className="p-8 rounded-[32px] bg-emerald-50/30 border border-emerald-100 border-dashed flex flex-col items-center text-center">
                    <Sparkles className="text-emerald-500 mb-3" size={24} />
                    <p className="text-[10px] font-black uppercase text-emerald-600 italic tracking-widest">Tudo Sob Controle</p>
                    <p className="text-[9px] font-medium text-emerald-500/80 mt-1 uppercase">Nenhum alerta crítico no momento</p>
                  </div>
                )}
              </AnimatePresence>
           </div>

           {/* Recent Orders List */}
           <Card className="rounded-[32px] border-slate-100 shadow-sm p-6 bg-white space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black uppercase text-slate-900 italic tracking-widest">Últimos Pedidos</h4>
                <Link href="/dashboard/pedidos" className="text-[9px] font-black uppercase text-rose-500 hover:underline">Ver Todos</Link>
              </div>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3">
                       <div className="size-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-colors">
                          <ShoppingBag size={16} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-900 uppercase italic truncate max-w-[100px]">{order.clientes?.nome || 'Cliente'}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{format(new Date(order.created_at), 'dd MMM HH:mm', { locale: ptBR })}</p>
                       </div>
                    </div>
                    <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-0.5 border-slate-100 text-slate-400 italic">R$ {order.total?.toFixed(2)}</Badge>
                  </div>
                ))}
                {recentOrders.length === 0 && <p className="text-[9px] text-center text-slate-300 uppercase py-4">Nenhum pedido recente</p>}
              </div>
           </Card>
        </div>
      </div>
    </div>
  )
}
