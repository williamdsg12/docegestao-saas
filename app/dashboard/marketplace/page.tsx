"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  ShoppingBag, Sparkles, Zap, BookOpen, 
  Search, Filter, ArrowRight, Star, 
  CheckCircle2, CreditCard, Layout, Bot
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const ITEMS = [
  {
    id: '1',
    title: "Pack Confeitaria Premium",
    desc: "10 templates de cardápio otimizados para conversão e redes sociais.",
    price: 49.90,
    type: "template",
    icon: Layout,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    popular: true
  },
  {
    id: '2',
    title: "IA Sales Booster",
    desc: "500 créditos de mensagens geradas por IA para seus clientes.",
    price: 29.00,
    type: "ai_credits",
    icon: Bot,
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  },
  {
    id: '3',
    title: "Automação WhatsApp",
    desc: "Recuperação automática de boletos e carrinhos abandonados.",
    price: 97.00,
    type: "automation",
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-500/10"
  },
  {
    id: '4',
    title: "Gestão de Entregas Pro",
    desc: "Módulo avançado de logística com rastreamento em tempo real.",
    price: 39.90,
    type: "automation",
    icon: ShoppingBag,
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  }
]

export default function MarketplacePage() {
  const [filter, setFilter] = useState('Todos')

  const filteredItems = ITEMS.filter(item => {
    if (filter === 'Todos') return true
    return item.type === filter.toLowerCase()
  })

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
            <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black text-[var(--text-primary)] italic tracking-tighter uppercase">Marketplace</h1>
                <Badge variant="outline" className="bg-[var(--secondary)]/10 text-[var(--secondary)] border-[var(--secondary)]/20 text-[10px] font-black italic px-3">STORE</Badge>
            </div>
            <p className="text-sm text-[var(--text-muted)] font-medium max-w-xl">
                Turbine seu negócio com recursos extras, templates profissionais e automações de inteligência artificial.
            </p>
        </div>

        <div className="flex items-center gap-3">
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl flex items-center gap-4 shadow-sm">
                <div className="size-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <Sparkles size={20} />
                </div>
                <div>
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Seus Créditos IA</p>
                    <p className="text-lg font-black text-[var(--text-primary)] italic tracking-tighter">1,240 <span className="text-[10px] text-slate-500">pts</span></p>
                </div>
            </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
            {['Todos', 'Template', 'AI_Credits', 'Automation'].map((f) => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                        "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                        filter === f 
                            ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-[var(--primary)]/20" 
                            : "bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--accent-light)]"
                    )}
                >
                    {f.replace('_', ' ')}
                </button>
            ))}
        </div>

        <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)] group-focus-within:text-[var(--secondary)] transition-colors" />
            <Input 
                placeholder="BUSCAR NA LOJA..." 
                className="h-12 pl-11 rounded-2xl bg-[var(--bg-card)] border-[var(--border)] text-[10px] font-black uppercase tracking-widest"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredItems.map((item, i) => (
            <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[var(--bg-card)] rounded-[40px] border border-[var(--border)] p-8 space-y-6 flex flex-col group relative overflow-hidden hover:shadow-2xl hover:translate-y-[-8px] transition-all duration-500"
            >
                {item.popular && (
                    <div className="absolute top-0 right-0 px-4 py-1.5 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest italic rounded-bl-2xl">Mais Vendido</div>
                )}

                <div className={cn("size-16 rounded-3xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg", item.bg, item.color)}>
                    <item.icon size={32} />
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-black text-[var(--text-primary)] uppercase italic tracking-tighter leading-none group-hover:text-[var(--secondary)] transition-colors">{item.title}</h3>
                    <p className="text-[11px] text-[var(--text-muted)] font-medium leading-relaxed">{item.desc}</p>
                </div>

                <div className="space-y-4 mt-auto">
                    <div className="flex items-baseline gap-1">
                        <span className="text-xs font-bold text-[var(--text-muted)]">R$</span>
                        <span className="text-4xl font-black text-[var(--text-primary)] italic tracking-tighter">{item.price.toFixed(2).split('.')[0]}</span>
                        <span className="text-xs font-bold text-[var(--text-muted)]">,{item.price.toFixed(2).split('.')[1]}</span>
                    </div>

                    <Button 
                        onClick={() => toast.success(`${item.title} adicionado! Finalize no checkout.`)}
                        className="w-full h-12 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black uppercase italic tracking-widest text-[10px] rounded-2xl shadow-xl shadow-[var(--primary)]/20"
                    >
                        Adicionar Agora <ArrowRight size={16} className="ml-2" />
                    </Button>
                </div>
            </motion.div>
        ))}
      </div>

      {/* Featured Banner */}
      <div className="bg-gradient-to-r from-rose-600 to-rose-400 rounded-[48px] p-10 md:p-16 flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-white/10 skew-x-[-20deg] translate-x-20 pointer-events-none" />
        <div className="flex-1 space-y-6 relative z-10 text-center md:text-left">
            <Badge className="bg-white/20 text-white border-none px-4 py-1 text-[10px] font-black uppercase tracking-widest italic">Lançamento</Badge>
            <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-[0.9]">Seu Negócio no <br/> <span className="text-amber-300">Piloto Automático</span></h2>
            <p className="text-white/80 font-medium text-sm md:text-lg max-w-xl">
                O Pack de Automação de IA analisa seus pedidos e envia mensagens personalizadas de agradecimento e promoções exclusivas sem você precisar digitar uma letra.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button 
                    onClick={() => toast.info("Módulo de Automação IA em breve!")}
                    className="h-14 px-10 bg-white text-rose-600 font-black uppercase italic tracking-widest text-xs rounded-2xl shadow-xl hover:translate-y-[-4px] transition-all"
                >
                    Desbloquear Agora
                </Button>
                <Button 
                    variant="ghost" 
                    onClick={() => window.location.href = '/dashboard/tutoriais'}
                    className="h-14 px-10 text-white font-black uppercase tracking-widest text-xs rounded-2xl border border-white/20 hover:bg-white/10 transition-all"
                >
                    Ver Detalhes
                </Button>
            </div>
        </div>
        <div className="size-64 md:size-96 bg-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center relative animate-pulse">
            <Sparkles size={120} className="text-white/20" />
            <div className="absolute inset-0 flex items-center justify-center">
                <Bot size={180} className="text-white drop-shadow-2xl" />
            </div>
        </div>
      </div>
    </div>
  )
}
