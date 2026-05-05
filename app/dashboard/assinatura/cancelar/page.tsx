"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  AlertCircle, ChevronLeft, Gift, Heart, 
  HelpCircle, MessageSquare, Pause, X, ArrowRight,
  ShieldAlert, Sparkles, Star
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRevenueEngine } from "@/hooks/useRevenueEngine"
import Link from "next/link"

const REASONS = [
  "Achei muito caro",
  "Não estou usando o suficiente",
  "Faltam recursos que eu preciso",
  "Dificuldade técnica",
  "Fechando meu negócio",
  "Mudei para outro sistema",
  "Outro motivo"
]

export default function AntiChurnPage() {
  const [step, setStep] = useState<'reason' | 'offer' | 'final'>('reason')
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [feedback, setFeedback] = useState("")
  const { logChurnAttempt } = useRevenueEngine()

  const handleNext = () => {
    if (!selectedReason) return
    setStep('offer')
  }

  const handleAcceptOffer = async (offerType: string) => {
    await logChurnAttempt(selectedReason!, feedback, offerType)
    setStep('final')
  }

  return (
    <div className="min-h-screen bg-[#020203] flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {step === 'reason' && (
          <motion.div 
            key="reason"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl bg-[#09090b] rounded-[40px] border border-white/10 p-8 md:p-12 space-y-10 shadow-2xl"
          >
            <div className="space-y-4 text-center">
              <div className="size-16 rounded-3xl bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto">
                <Heart size={32} />
              </div>
              <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Poxa, já vai embora?</h1>
              <p className="text-sm text-slate-500 font-medium">Conta pra gente: por que você decidiu cancelar sua assinatura? Queremos muito melhorar.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-[10px] font-black uppercase italic tracking-widest transition-all text-left",
                    selectedReason === reason 
                        ? "bg-rose-500/10 border-rose-500 text-rose-500" 
                        : "bg-white/5 border-transparent text-slate-500 hover:bg-white/10"
                  )}
                >
                  {reason}
                </button>
              ))}
            </div>

            {selectedReason && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <textarea 
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="QUER CONTAR MAIS DETALHES? (OPCIONAL)"
                  className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-xs font-bold text-white placeholder:text-slate-700 focus:ring-rose-500"
                  rows={3}
                />
                <div className="flex gap-4">
                    <Link href="/dashboard/assinatura" className="flex-1">
                        <Button variant="ghost" className="w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500">Mudei de ideia</Button>
                    </Link>
                    <Button 
                        onClick={handleNext}
                        className="flex-[2] h-14 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase italic tracking-widest text-xs rounded-2xl shadow-xl shadow-rose-600/20"
                    >
                        Continuar Cancelamento <ArrowRight className="ml-2 size-4" />
                    </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {step === 'offer' && (
          <motion.div 
            key="offer"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl bg-[#09090b] rounded-[40px] border border-white/10 overflow-hidden shadow-2xl flex flex-col md:flex-row"
          >
            <div className="flex-1 p-8 md:p-12 space-y-8">
                <div className="space-y-4">
                    <Badge className="bg-amber-500/20 text-amber-500 border-none px-3 py-1 text-[8px] font-black uppercase tracking-widest italic">Presente Exclusivo</Badge>
                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Não desista do seu <span className="text-rose-500">sonho!</span></h2>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-md">
                        Sabemos que empreender é difícil. Por isso, preparamos uma condição única para você continuar automatizando sua produção e vendendo mais.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl group hover:bg-emerald-500/20 transition-all cursor-pointer" onClick={() => handleAcceptOffer('discount')}>
                        <div className="size-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                            <Gift size={32} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-[11px] font-black text-white uppercase italic">Cupom de 50% OFF</h4>
                            <p className="text-[9px] text-emerald-500/80 font-bold uppercase">Pelos próximos 3 meses de assinatura.</p>
                        </div>
                        <ArrowRight className="text-emerald-500 group-hover:translate-x-2 transition-transform" />
                    </div>

                    <div className="flex items-center gap-4 p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl group hover:bg-blue-500/20 transition-all cursor-pointer" onClick={() => handleAcceptOffer('pause')}>
                        <div className="size-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Pause size={32} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-[11px] font-black text-white uppercase italic">Congelar Assinatura</h4>
                            <p className="text-[9px] text-blue-500/80 font-bold uppercase">Pause seus pagamentos por 30 dias e mantenha seus dados.</p>
                        </div>
                        <ArrowRight className="text-blue-500 group-hover:translate-x-2 transition-transform" />
                    </div>
                </div>

                <button 
                    onClick={() => handleAcceptOffer('none')}
                    className="text-[9px] font-black text-slate-700 uppercase tracking-[0.2em] italic hover:text-slate-500 transition-colors"
                >
                    Não, quero prosseguir com o cancelamento imediato
                </button>
            </div>

            <div className="w-full md:w-[350px] bg-rose-600 p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-6">
                <div className="size-24 bg-white/20 rounded-[40px] flex items-center justify-center text-white backdrop-blur-md">
                    <Sparkles size={48} />
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Você vai perder:</h3>
                    <ul className="space-y-3">
                        {['Automação de Pedidos', 'Gestão de Clientes', 'Controle de Estoque', 'Relatórios Financeiros'].map(feat => (
                            <li key={feat} className="flex items-center gap-2 text-[10px] font-bold text-white/80 uppercase">
                                <X size={14} className="text-white/40" /> {feat}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
          </motion.div>
        )}

        {step === 'final' && (
          <motion.div 
            key="final"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-[#09090b] rounded-[40px] border border-white/10 p-12 text-center space-y-8 shadow-2xl"
          >
            <div className="size-20 bg-emerald-500/10 rounded-[32px] flex items-center justify-center text-emerald-500 mx-auto">
                <ShieldAlert size={40} />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Solicitação Processada</h2>
                <p className="text-sm text-slate-500 font-medium">Sua solicitação foi registrada. Se você aceitou uma oferta, ela será aplicada em instantes. Caso contrário, sua assinatura será encerrada ao final do ciclo atual.</p>
            </div>
            <Link href="/dashboard">
                <Button className="w-full h-14 bg-white text-black font-black uppercase italic tracking-widest text-xs rounded-2xl">Voltar ao Painel</Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
