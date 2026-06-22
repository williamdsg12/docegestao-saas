"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Zap, Check, Star, Rocket, ShieldCheck, 
  Crown, ArrowRight, X, Headphones, Sparkles 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface UpsellModalProps {
  isOpen: boolean
  onClose: () => void
  reason?: 'limit_reached' | 'premium_feature' | 'support'
  featureName?: string
}

export function UpsellModal({ isOpen, onClose, reason = 'premium_feature', featureName }: UpsellModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'premium'>('premium')

  if (!isOpen) return null

  const reasons = {
    limit_reached: {
        title: "Você atingiu seu limite!",
        desc: "Seu negócio está crescendo rápido! Para continuar escalando sem interrupções, faça o upgrade agora.",
        icon: Rocket
    },
    premium_feature: {
        title: `Desbloqueie o ${featureName || 'Recurso Premium'}`,
        desc: "Este recurso está disponível apenas para membros do plano Pro e Premium. Leve sua gestão para o próximo nível.",
        icon: Crown
    },
    support: {
        title: "Suporte prioritário 24/7",
        desc: "Precisa de ajuda urgente? Nossos especialistas estão prontos para te atender em minutos nos planos Pro e Premium.",
        icon: Headphones
    }
  }

  const currentReason = reasons[reason]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl bg-[#09090b] rounded-[40px] border border-white/10 shadow-2xl overflow-hidden"
        >
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-rose-500/10 to-transparent pointer-events-none" />
          <div className="absolute -top-24 -left-24 size-64 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

          <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-10 size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col md:flex-row">
            {/* Left Content */}
            <div className="flex-1 p-8 md:p-12 space-y-8 relative z-10">
              <div className="space-y-4">
                <div className="size-16 rounded-3xl bg-rose-500/20 flex items-center justify-center text-rose-500 mb-6 shadow-lg shadow-rose-500/20">
                  <currentReason.icon size={32} />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                    {currentReason.title}
                </h2>
                <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-md">
                  {currentReason.desc}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Vantagens do Upgrade</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    "Pedidos Ilimitados",
                    "Automação de WhatsApp",
                    "Gestão Financeira Pro",
                    "IA de Vendas",
                    "Relatórios Avançados",
                    "Suporte 24/7 VIP"
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="size-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                        <Check size={12} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-300 uppercase">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                    <Sparkles size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-black text-amber-500 uppercase italic">Oferta Limitada</p>
                    <p className="text-[11px] text-white font-medium">Ganhe 15% de desconto no plano anual.</p>
                </div>
              </div>
            </div>

            {/* Right Pricing Sidebar */}
            <div className="w-full md:w-[380px] bg-white/[0.02] border-l border-white/10 p-8 md:p-12 flex flex-col justify-center">
              <div className="space-y-6">
                <div 
                    onClick={() => setSelectedPlan('pro')}
                    className={cn(
                        "p-6 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden",
                        selectedPlan === 'pro' ? "bg-white/5 border-rose-500 shadow-xl" : "bg-transparent border-white/10 grayscale opacity-50 hover:opacity-100 hover:grayscale-0"
                    )}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plano Pro</span>
                        {selectedPlan === 'pro' && <div className="size-4 bg-rose-500 rounded-full flex items-center justify-center"><Check size={10} className="text-white" /></div>}
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xs font-bold text-slate-500">R$</span>
                        <span className="text-3xl font-black text-white italic tracking-tighter">79</span>
                        <span className="text-xs font-bold text-slate-500">/mês</span>
                    </div>
                </div>

                <div 
                    onClick={() => setSelectedPlan('premium')}
                    className={cn(
                        "p-6 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden",
                        selectedPlan === 'premium' ? "bg-white/5 border-rose-500 shadow-xl" : "bg-transparent border-white/10 grayscale opacity-50 hover:opacity-100 hover:grayscale-0"
                    )}
                >
                    <div className="absolute top-0 right-0 px-3 py-1 bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest italic rounded-bl-xl">MAIS POPULAR</div>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Plano Premium</span>
                        {selectedPlan === 'premium' && <div className="size-4 bg-rose-500 rounded-full flex items-center justify-center"><Check size={10} className="text-white" /></div>}
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xs font-bold text-slate-500">R$</span>
                        <span className="text-3xl font-black text-white italic tracking-tighter">149</span>
                        <span className="text-xs font-bold text-slate-500">/mês</span>
                    </div>
                </div>

                <Button className="w-full h-14 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase italic tracking-widest text-sm rounded-2xl shadow-xl shadow-rose-600/20 hover:translate-y-[-4px] transition-all">
                    Quero Evoluir Agora <ArrowRight className="ml-2 size-5" />
                </Button>
                
                <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-widest">
                    Sem fidelidade. Cancele quando quiser.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
