"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Wallet, Activity, ArrowUpRight, ArrowDownRight, Search, Download, Filter } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const stats = [
  { label: "Saldo Atual", value: "R$ 15.420,00", icon: Wallet, iconBg: "bg-primary", trend: "+12%" },
  { label: "Receita (Total)", value: "R$ 28.540,00", icon: TrendingUp, iconBg: "bg-green-500", trend: "+8.5%" },
  { label: "Custos (CMV)", value: "R$ 9.120,40", icon: TrendingDown, iconBg: "bg-rose-500", trend: "-2.4%" },
  { label: "Lucro Líquido", value: "R$ 19.419,60", icon: Activity, iconBg: "bg-blue-500", trend: "+15.2%" },
]

const recentTransactions = [
  { id: 1, description: "Venda - Bolo de Casamento (Final)", amount: 1450.00, type: "entrada", category: "Encomendas", date: "Hoje, 14:20" },
  { id: 2, description: "Fornecedor Sicao - Insumos", amount: 480.50, type: "saida", category: "Produção", date: "Hoje, 10:45" },
  { id: 3, description: "Venda - Kit Brigadeiro P (4x)", amount: 220.00, type: "entrada", category: "Loja Online", date: "Ontem, 16:30" },
  { id: 4, description: "Aluguel Ateliê - Março", amount: 1800.00, type: "saida", category: "Custos Fixos", date: "Há 2 dias" },
  { id: 5, description: "Pagamento Shopify Mensal", amount: 155.00, type: "saida", category: "Marketing", date: "Há 3 dias" },
]

export default function CaptureFinanceiroPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 p-12 space-y-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-2 uppercase italic leading-none">
            Financeiro <span className="text-primary tracking-tighter">Inteligente</span>
          </h1>
          <p className="text-slate-500 font-medium">Clareza total sobre o seu lucro e a saúde do seu negócio.</p>
        </div>

        <div className="flex gap-4">
          <Button variant="outline" className="h-14 px-8 rounded-2xl border-white bg-white shadow-sm font-bold uppercase text-[10px] tracking-widest"><Download className="mr-2 size-4" /> Exportar</Button>
          <Button className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 transition-transform active:scale-95">Lançar Transação</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative overflow-hidden rounded-[32px] border border-white/60 bg-white/40 backdrop-blur-xl p-8 shadow-sm hover:translate-y-[-4px] transition-transform duration-300"
          >
            <div className={cn("size-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-primary/20", stat.iconBg)}>
              <stat.icon className="size-6" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">{stat.value}</h3>
            <div className="flex items-center gap-2">
              <span className={cn("text-[10px] font-black px-2 py-1 rounded-lg", stat.trend.startsWith('+') ? "bg-green-100 text-green-600" : "bg-rose-100 text-rose-600")}>
                {stat.trend}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">VS mês passado</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm relative overflow-hidden">
             <div className="flex items-center justify-between mb-10">
                <h3 className="text-lg font-black italic uppercase text-slate-800">Fluxo de Caixa Mensal</h3>
                <div className="flex gap-4">
                   <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-primary" /><span className="text-[10px] font-black uppercase text-slate-400">Entradas</span></div>
                   <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-slate-200" /><span className="text-[10px] font-black uppercase text-slate-400">Saídas</span></div>
                </div>
             </div>
             
             <div className="h-64 flex items-end gap-3 px-4">
                {[30, 45, 25, 60, 40, 75, 55, 90, 65, 110, 85, 120].map((h, i) => (
                   <div key={i} className="flex-1 flex flex-col gap-1.5 h-full justify-end">
                      <div className="w-full rounded-t-lg bg-slate-200" style={{ height: `${h * 0.3}%` }} />
                      <div className="w-full rounded-t-lg bg-gradient-to-t from-primary to-rose-400" style={{ height: `${h * 0.7}%` }} />
                   </div>
                ))}
             </div>
             <div className="mt-6 flex justify-between px-2 text-[10px] font-black uppercase text-slate-300 italic">
                <span>Janeiro</span><span>Março</span><span>Junho</span><span>Agosto</span><span>Outubro</span><span>Dezembro</span>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-lg font-black italic uppercase text-slate-800">Transações</h3>
             <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-primary">Ver Tudo</Button>
          </div>
          <div className="space-y-6">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn("size-10 rounded-xl flex items-center justify-center text-white", tx.type === 'entrada' ? "bg-green-500" : "bg-rose-500")}>
                    {tx.type === 'entrada' ? <ArrowUpRight className="size-5" /> : <ArrowDownRight className="size-5" />}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-black text-slate-800 truncate uppercase italic leading-none">{tx.description}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className={cn("text-sm font-black tracking-tighter", tx.type === 'entrada' ? "text-green-600" : "text-rose-600")}>
                      {tx.type === 'entrada' ? "+" : "-"} R$ {tx.amount.toFixed(2)}
                   </p>
                   <p className="text-[8px] font-bold text-slate-300 uppercase italic">{tx.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
