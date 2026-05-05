"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Send, Bot, User, Loader2, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AIChatAssistantProps {
  onProcess: (data: any) => void
}

export function AIChatAssistant({ onProcess }: AIChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState<any[]>([
    { role: 'bot', text: 'Oi! Sou seu assistente Doce Gestão. Me diga o que usou na receita que eu calculo tudo pra você!' }
  ])

  const handleSend = () => {
    if (!input.trim()) return

    const newMessages = [...messages, { role: 'user', text: input }]
    setMessages(newMessages)
    setInput("")
    setIsTyping(true)

    // Simulated AI Intelligence
    setTimeout(() => {
      let response = ""
      let detectedData: any = null

      if (input.toLowerCase().includes("leite condensado")) {
        response = "Entendi! Identifiquei Leite Condensado e outros itens. Já preenchi os custos básicos para 12 potes de 220g. O lucro sugerido é de R$ 8,48 por pote!"
        detectedData = {
          yieldPots: 12,
          gramsPerPot: 220,
          detectedItems: true
        }
      } else {
        response = "Legal! Processando sua receita... Baseado nos ingredientes comuns, seu custo unitário ficou em R$ 5,42. Deseja aplicar 100% de margem?"
      }

      setMessages(prev => [...prev, { role: 'bot', text: response }])
      setIsTyping(false)
      if (detectedData) onProcess(detectedData)
    }, 1500)
  }

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-10 right-10 size-20 rounded-[30px] bg-slate-900 hover:bg-slate-800 text-white shadow-2xl shadow-slate-500/40 flex flex-col items-center justify-center gap-1 group z-50 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-[#FF2F81] to-transparent opacity-0 group-hover:opacity-20 transition-opacity" />
        <Sparkles className="size-6 text-[#FF2F81] animate-pulse" />
        <span className="text-[8px] font-black uppercase tracking-widest">Calcular IA</span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-32 right-10 w-[400px] bg-white rounded-[40px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] z-50 border-4 border-slate-900 overflow-hidden flex flex-col h-[550px]"
          >
            <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-[#FF2F81] flex items-center justify-center">
                     <Bot className="size-6 text-white" />
                  </div>
                  <div>
                     <h3 className="font-black uppercase italic tracking-tight text-xl">Doce IA</h3>
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Inteligência de Precificação</p>
                  </div>
               </div>
               <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10 rounded-full">
                  <span className="text-xl">×</span>
               </Button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-6 no-scrollbar">
               {messages.map((m, i) => (
                 <div key={i} className={cn("flex gap-3", m.role === 'user' ? "flex-row-reverse" : "")}>
                    <div className={cn("size-8 rounded-xl flex items-center justify-center shrink-0", m.role === 'bot' ? "bg-pink-50 text-[#FF2F81]" : "bg-slate-100 text-slate-400")}>
                       {m.role === 'bot' ? <Bot size={14} /> : <User size={14} />}
                    </div>
                    <div className={cn(
                      "p-5 rounded-[24px] text-xs font-bold leading-relaxed shadow-sm",
                      m.role === 'bot' ? "bg-slate-50 text-slate-700 rounded-tl-none" : "bg-[#FF2F81] text-white rounded-tr-none"
                    )}>
                       {m.text}
                    </div>
                 </div>
               ))}
               {isTyping && (
                 <div className="flex gap-3">
                    <div className="size-8 rounded-xl bg-pink-50 text-[#FF2F81] flex items-center justify-center shrink-0"><Bot size={14} /></div>
                    <div className="bg-slate-50 p-4 rounded-[24px] rounded-tl-none"><Loader2 className="size-4 animate-spin text-slate-300" /></div>
                 </div>
               )}
            </div>

            <div className="p-8 border-t border-slate-50">
               <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-[28px] focus-within:ring-2 focus-within:ring-pink-100 transition-all">
                  <input 
                    className="flex-1 bg-transparent border-none outline-none px-6 text-xs font-bold text-slate-700 placeholder:text-slate-300"
                    placeholder="Ex: Usei 2 latas leite cond..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                  />
                  <Button 
                    onClick={handleSend}
                    size="icon" 
                    className="size-12 rounded-full bg-slate-900 hover:bg-[#FF2F81] text-white transition-all shadow-xl"
                  >
                    <Send size={18} />
                  </Button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
