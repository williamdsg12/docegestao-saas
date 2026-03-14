"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Wallet, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { cn } from "@/lib/utils"

const stats = [
    { label: "Saldo Atual", value: "R$ 3.580,00", icon: Wallet, iconBg: "bg-primary", trend: "+12%" },
    { label: "Receita (Total)", value: "R$ 5.420,00", icon: TrendingUp, iconBg: "bg-green-500", trend: "+8%" },
    { label: "Custos (CMV)", value: "R$ 1.840,00", icon: TrendingDown, iconBg: "bg-rose-500", trend: "-5%" },
    { label: "Lucro Líquido", value: "R$ 3.580,00", icon: Activity, iconBg: "bg-blue-500", trend: "+15%" },
]

const recentTransactions = [
    { id: 1, description: "Venda Bolo Casamento", amount: 450.00, type: "entrada", category: "Encomendas", date: "Hoje" },
    { id: 2, description: "Compra Insumos", amount: 120.50, type: "saida", category: "Produção", date: "Ontem" },
    { id: 3, description: "Venda 50 Brigadeiros", amount: 150.00, type: "entrada", category: "Pronta Entrega", date: "Há 2 dias" },
]

export function FinanceiroMock() {
    return (
        <div className="w-full h-full bg-[#f8fafc] p-6 overflow-hidden">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase italic leading-none">
                        Gestão <span className="text-primary italic">Financeira</span>
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Visão geral do seu negócio</p>
                </div>
                <div className="flex gap-2">
                    <div className="h-8 w-24 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-[8px] font-black text-green-600 uppercase tracking-widest">Nova Entrada</div>
                    <div className="h-8 w-24 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-[8px] font-black text-rose-600 uppercase tracking-widest">Nova Saída</div>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -top-6 -right-6 size-16 bg-slate-50 rounded-full group-hover:bg-primary/5 transition-colors" />
                        <div className={cn("size-8 rounded-lg flex items-center justify-center text-white mb-3 relative z-10", stat.iconBg)}>
                            <stat.icon className="size-4" />
                        </div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">{stat.label}</p>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight relative z-10">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-black text-slate-800 uppercase italic">Fluxo de Caixa</h3>
                        <div className="flex gap-2">
                            <div className="size-2 rounded-full bg-primary" />
                            <div className="size-2 rounded-full bg-slate-200" />
                        </div>
                    </div>
                    <div className="h-32 flex items-end gap-2">
                        {[40, 60, 45, 80, 55, 90, 70, 85, 65, 100].map((h, i) => (
                            <div key={i} className="flex-1 rounded-t-lg bg-gradient-to-t from-primary to-primary/40" style={{ height: `${h}%` }} />
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                    <h3 className="text-xs font-black text-slate-800 uppercase italic mb-6">Lançamentos Recentes</h3>
                    <div className="space-y-4">
                        {recentTransactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn("size-8 rounded-lg flex items-center justify-center text-white", tx.type === 'entrada' ? "bg-green-500" : "bg-rose-500")}>
                                        {tx.type === 'entrada' ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] font-black text-slate-800 truncate uppercase italic leading-none">{tx.description}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{tx.date}</p>
                                    </div>
                                </div>
                                <p className={cn("text-[10px] font-black tracking-tight", tx.type === 'entrada' ? "text-green-600" : "text-rose-600")}>
                                    {tx.type === 'entrada' ? "+" : "-"} R$ {tx.amount.toFixed(2)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
