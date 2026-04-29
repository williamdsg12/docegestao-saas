"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { 
  Wallet, 
  Clock, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Filter,
  Download,
  Search,
  Receipt,
  ArrowRight
} from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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

export default function FinanceiroPage() {
  const { profile } = useBusiness()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [stats, setStats] = useState({
    disponivel: 0,
    pendente: 0,
    total_recebido: 0,
    total_sacado: 0
  })

  useEffect(() => {
    if (profile?.tenant_id) {
      fetch财务数据()
    }
  }, [profile])

  async function fetch财务数据() {
    try {
      setLoading(true)
      
      // 1. Fetch transactions
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTransactions(data || [])

      // 2. Generate stats (mock or real based on data)
      const mockStats = {
        disponivel: (data || []).filter(t => t.status === 'succeeded').reduce((acc, t) => acc + Number(t.net_amount), 0),
        pendente: (data || []).filter(t => t.status === 'pending').reduce((acc, t) => acc + Number(t.net_amount), 0),
        total_recebido: (data || []).filter(t => t.transaction_type === 'sale').reduce((acc, t) => acc + Number(t.amount), 0),
        total_sacado: (data || []).filter(t => t.transaction_type === 'payout').reduce((acc, t) => acc + Number(t.amount), 0)
      }
      setStats(mockStats)

    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

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

      {/* KPI CARDS - Fully Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {[
          { label: "Disponível", value: stats.disponivel, icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-50/50" },
          { label: "Pendente", value: stats.pendente, icon: Clock, color: "text-amber-500", bg: "bg-amber-50/50" },
          { label: "Recebido", value: stats.total_recebido, icon: ArrowUpCircle, color: "text-blue-500", bg: "bg-blue-50/50" },
          { label: "Sacado", value: stats.total_sacado, icon: ArrowDownCircle, color: "text-slate-400", bg: "bg-slate-50" },
        ].map((kpi, idx) => (
          <motion.div 
            key={idx} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: idx * 0.1 }}
            className={cn("p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl lg:rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-3 sm:gap-4 relative overflow-hidden group bg-white")}
          >
            <div className={cn("size-9 sm:size-10 lg:size-12 rounded-xl sm:rounded-2xl flex items-center justify-center bg-white shadow-sm border border-slate-50", kpi.color)}>
              <kpi.icon className="size-5 sm:size-5 lg:size-6" />
            </div>
            <div>
              <span className="text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase text-slate-400 tracking-wide sm:tracking-widest block mb-0.5 sm:mb-1 italic truncate">{kpi.label}</span>
              <span className={cn("text-base sm:text-xl lg:text-2xl font-black italic tracking-tight text-slate-900")}>
                R$ {kpi.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className={cn("absolute -right-4 -bottom-4 size-16 sm:size-20 lg:size-24 opacity-[0.03] group-hover:scale-110 transition-transform", kpi.color)}>
              <kpi.icon className="size-full" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* FILTROS E BUSCA - Fully Responsive */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64 lg:w-80">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4 sm:size-[18px]" />
            <Input 
              placeholder="Buscar..." 
              className="h-10 sm:h-12 pl-9 sm:pl-12 rounded-xl sm:rounded-2xl border-slate-100 bg-white shadow-sm font-bold italic placeholder:font-bold placeholder:italic text-sm" 
            />
          </div>
          <Button variant="outline" className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl border-slate-100 bg-white p-0 shrink-0">
            <Filter className="size-4 sm:size-[18px] text-slate-400" />
          </Button>
        </div>
      </div>

      {/* TRANSAÇÕES - Desktop Table / Mobile Cards */}
      
      {/* Desktop Table */}
      <Card className="hidden lg:block rounded-2xl lg:rounded-[32px] border-slate-100 shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-50">
                <TableHead className="text-[9px] lg:text-[10px] font-black uppercase text-slate-400 italic px-4 lg:px-8 h-10 lg:h-12">Data</TableHead>
                <TableHead className="text-[9px] lg:text-[10px] font-black uppercase text-slate-400 italic px-4 lg:px-8 h-10 lg:h-12">Descrição</TableHead>
                <TableHead className="text-[9px] lg:text-[10px] font-black uppercase text-slate-400 italic px-4 lg:px-8 h-10 lg:h-12">Método</TableHead>
                <TableHead className="text-[9px] lg:text-[10px] font-black uppercase text-slate-400 italic px-4 lg:px-8 h-10 lg:h-12">Status</TableHead>
                <TableHead className="text-[9px] lg:text-[10px] font-black uppercase text-slate-400 italic px-4 lg:px-8 h-10 lg:h-12 text-right">Valor</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? transactions.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-slate-50/30 transition-colors border-slate-50">
                  <TableCell className="px-4 lg:px-8 py-3 lg:py-5">
                     <div className="flex flex-col">
                        <span className="text-[10px] lg:text-xs font-black text-slate-900 italic">
                          {new Date(tx.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-[8px] lg:text-[9px] font-bold text-slate-400 uppercase">
                          {new Date(tx.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                     </div>
                  </TableCell>
                  <TableCell className="px-4 lg:px-8 py-3 lg:py-5">
                     <div className="flex items-center gap-2 lg:gap-3">
                        <div className={cn(
                          "size-6 lg:size-8 rounded-lg flex items-center justify-center text-white shrink-0",
                          tx.transaction_type === 'sale' ? "bg-emerald-500" : "bg-rose-500"
                        )}>
                          <Receipt className="size-3 lg:size-3.5" />
                        </div>
                        <span className="text-[10px] lg:text-[11px] font-black text-slate-700 uppercase italic truncate max-w-[150px] lg:max-w-[200px]">
                          {tx.description || "Pedido #1234"}
                        </span>
                     </div>
                  </TableCell>
                  <TableCell className="px-4 lg:px-8 py-3 lg:py-5">
                     <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-100 font-black text-[8px] lg:text-[9px] uppercase italic px-2 lg:px-3 py-0.5 lg:py-1">
                        {tx.payment_method_name}
                     </Badge>
                  </TableCell>
                  <TableCell className="px-4 lg:px-8 py-3 lg:py-5">
                     <div className="flex items-center gap-1.5 lg:gap-2">
                        <div className={cn(
                          "size-1.5 lg:size-2 rounded-full animate-pulse",
                          tx.status === 'succeeded' ? "bg-emerald-500" : 
                          tx.status === 'pending' ? "bg-amber-500" : "bg-rose-500"
                        )} />
                        <span className={cn(
                          "text-[8px] lg:text-[9px] font-black uppercase italic tracking-wide lg:tracking-widest",
                          tx.status === 'succeeded' ? "text-emerald-600" : 
                          tx.status === 'pending' ? "text-amber-600" : "text-rose-600"
                        )}>
                          {tx.status === 'succeeded' ? "Sucesso" : 
                           tx.status === 'pending' ? "Pendente" : "Falhou"}
                        </span>
                     </div>
                  </TableCell>
                  <TableCell className="px-4 lg:px-8 py-3 lg:py-5 text-right">
                     <span className={cn(
                       "text-xs lg:text-sm font-black italic tracking-tighter",
                       tx.transaction_type === 'sale' ? "text-slate-900" : "text-rose-600"
                     )}>
                        {tx.transaction_type === 'sale' ? "+" : "-"} R$ {Number(tx.net_amount).toFixed(2)}
                     </span>
                  </TableCell>
                  <TableCell className="px-4 lg:px-8 py-3 lg:py-5">
                     <button className="text-slate-300 hover:text-blue-600 transition-colors">
                        <ArrowRight className="size-4" />
                     </button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 lg:h-64 text-center">
                     <div className="space-y-3 lg:space-y-4 py-8 lg:py-10 opacity-40">
                        <Receipt className="size-10 lg:size-12 mx-auto text-slate-300" />
                        <div className="space-y-1">
                          <p className="text-xs lg:text-sm font-black uppercase text-slate-500 italic">Nenhuma transação</p>
                          <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase italic">Movimentações aparecerão aqui</p>
                        </div>
                     </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {transactions.length > 0 ? transactions.map((tx) => (
          <motion.div 
            key={tx.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                  "size-10 rounded-xl flex items-center justify-center text-white shrink-0",
                  tx.transaction_type === 'sale' ? "bg-emerald-500" : "bg-rose-500"
                )}>
                  <Receipt className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-900 uppercase italic truncate">{tx.description || "Pedido #1234"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-bold text-slate-400">{new Date(tx.created_at).toLocaleDateString('pt-BR')}</span>
                    <span className="text-[9px] font-bold text-slate-400">{new Date(tx.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className={cn(
                  "text-sm font-black italic tracking-tight",
                  tx.transaction_type === 'sale' ? "text-slate-900" : "text-rose-600"
                )}>
                  {tx.transaction_type === 'sale' ? "+" : "-"} R$ {Number(tx.net_amount).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
              <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-100 font-black text-[8px] uppercase italic px-2 py-0.5">
                {tx.payment_method_name}
              </Badge>
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  "size-1.5 rounded-full",
                  tx.status === 'succeeded' ? "bg-emerald-500" : 
                  tx.status === 'pending' ? "bg-amber-500" : "bg-rose-500"
                )} />
                <span className={cn(
                  "text-[9px] font-black uppercase italic",
                  tx.status === 'succeeded' ? "text-emerald-600" : 
                  tx.status === 'pending' ? "text-amber-600" : "text-rose-600"
                )}>
                  {tx.status === 'succeeded' ? "Sucesso" : tx.status === 'pending' ? "Pendente" : "Falhou"}
                </span>
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
            <Receipt className="size-10 mx-auto text-slate-300 mb-3" />
            <p className="text-xs font-black uppercase text-slate-500 italic">Nenhuma transação</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase italic mt-1">Movimentações aparecerão aqui</p>
          </div>
        )}
      </div>
    </div>
  )
}
