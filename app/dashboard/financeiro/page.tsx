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

      {/* KPI CARDS - Premium Style */}
      <div className="kpi-grid">
        {[
          { label: "Saldo Disponível", value: stats.disponivel, icon: Wallet, color: "text-emerald-500" },
          { label: "Saldo Pendente", value: stats.pendente, icon: Clock, color: "text-amber-500" },
          { label: "Total Recebido", value: stats.total_recebido, icon: ArrowUpCircle, color: "text-blue-500" },
          { label: "Total Sacado", value: stats.total_sacado, icon: ArrowDownCircle, color: "text-slate-400" },
        ].map((kpi, idx) => (
          <motion.div 
            key={idx} 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: idx * 0.1 }}
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

      {/* FILTROS E BUSCA */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Buscar transação..." 
              className="h-12 pl-12 rounded-2xl border-slate-100 bg-white shadow-sm font-bold italic placeholder:font-bold placeholder:italic" 
            />
          </div>
          <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-100 bg-white p-0">
            <Filter size={18} className="text-slate-400" />
          </Button>
        </div>
      </div>

      {/* TABELA DE TRANSAÇÕES */}
      <Card className="rounded-[32px] border-slate-100 shadow-sm bg-white overflow-hidden">
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
            {transactions.length > 0 ? transactions.map((tx) => (
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
                        "size-2 rounded-full animate-pulse",
                        tx.status === 'succeeded' ? "bg-emerald-500" : 
                        tx.status === 'pending' ? "bg-amber-500" : "bg-rose-500"
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
            )) : (
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
