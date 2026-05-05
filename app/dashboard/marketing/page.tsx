"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Users, MessageSquare, ShoppingBag, CheckCircle2, 
  TrendingUp, ArrowRight, Share2, Copy, Zap, 
  Clock, Sparkles, Filter, MoreVertical, Search, Bot
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useSalesMachine } from "@/hooks/useSalesMachine"
import { useBusiness } from "@/hooks/useBusiness"
import { toast } from "sonner"

export default function MarketingDashboard() {
  const { business } = useBusiness()
  const { leads, stats, loading, generateSalesMessage } = useSalesMachine()
  const [waText, setWaText] = useState("Olá! Gostaria de ver o cardápio e fazer um pedido.")

  const waLink = `https://wa.me/${business?.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(waText)}`

  const copyLink = () => {
    navigator.clipboard.writeText(waLink)
    toast.success("Link do WhatsApp copiado!")
  }

  const funnelSteps = [
    { label: 'Leads Capturados', value: stats.totalLeads, icon: Users, color: 'bg-blue-500' },
    { label: 'Conversas Iniciadas', value: Math.round(stats.totalLeads * 0.8), icon: MessageSquare, color: 'bg-purple-500' },
    { label: 'Pedidos Criados', value: Math.round(stats.totalLeads * 0.45), icon: ShoppingBag, color: 'bg-amber-500' },
    { label: 'Vendas Convertidas', value: stats.conversions, icon: CheckCircle2, color: 'bg-emerald-500' },
  ]

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
            <h1 className="text-4xl font-black text-[var(--text-primary)] italic tracking-tighter uppercase">Funil de <span className="text-[var(--secondary)]">Vendas</span></h1>
            <p className="text-sm text-[var(--text-muted)] font-medium max-w-xl uppercase tracking-widest text-[10px] font-black">Máquina de Vendas Automática Doce Gestão</p>
        </div>

        <div className="flex items-center gap-3">
            <Button className="h-12 px-8 rounded-2xl bg-[var(--primary)] text-white font-black uppercase text-[10px] shadow-xl hover:translate-y-[-2px] transition-all">
                <Sparkles size={18} className="mr-2" /> IA Booster
            </Button>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {funnelSteps.map((step, i) => (
            <div key={i} className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-[32px] space-y-4 relative overflow-hidden group hover:shadow-xl transition-all">
                <div className={cn("size-12 rounded-2xl flex items-center justify-center text-white shadow-lg", step.color)}>
                    <step.icon size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest italic">{step.label}</p>
                    <h3 className="text-3xl font-black italic tracking-tighter text-[var(--text-primary)]">{step.value}</h3>
                </div>
                <div className="absolute -bottom-4 -right-4 size-20 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all" />
            </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Funnel Analysis */}
        <div className="xl:col-span-2 space-y-8">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[48px] p-8 md:p-12 space-y-10 shadow-premium">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase italic tracking-tighter">Performance do Funil</h3>
                        <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase italic tracking-widest mt-1">Taxa de Conversão: {stats.conversionRate.toFixed(1)}%</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500">
                        <TrendingUp size={16} />
                        <span className="text-[10px] font-black uppercase">+15.2% este mês</span>
                    </div>
                </div>

                <div className="space-y-12">
                    {funnelSteps.map((step, i) => (
                        <div key={i} className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn("size-2 rounded-full", step.color)} />
                                    <span className="text-[11px] font-black text-[var(--text-primary)] uppercase italic">{step.label}</span>
                                </div>
                                <span className="text-sm font-black text-[var(--text-primary)]">{step.value}</span>
                            </div>
                            <Progress value={(step.value / stats.totalLeads) * 100 || 0} className="h-3 rounded-full bg-[var(--bg-app)]" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Recovery Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-rose-600 to-rose-400 rounded-[40px] p-8 text-white space-y-4 shadow-xl">
                    <div className="size-12 bg-white/20 rounded-2xl flex items-center justify-center"><Clock size={24} /></div>
                    <h4 className="text-[11px] font-black uppercase italic tracking-widest">Recuperação de Vendas</h4>
                    <h3 className="text-4xl font-black italic tracking-tighter">R$ {stats.recoveredAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    <p className="text-[10px] font-bold uppercase text-white/70">Valor salvo pelas mensagens automáticas (10m, 1h, 24h)</p>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[40px] p-8 space-y-6">
                    <h4 className="text-[11px] font-black uppercase text-[var(--text-primary)] italic tracking-widest">Próximas Campanhas</h4>
                    <div className="space-y-4">
                        {[
                            { name: "Promoção de Sexta", time: "Hoje, 18:00", active: true },
                            { name: "Reativação 15 Dias", time: "Amanhã, 10:00", active: true }
                        ].map((camp, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-[var(--bg-app)] rounded-2xl border border-[var(--border)]">
                                <div>
                                    <p className="text-[10px] font-black text-[var(--text-primary)] uppercase italic">{camp.name}</p>
                                    <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase mt-1">{camp.time}</p>
                                </div>
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-black uppercase">Agendado</Badge>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Sidebar / Acquisition Tools */}
        <div className="space-y-8">
            {/* WhatsApp Link Generator */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[40px] p-8 space-y-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="size-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Share2 size={20} />
                    </div>
                    <h4 className="text-[11px] font-black uppercase text-[var(--text-primary)] italic tracking-widest">Link Inteligente</h4>
                </div>
                
                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase leading-relaxed">
                    Use este link na Bio do Instagram ou Google para capturar leads automaticamente.
                </p>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mensagem Inicial</label>
                        <Input 
                            value={waText}
                            onChange={(e) => setWaText(e.target.value)}
                            className="bg-[var(--bg-app)] border-[var(--border)] rounded-xl text-[10px] font-bold"
                        />
                    </div>
                    <div className="p-4 bg-[var(--bg-app)] rounded-2xl border border-dashed border-[var(--border)] break-all text-[9px] font-mono text-slate-500">
                        {waLink}
                    </div>
                    <Button onClick={copyLink} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase italic tracking-widest text-[10px] rounded-2xl">
                        Copiar Link <Copy size={14} className="ml-2" />
                    </Button>
                </div>
            </div>

            {/* AI Sales Agent Snippet */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[40px] p-8 text-white space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:rotate-12 transition-transform"><Bot size={80} /></div>
                <div className="relative z-10 space-y-4">
                    <Badge className="bg-white/20 text-white border-none text-[8px] font-black italic px-3">IA VENDEDORA</Badge>
                    <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Gerar Mensagem de Venda</h3>
                    <p className="text-[10px] text-white/70 font-medium leading-relaxed italic">"Oi 😊 hoje temos promoção de bolo de chocolate, quer aproveitar?"</p>
                    <Button className="w-full h-12 bg-white text-indigo-600 font-black uppercase italic tracking-widest text-[10px] rounded-2xl shadow-xl">
                        Gerar com IA <Sparkles size={14} className="ml-2" />
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
