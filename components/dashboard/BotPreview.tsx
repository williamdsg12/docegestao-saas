"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, User, Bot, Check, ArrowRight, Play, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const FLOW_STEPS = [
  {
    sender: 'user',
    content: "Oi! Quero ver o cardápio e fazer um pedido.",
    delay: 0
  },
  {
    sender: 'bot',
    content: "Oi 😊 Seja muito bem-vinda à Doce Gestão! Sou seu assistente virtual. Como posso te ajudar hoje?",
    options: ["Ver Cardápio 🍰", "Fazer Pedido 🛒", "Falar com Atendente 👤"],
    delay: 1000
  },
  {
    sender: 'user',
    content: "Fazer Pedido 🛒",
    delay: 2000
  },
  {
    sender: 'bot',
    content: "Ótima escolha! Qual o sabor você deseja hoje? Temos Bolo de Chocolate, Red Velvet e Cenoura com Brigadeiro.",
    delay: 1000
  },
  {
    sender: 'user',
    content: "Chocolate! 🍫",
    delay: 1500
  },
  {
    sender: 'bot',
    content: "Perfeito! O Bolo de Chocolate Belga está saindo por R$ 45,00. Deseja adicionar um Kit de Brigadeiros por apenas +R$ 15,00? 🎉",
    delay: 1200
  }
]

export function BotPreview() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const resetFlow = () => {
    setCurrentStep(0)
    setIsPlaying(false)
  }

  const nextStep = () => {
    if (currentStep < FLOW_STEPS.length - 1) {
        setCurrentStep(prev => prev + 1)
    } else {
        setIsPlaying(false)
    }
  }

  return (
    <div className="bg-[#09090b] rounded-[40px] border border-white/10 overflow-hidden shadow-2xl flex flex-col h-[600px] w-full max-w-md mx-auto">
      {/* Header */}
      <div className="p-6 bg-black/40 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                <Bot size={24} />
            </div>
            <div>
                <h4 className="text-[11px] font-black uppercase text-white italic tracking-widest">Simulador de Bot</h4>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Fluxo Automatizado WhatsApp</p>
            </div>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => setIsPlaying(!isPlaying)} variant="ghost" size="icon" className="size-8 rounded-lg bg-white/5 text-emerald-500 hover:bg-emerald-500/20">
                {isPlaying ? <RefreshCcw className="size-4 animate-spin" /> : <Play className="size-4" />}
            </Button>
            <Button onClick={resetFlow} variant="ghost" size="icon" className="size-8 rounded-lg bg-white/5 text-slate-500">
                <RefreshCcw className="size-4" />
            </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white/[0.02]">
        {FLOW_STEPS.slice(0, currentStep + 1).map((step, i) => (
            <motion.div
                key={i}
                initial={{ opacity: 0, x: step.sender === 'bot' ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                    "flex gap-3 max-w-[85%]",
                    step.sender === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
            >
                <div className={cn(
                    "size-8 rounded-xl shrink-0 flex items-center justify-center",
                    step.sender === 'bot' ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-400"
                )}>
                    {step.sender === 'bot' ? <Bot size={18} /> : <User size={18} />}
                </div>
                <div className="space-y-2">
                    <div className={cn(
                        "p-4 rounded-3xl shadow-lg",
                        step.sender === 'bot' 
                            ? "bg-white/5 border border-white/10 text-white rounded-tl-none" 
                            : "bg-emerald-600 text-white rounded-tr-none"
                    )}>
                        <p className="text-[11px] leading-relaxed font-medium">{step.content}</p>
                    </div>
                    {step.options && (
                        <div className="flex flex-wrap gap-2 pt-1">
                            {step.options.map(opt => (
                                <div key={opt} className="px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-[9px] font-black text-white uppercase italic">
                                    {opt}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        ))}
      </div>

      {/* Control Footer */}
      <div className="p-6 bg-black/40 border-t border-white/10 flex items-center justify-center">
        {currentStep < FLOW_STEPS.length - 1 ? (
            <Button 
                onClick={nextStep}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase italic tracking-widest text-[10px] rounded-2xl h-10 px-8"
            >
                Próxima Etapa <ArrowRight className="ml-2 size-4" />
            </Button>
        ) : (
            <div className="flex items-center gap-2 text-emerald-500 font-black uppercase italic text-[10px] tracking-widest">
                <Check size={16} /> Fluxo Finalizado
            </div>
        )}
      </div>
    </div>
  )
}
