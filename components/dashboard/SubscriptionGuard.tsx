"use client"

import { useAuth } from "@/hooks/useAuth"
import { Lock, CreditCard, ArrowRight, CheckCircle2, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
    const { user, subscription, loadingSubscription, isAdmin, hasAccess, plan, daysLeft } = useAuth()
    const pathname = usePathname()

    // Bypass block if user is on the billing/upgrade page, or the SaaS Admin panel
    const isBypassPage = pathname === '/dashboard/billing' || pathname === '/dashboard/upgrade' || pathname === '/dashboard/assinatura' || pathname.startsWith('/admin')
    
    if (loadingSubscription) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">Verificando Assinatura...</p>
                </div>
            </div>
        )
    }

    // Bloqueia QUALQUER USUÁRIO (mesmo admins master testando a loja) caso não tenham plano ativo
    if (!hasAccess && !isBypassPage) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-4 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[48px] shadow-[0_32px_128px_rgba(0,0,0,0.4)] max-w-2xl w-full p-1 md:p-2 relative overflow-hidden ring-1 ring-white/20"
                >
                    {/* Background Accents */}
                    <div className="absolute -top-24 -right-24 size-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-24 -left-24 size-64 bg-pink-500/10 rounded-full blur-3xl" />
                    
                    <div className="p-8 md:p-12 flex flex-col items-center text-center">
                        {/* Icon/Badge */}
                        <motion.div 
                            animate={{ rotate: [0, -5, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            className="size-24 rounded-[32px] bg-gradient-to-br from-primary to-pink-500 p-[2px] shadow-2xl shadow-primary/20 mb-8"
                        >
                            <div className="size-full bg-white dark:bg-slate-900 rounded-[30px] flex items-center justify-center">
                                <Lock className="size-12 text-primary" />
                            </div>
                        </motion.div>

                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter mb-6 leading-none">
                            Seu período de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-500">teste expirou</span>
                        </h2>

                        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg md:text-xl leading-relaxed mb-10 max-w-md">
                            Para continuar gerenciando sua confeitaria com excelência, escolha um dos nossos planos profissionais.
                        </p>

                        {/* Benefits Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-10 text-left">
                            {[
                                "Pedidos Ilimitados",
                                "Relatórios Inteligentes",
                                "Cardápio Digital VIP",
                                "Suporte Prioritário 24/7"
                            ].map((benefit, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + i * 0.1 }}
                                    key={benefit} 
                                    className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
                                >
                                    <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">{benefit}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Main Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 w-full">
                            <Link href="/dashboard/billing" className="flex-1">
                                <Button className="w-full h-16 rounded-2xl bg-gradient-to-r from-primary to-pink-500 hover:from-primary hover:to-pink-600 shadow-2xl shadow-primary/30 text-white font-black uppercase italic text-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 group">
                                    <CreditCard className="size-6 transition-transform group-hover:rotate-12" />
                                    Escolher Plano
                                    <ArrowRight className="size-6 animate-pulse" />
                                </Button>
                            </Link>

                            <Button 
                                variant="outline" 
                                className="h-16 rounded-2xl border-2 border-slate-200 dark:border-white/10 bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 font-black uppercase italic text-lg flex items-center justify-center gap-3 px-8 transition-all hover:scale-[1.02] active:scale-95"
                                onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
                            >
                                <MessageCircle className="size-6" />
                                Suporte
                            </Button>
                        </div>

                        <div className="mt-8 flex items-center justify-center gap-6">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="size-1.5 rounded-full bg-rose-500 animate-ping" />
                                Acesso Bloqueado
                            </span>
                            <span className="h-4 w-px bg-slate-200 dark:bg-white/10" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">
                                7 Dias Grátis no Plano PRO
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }

    return <>{children}</>
}
