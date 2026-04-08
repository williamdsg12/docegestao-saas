"use client"

import { useState, useEffect } from "react"
import { 
  CreditCard, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  History
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function VendasFinanceiroPage() {
  const [balance, setBalance] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const [balRes, transRes] = await Promise.all([
        fetch('/api/stripe/balance'),
        fetch('/api/stripe/transactions')
      ])

      const balData = await balRes.json()
      const transData = await transRes.json()

      if (balData.error) throw new Error(balData.error)
      
      setBalance(balData)
      setTransactions(transData.data || [])
    } catch (error: any) {
      console.error(error)
      // Se não houver conta Stripe ainda, o erro será capturado aqui
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-[32px]" />)}
        </div>
        <div className="h-96 bg-slate-100 rounded-[32px]" />
      </div>
    )
  }

  if (!balance) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-6">
        <div className="size-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
          <CreditCard size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black uppercase italic text-slate-900 tracking-tighter">Financeiro Online Inativo</h2>
          <p className="text-slate-500 font-medium max-w-md mx-auto">
            Você ainda não ativou sua conta de pagamentos online. Ative-a nas configurações de métodos de pagamento para ver seu saldo e vendas.
          </p>
        </div>
        <Button className="h-12 px-8 bg-blue-600 font-black uppercase text-xs rounded-xl italic">Configurar Pagamentos</Button>
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-20">
      {/* HEADER E RESUMO */}
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Minhas Vendas & Saldo</h2>
          <p className="text-sm font-bold text-slate-400 uppercase italic mt-1">Gerencie suas receitas e histórico financeiro na Stripe</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* SALDO DISPONÍVEL */}
           <Card className="rounded-[32px] border-none shadow-xl shadow-blue-500/5 bg-blue-600 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Wallet size={80} />
              </div>
              <CardHeader className="pb-2">
                 <CardDescription className="text-blue-100 font-black uppercase italic text-[10px]">Saldo Disponível</CardDescription>
                 <CardTitle className="text-3xl font-black italic tracking-tight">
                    {formatCurrency(balance.available[0]?.amount || 0, balance.available[0]?.currency || 'brl')}
                 </CardTitle>
              </CardHeader>
              <CardContent>
                 <p className="text-[10px] font-bold text-blue-200 uppercase italic">Pronto para repasse bancário</p>
              </CardContent>
           </Card>

           {/* SALDO PENDENTE */}
           <Card className="rounded-[32px] border-slate-100 shadow-sm bg-white">
              <CardHeader className="pb-2 text-slate-900">
                 <CardDescription className="text-slate-400 font-black uppercase italic text-[10px]">Saldo Pendente</CardDescription>
                 <CardTitle className="text-3xl font-black italic tracking-tight">
                    {formatCurrency(balance.pending[0]?.amount || 0, balance.pending[0]?.currency || 'brl')}
                 </CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase italic">
                    <Clock size={12} /> Processando pela Stripe
                 </div>
              </CardContent>
           </Card>

           {/* TOTAL VENDIDO (ESTIMADO) */}
           <Card className="rounded-[32px] border-slate-100 shadow-sm bg-white">
              <CardHeader className="pb-2 text-slate-900 text-slate-900">
                 <CardDescription className="text-slate-400 font-black uppercase italic text-[10px]">Vendas Recentes</CardDescription>
                 <CardTitle className="text-3xl font-black italic tracking-tight">
                    {transactions.length} <span className="text-sm text-slate-300 font-black">Transações</span>
                 </CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase italic">
                    <TrendingUp size={12} /> Últimos 30 dias
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>

      {/* DISPUTAS E ALERTAS */}
      <section className="bg-rose-50 border border-rose-100 rounded-[32px] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="flex items-center gap-4 text-center md:text-left">
            <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-rose-500">
               <AlertTriangle size={24} />
            </div>
            <div>
               <h4 className="font-black uppercase italic text-rose-900 text-sm leading-none">Atenção ao Risco</h4>
               <p className="text-[10px] font-bold text-rose-600 uppercase italic mt-1 leading-relaxed">
                  Você é o responsável por chargebacks e disputas. Mantenha seu saldo em ordem para cobrir possíveis estornos.
               </p>
            </div>
         </div>
         <Button variant="outline" className="h-10 px-6 rounded-xl border-rose-200 text-rose-600 font-black uppercase text-[10px] italic hover:bg-rose-100">
            Ver Regras de Disputa
         </Button>
      </section>

      {/* HISTÓRICO DE TRANSAÇÕES */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-2">
            <History className="text-blue-500" /> Histórico de Recebíveis
          </h3>
          <Button variant="ghost" className="text-[10px] font-black uppercase italic text-blue-600">Ver Tudo</Button>
        </div>

        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black uppercase italic text-slate-400 tracking-wider">Data</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase italic text-slate-400 tracking-wider">Cliente / ID</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase italic text-slate-400 tracking-wider text-center">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase italic text-slate-400 tracking-wider text-right">Valor Bruto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.map((t: any) => (
                  <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                       <span className="text-xs font-black text-slate-400 uppercase italic">
                          {new Date(t.created * 1000).toLocaleDateString('pt-BR')}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-black text-slate-900 uppercase italic truncate max-w-[200px]">
                            {t.billing_details?.name || 'Cliente Online'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase italic truncate opacity-50">
                            {t.id}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex justify-center">
                          <Badge className={cn(
                            "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border",
                            t.status === 'succeeded' ? "bg-emerald-100 text-emerald-600 border-emerald-200" :
                            t.status === 'pending' ? "bg-amber-100 text-amber-600 border-amber-200" :
                            "bg-rose-100 text-rose-500 border-rose-200"
                          )}>
                             {t.status === 'succeeded' ? 'Sucesso' : t.status === 'pending' ? 'Pendente' : 'Falha'}
                          </Badge>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-black text-slate-900 italic">
                             {formatCurrency(t.amount, t.currency)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase italic">
                             Cartão {t.payment_method_details?.card?.brand} **** {t.payment_method_details?.card?.last4}
                          </span>
                       </div>
                    </td>
                  </tr>
                ))}

                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                       <div className="flex flex-col items-center gap-4 opacity-30">
                          <History size={40} />
                          <span className="text-[10px] font-black uppercase italic text-slate-400">Nenhuma transação encontrada</span>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FOOTER INFO */}
      <div className="p-10 rounded-[40px] bg-slate-900 text-white text-center space-y-4 shadow-2xl relative overflow-hidden overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500" />
         <History className="text-blue-500 mx-auto opacity-50" size={32} />
         <h4 className="font-black uppercase italic text-slate-100 text-sm tracking-tight leading-none">Segurança & Transparência</h4>
         <p className="text-[10px] font-bold text-slate-400 uppercase italic leading-relaxed px-4 max-w-2xl mx-auto">
            Os dados financeiros exibidos são sincronizados diretamente com os servidores da Stripe. 
            Quaisquer divergências devem ser consultadas diretamente no Painel Stripe Express.
         </p>
         <Button variant="ghost" onClick={fetchData} className="text-[9px] font-black uppercase italic text-slate-500 hover:text-white">
            Atualizar Dados Agora
         </Button>
      </div>
    </div>
  )
}
