"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, MessageCircle, Calendar as CalendarIcon, Info, Crown, ArrowRight, Zap, Target, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface VipModalProps {
    isOpen: boolean
    onClose: () => void
    currentPlan: string
    userId?: string
    tenantId?: string
}

export function VipConsultationModal({ isOpen, onClose, currentPlan, userId, tenantId }: VipModalProps) {
    const [isLogging, setIsLogging] = useState(false)
    const WHATSAPP_NUMBER = "5544998607693" // TODO: Add real number here

    const logInterest = async (actionUrl: string) => {
        setIsLogging(true)
        try {
            if (userId && tenantId) {
                await supabase.rpc('upsert_vip_interest', {
                    p_user_id: userId,
                    p_tenant_id: tenantId,
                    p_current_plan_slug: currentPlan || 'free',
                    p_page_origin: window.location.pathname
                })
            }

            // Wait slightly for UI feedback before redirecting
            setTimeout(() => {
                window.open(actionUrl, '_blank')
                setIsLogging(false)
                onClose()
            }, 600)

        } catch (error) {
            console.error("Ops, error logging interest:", error)
            // Even if it fails, open WhatsApp to not block sale
            window.open(actionUrl, '_blank')
            setIsLogging(false)
            onClose()
        }
    }

    const handleWhatsApp = () => {
        const message = encodeURIComponent(`Olá, quero conhecer o Plano VIP do DoceGestão e desbloquear os recursos premium para minha operação escalar.`)
        logInterest(`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${message}`)
    }

    const handleSchedule = () => {
        // Here you would link to Calendly or similar
        const message = encodeURIComponent(`Olá, gostaria de agendar uma Demonstração Oficial do Plano Premium/VIP do DoceGestão.`)
        logInterest(`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${message}`)
        toast.info("Redirecionando para o time de agendamentos...")
    }

    // Smart Copy based on plan
    const isFree = currentPlan === 'free' || !currentPlan
    const isPro = currentPlan === 'profissional' || currentPlan === 'premium'

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md"
                    />

                    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white pointer-events-auto rounded-[40px] w-full max-w-lg shadow-2xl relative overflow-hidden"
                        >
                            {/* Header Gradient */}
                            <div className="h-40 bg-gradient-to-br from-slate-900 to-slate-800 relative flex items-center justify-center overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><Crown size={120} /></div>
                                <div className="absolute top-[-50%] left-[-20%] size-64 bg-rose-500/20 blur-[100px] rounded-full" />

                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="size-16 rounded-[24px] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl rotate-3 mb-3">
                                        <Crown size={32} />
                                    </div>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white leading-none">Status <span className="text-rose-500">Premium</span></h2>
                                </div>
                            </div>

                            <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-20 bg-slate-900/20 p-2 rounded-full backdrop-blur-md"><X size={20} /></button>

                            {/* Content area */}
                            <div className="p-8 pt-8 text-center space-y-6">

                                {/* Dynamic Urgency Warning */}
                                {isFree && (
                                    <div className="bg-amber-50 text-amber-600 rounded-2xl p-4 flex gap-3 text-left items-start mb-6 border border-amber-100">
                                        <Zap className="size-5 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">Crescimento Limitado</p>
                                            <p className="text-[11px] font-medium leading-relaxed opacity-90">O seu negócio pode vender o triplo! Sem o módulo de IA seu fluxo continuará manual.</p>
                                        </div>
                                    </div>
                                )}

                                {!isFree && !isPro && (
                                    <div className="bg-slate-50 text-slate-600 rounded-2xl p-4 flex gap-3 text-left items-start mb-6 border border-slate-100">
                                        <Target className="size-5 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">Passo Profissional</p>
                                            <p className="text-[11px] font-medium leading-relaxed opacity-90">Você está a poucos passos do nível mais cobiçado. Eleve totalmente o nível.</p>
                                        </div>
                                    </div>
                                )}

                                <h3 className="text-xl font-black text-slate-900 leading-tight">Pronto para dominar seu mercado como um Verdadeiro VIP?</h3>

                                <div className="grid grid-cols-2 gap-3 pb-8 pt-2">
                                    {["Pedidos ilimitados", "IA de Precificação", "Multi-usuários", "Treinamento VIP", "Consultoria extra", "Suporte VIP 24h"].map((benefit, i) => (
                                        <div key={i} className="flex items-center gap-2 text-left">
                                            <div className="size-4 shrink-0 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center"><Check size={10} strokeWidth={4} /></div>
                                            <span className="text-[11px] font-bold text-slate-600 leading-none">{benefit}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Call to Actions */}
                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <Button
                                        onClick={handleWhatsApp}
                                        disabled={isLogging}
                                        className="w-full h-14 bg-[#25D366] hover:bg-[#20BE5C] hover:translate-y-[-2px] transition-all duration-300 text-white rounded-2xl flex items-center justify-center gap-3 shadow-[0_10px_40px_-10px_rgba(37,211,102,0.5)] group font-black text-[12px] uppercase tracking-widest"
                                    >
                                        {isLogging ? <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                                            <>
                                                <MessageCircle size={18} />
                                                Falar no WhatsApp
                                                <ArrowRight size={16} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        onClick={handleSchedule}
                                        disabled={isLogging}
                                        variant="outline"
                                        className="w-full h-12 bg-white hover:bg-slate-50 border-slate-200 text-slate-700 rounded-2xl flex items-center justify-center gap-2 shadow-sm font-black text-[10px] uppercase tracking-widest"
                                    >
                                        <CalendarIcon size={14} /> Agendar Demonstração
                                    </Button>
                                </div>

                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}
