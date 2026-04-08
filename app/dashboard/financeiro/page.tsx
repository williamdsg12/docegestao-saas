"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useBusiness } from "@/hooks/useBusiness"
import { toast } from "sonner"
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download,
  Activity,
  Receipt,
  Search,
  PieChart as PieIcon,
  Filter,
  Calendar
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { FeatureGuard } from "@/components/dashboard/FeatureGuard"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { PageFilters } from "@/components/dashboard/PageFilters"
import { PageSearch } from "@/components/dashboard/PageSearch"
import { EmptyStateV2 } from "@/components/dashboard/EmptyStateV2"

interface Transaction {
  id: string
  description: string
  amount: number
  transaction_date: string
  type: "entrada" | "saida"
  category: string
}

export default function FinanceiroPage() {
  return (
    <FeatureGuard feature="financeiro" planRequired="pro">
      <div className="space-y-8 pb-20">
        <FinanceiroContent />
      </div>
    </FeatureGuard>
  )
}

function FinanceiroContent() {
  const { user } = useAuth()
  const { profile } = useBusiness()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<string>("todos")
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().split('T')[0].slice(0, 7))
  const [newTxOpen, setNewTxOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [txForm, setTxForm] = useState({
    description: "",
    amount: "",
    type: "saida" as "entrada" | "saida",
    category: "Geral",
    transaction_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (profile?.company_id || profile?.tenant_id) {
      fetchFinanceData()
    }
  }, [profile])

  async function fetchFinanceData() {
    const tenantId = profile?.tenant_id || profile?.company_id
    if (!tenantId) return
    try {
      setLoading(true)
      const { data, error } = await supabase.from('transactions').select('*').eq('company_id', tenantId).order('transaction_date', { ascending: false })
      if (error) throw error
      setTransactions(data || [])
    } finally { setLoading(false) }
  }

  async function handleSaveTransaction() {
    if (!txForm.description || !txForm.amount) return toast.error("Preencha os campos")
    setIsSaving(true)
    try {
      const tenantId = profile?.tenant_id || profile?.company_id
      const { data, error } = await supabase.from('transactions').insert({
        user_id: user?.id,
        company_id: tenantId,
        tenant_id: tenantId,
        ...txForm,
        amount: parseFloat(txForm.amount)
      }).select().single()

      if (error) throw error
      toast.success("Lançamento realizado!")
      fetchFinanceData()
      setNewTxOpen(false)
      setTxForm({ description: "", amount: "", type: "saida", category: "Geral", transaction_date: new Date().toISOString().split('T')[0] })
    } catch (e) { toast.error("Erro ao salvar") } finally { setIsSaving(false) }
  }

  const filtered = transactions.filter(t => {
    const matchSearch = t.description.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === "todos" || t.type === filterType
    const matchMonth = !monthFilter || t.transaction_date.startsWith(monthFilter)
    return matchSearch && matchType && matchMonth
  })

  const totals = {
    receita: filtered.filter(t => t.type === 'entrada').reduce((acc, t) => acc + t.amount, 0),
    custos: filtered.filter(t => t.type === 'saida').reduce((acc, t) => acc + t.amount, 0),
  }
  totals['saldo'] = totals.receita - totals.custos

  const filterOptions = [
    { key: "todos", label: "Tudo", count: transactions.length },
    { key: "entrada", label: "Entradas", count: transactions.filter(t => t.type === 'entrada').length },
    { key: "saida", label: "Saídas", count: transactions.filter(t => t.type === 'saida').length },
  ]

  const chartData = filtered.reduce((acc: any[], curr) => {
    const date = new Date(curr.transaction_date)
    const day = date.getDate().toString().padStart(2, '0')
    let existing = acc.find(a => a.name === day)
    if (!existing) {
      existing = { name: day, receita: 0, custos: 0 }
      acc.push(existing)
    }
    if (curr.type === 'entrada') existing.receita += curr.amount
    else existing.custos += curr.amount
    return acc
  }, []).sort((a, b) => parseInt(a.name) - parseInt(b.name))

  return (
    <>
      <PageHeader 
        title="Gestão" 
        highlight="Financeira" 
        subtitle="Fluxo de caixa, centro de custos e saúde financeira do seu negócio"
        actions={(
          <div className="flex gap-3">
             <Button variant="outline" className="h-11 px-4 rounded-xl border-slate-100 text-[10px] font-black uppercase text-slate-400 hover:text-rose-500 transition-all">
                <Download size={16} className="mr-2" /> PDF
             </Button>
             <Button onClick={() => { setTxForm(prev => ({ ...prev, type: "entrada" })); setNewTxOpen(true) }} className="h-11 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] shadow-lg">
                <Plus size={16} className="mr-2" /> Entrada
             </Button>
             <Button onClick={() => { setTxForm(prev => ({ ...prev, type: "saida" })); setNewTxOpen(true) }} className="h-11 px-6 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-[10px] shadow-lg">
                <Plus size={16} className="mr-2" /> Saída
             </Button>
          </div>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Saldo do Mês", value: totals.saldo, icon: Wallet, color: totals.saldo >= 0 ? "text-emerald-500" : "text-rose-500", bg: "bg-slate-50" },
          { label: "Total Entradas", value: totals.receita, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50/30" },
          { label: "Total Saídas", value: totals.custos, icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-50/30" },
        ].map((kpi, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className={cn("p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5", kpi.bg)}>
            <div className={cn("size-12 rounded-2xl flex items-center justify-center bg-white shadow-sm", kpi.color)}>
              <kpi.icon size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1 italic">{kpi.label}</span>
              <span className={cn("text-2xl font-black italic tracking-tight", kpi.color)}>R$ {kpi.value.toFixed(2)}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
           <div>
              <h3 className="text-xl font-black text-slate-900 uppercase italic">Histórico de <span className="text-rose-500">Caixa</span></h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase italic tracking-widest mt-1">Comparativo diário de faturamento vs custos</p>
           </div>
           <Input type="month" className="h-10 w-44 rounded-xl border-slate-100 text-sm font-bold" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} />
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                itemStyle={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}
              />
              <Area type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRec)" />
              <Area type="monotone" dataKey="custos" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorCus)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <PageFilters options={filterOptions} activeKey={filterType} onSelect={setFilterType} />
            <PageSearch value={search} onChange={setSearch} placeholder="Buscar por descrição ou categoria..." className="md:max-w-xs" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((tx, i) => (
              <motion.div
                key={tx.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group flex items-center justify-between p-5 rounded-[24px] bg-white border border-slate-100 hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "size-11 rounded-[14px] flex items-center justify-center text-white shadow-lg",
                    tx.type === "entrada" ? "bg-emerald-500" : "bg-rose-500"
                  )}>
                    {tx.type === "entrada" ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-black text-slate-800 uppercase italic truncate max-w-[120px]">{tx.description}</h4>
                    <div className="flex items-center gap-1 mt-1">
                        <Badge className="bg-slate-50 text-slate-400 border-none font-black text-[8px] uppercase px-1.5 py-0">{tx.category}</Badge>
                        <span className="text-[9px] font-bold text-slate-300 uppercase">{new Date(tx.transaction_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-lg font-black italic tracking-tighter", tx.type === "entrada" ? "text-emerald-600" : "text-rose-600")}>
                    {tx.type === "entrada" ? "+" : "-"} R$ {tx.amount.toFixed(2)}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && !loading && (
            <EmptyStateV2 
              icon={Receipt}
              title="Sem movimentações"
              subtitle="Registre suas entradas e gastos para ter um controle financeiro completo"
              action={<Button onClick={() => setNewTxOpen(true)} className="h-10 px-6 rounded-xl bg-slate-900 text-white font-black uppercase text-[10px]">Novo Lançamento</Button>}
            />
          )}
        </div>
      </div>

      <Dialog open={newTxOpen} onOpenChange={setNewTxOpen}>
        <DialogContent className="sm:max-w-lg rounded-[32px] p-8">
            <DialogHeader className="mb-6"><DialogTitle className="text-2xl font-black uppercase italic">Novo Lançamento</DialogTitle></DialogHeader>
            <div className="space-y-4 font-bold">
                <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-slate-400">Descrição</Label>
                    <Input className="h-12 rounded-xl" placeholder="Ex: Venda Bolo de Pote" value={txForm.description} onChange={e => setTxForm({ ...txForm, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-slate-400">Valor (R$)</Label>
                        <Input type="number" className="h-12 rounded-xl" placeholder="0,00" value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-slate-400">Tipo</Label>
                        <select className="w-full h-12 rounded-xl border-slate-100 bg-slate-50 px-4 text-sm font-bold" value={txForm.type} onChange={e => setTxForm({ ...txForm, type: e.target.value as any })}>
                            <option value="saida">Saída (Despesa)</option>
                            <option value="entrada">Entrada (Receita)</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-[10px] uppercase text-slate-400">Categoria</Label><Input className="h-12 rounded-xl" placeholder="Geral" value={txForm.category} onChange={e => setTxForm({ ...txForm, category: e.target.value })} /></div>
                    <div className="space-y-2"><Label className="text-[10px] uppercase text-slate-400">Data</Label><Input type="date" className="h-12 rounded-xl" value={txForm.transaction_date} onChange={e => setTxForm({ ...txForm, transaction_date: e.target.value })} /></div>
                </div>
                <Button onClick={handleSaveTransaction} disabled={isSaving} className="w-full h-14 rounded-2xl bg-rose-500 font-black uppercase text-white shadow-lg mt-4">{isSaving ? "Gravando..." : "Confirmar Lançamento"}</Button>
            </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
