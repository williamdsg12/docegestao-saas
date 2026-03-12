"use client"

import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Users,
  ClipboardList,
  ArrowRight,
  TrendingDown,
  Calendar,
  Wallet,
  Package
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"

export default function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    receitas: 0,
    clientes: 0,
    orcamentos: 0,
    pedidos: 0
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        const [ordersRes, clientsRes, orcamentosRes] = await Promise.all([
          supabase.from('orders').select('total_value'),
          supabase.from('clients').select('id', { count: 'exact' }),
          supabase.from('orcamentos').select('id', { count: 'exact' })
        ])

        const totalReceitas = ordersRes.data?.reduce((acc: number, curr: any) => acc + (curr.total_value || 0), 0) || 0

        setStats({
          receitas: totalReceitas,
          clientes: clientsRes.count || 0,
          orcamentos: orcamentosRes.count || 0,
          pedidos: ordersRes.data?.length || 0
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) fetchStats()
  }, [user])

  const kpis = [
    { title: "Receitas", value: `R$ ${stats.receitas.toLocaleString('pt-BR')}`, link: "/dashboard/financeiro", icon: Wallet, color: "text-blue-600", bg: "bg-blue-600", lightBg: "bg-blue-50", linkText: "Ver receitas" },
    { title: "Clientes", value: stats.clientes.toString(), link: "/dashboard/clientes", icon: Users, color: "text-pink-600", bg: "bg-pink-600", lightBg: "bg-pink-50", linkText: "Ver clientes" },
    { title: "Orçamentos", value: stats.orcamentos.toString(), link: "/dashboard/orcamentos", icon: ClipboardList, color: "text-emerald-600", bg: "bg-emerald-600", lightBg: "bg-emerald-50", linkText: "Ver orçamentos" },
    { title: "Pedidos", value: stats.pedidos.toString(), link: "/dashboard/pedidos", icon: ShoppingBag, color: "text-orange-600", bg: "bg-orange-600", lightBg: "bg-orange-50", linkText: "Ver pedidos" },
  ]

  const chartData = [
    { name: 'Seg', vendas: 400, gastos: 240 },
    { name: 'Ter', vendas: 300, gastos: 139 },
    { name: 'Qua', vendas: 200, gastos: 980 },
    { name: 'Qui', vendas: 278, gastos: 390 },
    { name: 'Sex', vendas: 189, gastos: 480 },
    { name: 'Sáb', vendas: 239, gastos: 380 },
    { name: 'Dom', vendas: 349, gastos: 430 },
  ]

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
          >
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-default">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">{kpi.title}</p>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{kpi.value}</h3>
                    <Link href={kpi.link} className={cn("text-xs font-bold flex items-center gap-1 mt-4 transition-colors hover:opacity-80", kpi.color)}>
                      <ArrowRight className="size-3" />
                      {kpi.linkText}
                    </Link>
                  </div>
                  <div className={cn("size-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0", kpi.bg)}>
                    <kpi.icon className="size-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Proximos Pedidos */}
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex-row items-center gap-3 space-y-0 p-6">
            <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Calendar className="size-5" />
            </div>
            <h3 className="font-bold text-slate-900">Próximos Pedidos</h3>
          </CardHeader>
          <CardContent className="p-0">
            <div className="min-h-[300px] flex flex-col items-center justify-center p-8 text-slate-400">
              <div className="size-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                <Package className="size-8 text-slate-200" />
              </div>
              <p className="text-sm font-medium">Nenhum pedido encontrado</p>
            </div>
          </CardContent>
        </Card>

        {/* Proximos Pagamentos */}
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex-row items-center gap-3 space-y-0 p-6">
            <div className="size-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Wallet className="size-5" />
            </div>
            <h3 className="font-bold text-slate-900">Próximos Pagamentos</h3>
          </CardHeader>
          <CardContent className="p-0">
            <div className="min-h-[300px] flex flex-col items-center justify-center p-8 text-slate-400">
              <div className="size-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                <DollarSign className="size-8 text-slate-200" />
              </div>
              <p className="text-sm font-medium">Nenhum pagamento agendado</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart Section */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <TrendingUp className="size-5" />
            </div>
            <h3 className="font-bold text-slate-900">Desempenho - Últimos 7 Dias</h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-tight">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-blue-600" />
              <span className="text-slate-600 font-black italic">Vendas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-red-500" />
              <span className="text-slate-600 font-black italic">Gastos</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="vendas"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorVendas)"
                />
                <Area
                  type="monotone"
                  dataKey="gastos"
                  stroke="#ef4444"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorGastos)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
