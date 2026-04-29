"use client"

import { useState, useMemo } from "react"
import { 
  Wallet, 
  Clock, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Filter,
  Download,
  Search,
  Receipt,
  ArrowRight,
  TrendingUp,
  BarChart3
} from "lucide-react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell 
} from "recharts"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { cn } from "@/lib/utils"
import { useBusiness } from "@/hooks/useBusiness"
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions"

export default function FinanceiroPage() {
  const { profile } = useBusiness()
  const tenantId = profile?.tenant_id || profile?.company_id
  const [search, setSearch] = useState("")

  const { data, isLoading } = useFinancialTransactions(tenantId)
  const transactions = data?.transactions || []
  const stats = data?.stats || { disponivel: 0, pendente: 0, total_recebido: 0, total_sacado: 0 }

  const filteredTransactions = useMemo(() => 
    transactions.filter(tx => 
        (tx.description?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (tx.customer_name?.toLowerCase() || "").includes(search.toLowerCase())
    ).slice(0, 100),
  [transactions, search])

  // Chart Data Computation
  const chartData = useMemo(() => {
    if (!transactions.length) return []
    const grouped: any = {}
    transactions.forEach(tx => {
      const date = new Date(tx.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
      if (!grouped[date]) grouped[date] = { date, entrada: 0, saida: 0 }
      if (tx.transaction_type === 'sale' && tx.status === 'succeeded') {
        grouped[date].entrada += Number(tx.net_amount || 0)
      } else if (tx.transaction_type !== 'sale') {
        grouped[date].saida += Number(tx.net_amount || 0)
      }
    })
    return Object.values(grouped).reverse().slice(0, 7) // Last 7 days with data
  }, [transactions])

  const kpiItems = [
    { label: "Saldo Disponível", value: stats.disponivel, icon: Wallet, color: "text-[var(--secondary)]" },
    { label: "Saldo Pendente", value: stats.pendente, icon: Clock, color: "text-[var(--accent)]" },
    { label: "Total Recebido", value: stats.total_recebido, icon: ArrowUpCircle, color: "text-[var(--primary)]" },
    { label: "Total Sacado", value: stats.total_sacado, icon: ArrowDownCircle, color: "text-[var(--text-muted)]" },
  ]

  return (
    <div className="space-y-10 pb-20">
      <PageHeader 
        title="Gestão" 
        highlight="Financeira" 
        subtitle="Controle seus ganhos, taxas e extrato detalhado de transações"
        actions={(
          <Button variant="outline" className="h-11 px-6 rounded-xl border-slate-100 text-[10px] font-black uppercase text-slate-400 hover:text-blue-600 transition-all">
             <Download size={16} className="mr-2" /> Exportar Extrato
          </Button>
        )}
      />

      {/* KPI CARDS */}
      <div className="kpi-grid">
        {kpiItems.map((kpi, idx) => (
          <motion.div 
            key={idx} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: idx * 0.05 }}
            className="kpi-card relative overflow-hidden group"
          >
            <div className={cn("size-10 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 shadow-sm transition-transform group-hover:scale-110", kpi.color)}>
              <kpi.icon size={20} />
            </div>
            <div className="mt-4">
              <span className="text-[var(--font-xs)] font-black uppercase text-slate-400 tracking-widest block mb-1 italic leading-none">{kpi.label}</span>
              <span className="text-[var(--font-xl)] font-black italic tracking-tight text-slate-900 leading-none">
                R$ {kpi.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className={cn("absolute -right-4 -bottom-4 size-20 opacity-[0.03] group-hover:scale-110 transition-transform", kpi.color)}>
              <kpi.icon size={80} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* GRÁFICO DE FATURAMENTO */}
      {chartData.length > 0 && (
        <Card className="rounded-[32px] border-slate-100 shadow-sm bg-white overflow-hidden p-6 relative">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <BarChart3 size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black italic tracking-tighter text-slate-900 uppercase">Faturamento Diário</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Últimos dias com movimento</p>
              </div>
            </div>
            <Badge className="bg-slate-50 text-slate-500 hover:bg-slate-100 font-black uppercase text-[10px]">Líquido</Badge>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8e9d2" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#6B1F12', fontWeight: 'bold' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#6B1F12', fontWeight: 'bold' }} 
                  tickFormatter={(val) => `R$${val}`}
                />
                <RechartsTooltip 
                  cursor={{ fill: '#f8e9d2' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(107,31,18,0.1)', fontWeight: 'bold' }}
                />
                <Bar dataKey="entrada" name="Entradas" fill="var(--secondary)" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? 'url(#colorPremium)' : 'var(--secondary)'} opacity={index === chartData.length - 1 ? 1 : 0.6} />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="colorPremium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F47C52" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#E96A3A" stopOpacity={1}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* FILTROS E BUSCA */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Buscar transação..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 pl-12 rounded-2xl border-slate-100 bg-white shadow-sm font-bold italic" 
            />
          </div>
          <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-100 bg-white p-0">
            <Filter size={18} className="text-slate-400" />
          </Button>
        </div>
      </div>

      {/* TABELA DE TRANSAÇÕES */}
      <Card className="rounded-[32px] border-slate-100 shadow-sm bg-white overflow-hidden relative min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center font-black uppercase text-xs italic tracking-widest text-slate-400 animate-pulse">
            Carregando Transações...
          </div>
        )}
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-50">
              <TableHead className="text-[10px] font-black uppercase text-slate-400 italic px-8 h-12">Data</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-400 italic px-8 h-12">Cliente / Descrição</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-400 italic px-8 h-12">Método</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-400 italic px-8 h-12">Status</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-400 italic px-8 h-12 text-right">Valor Líquido</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length > 0 ? filteredTransactions.map((tx) => (
              <TableRow key={tx.id} className="hover:bg-slate-50/30 transition-colors border-slate-50">
                <TableCell className="px-8 py-5">
                   <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900 italic">
                        {new Date(tx.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">
                        {new Date(tx.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                   </div>
                </TableCell>
                <TableCell className="px-8 py-5">
                   <div className="flex items-center gap-3">
                      <div className={cn(
                        "size-8 rounded-lg flex items-center justify-center text-white",
                        tx.transaction_type === 'sale' ? "bg-emerald-500 shadow-emerald-100" : "bg-rose-500 shadow-rose-100"
                      )}>
                        <Receipt size={14} />
                      </div>
                      <span className="text-[11px] font-black text-slate-700 uppercase italic truncate max-w-[200px]">
                        {tx.description || "Pedido #1234"}
                      </span>
                   </div>
                </TableCell>
                <TableCell className="px-8 py-5">
                   <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-100 font-black text-[9px] uppercase italic px-3 py-1">
                      {tx.payment_method_name}
                   </Badge>
                </TableCell>
                <TableCell className="px-8 py-5">
                   <div className="flex items-center gap-2">
                      <div className={cn(
                        "size-2 rounded-full",
                        tx.status === 'succeeded' ? "bg-emerald-500" : 
                        tx.status === 'pending' ? "bg-amber-500 animate-pulse" : "bg-rose-500"
                      )} />
                      <span className={cn(
                        "text-[9px] font-black uppercase italic tracking-widest",
                        tx.status === 'succeeded' ? "text-emerald-600" : 
                        tx.status === 'pending' ? "text-amber-600" : "text-rose-600"
                      )}>
                        {tx.status === 'succeeded' ? "Sucesso" : 
                         tx.status === 'pending' ? "Pendente" : "Falhou"}
                      </span>
                   </div>
                </TableCell>
                <TableCell className="px-8 py-5 text-right">
                   <span className={cn(
                     "text-sm font-black italic tracking-tighter",
                     tx.transaction_type === 'sale' ? "text-slate-900" : "text-rose-600"
                   )}>
                      {tx.transaction_type === 'sale' ? "+" : "-"} R$ {Number(tx.net_amount).toFixed(2)}
                   </span>
                </TableCell>
                <TableCell className="px-8 py-5">
                   <button className="text-slate-300 hover:text-blue-600 transition-colors">
                      <ArrowRight size={16} />
                   </button>
                </TableCell>
              </TableRow>
            )) : !isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                   <div className="space-y-4 py-10 opacity-40">
                      <Receipt size={48} className="mx-auto text-slate-300" />
                      <div className="space-y-1">
                        <p className="text-sm font-black uppercase text-slate-500 italic">Nenhuma transação encontrada</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase italic">Suas vendas e movimentações aparecerão aqui</p>
                      </div>
                   </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
