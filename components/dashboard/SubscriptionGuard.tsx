"use client"

import { useAuth } from "@/hooks/useAuth"
import { Lock, CreditCard, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
    const { user, subscription, loadingSubscription } = useAuth()
    const pathname = usePathname()

    const checkIsExpired = () => {
        if (!user) return false
        
        // If has subscription record
        if (subscription) {
            if (subscription.status === 'active') return false
            if (subscription.status === 'expired' || subscription.status === 'canceled') return true
            if (subscription.status === 'trial' && subscription.trial_end) {
                return new Date(subscription.trial_end) < new Date()
            }
        }

        // Fallback to signup date (14 days trial)
        const signupDate = new Date(user.created_at)
        const trialEndDate = new Date(signupDate.getTime() + 14 * 24 * 60 * 60 * 1000)
        return new Date() > trialEndDate
    }

    const isExpired = checkIsExpired()

    // Bypass block if user is on the billing page
    if (pathname === '/dashboard/billing') {
        return <>{children}</>
    }

    if (loadingSubscription) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">Carregando Assinatura...</p>
                </div>
            </div>
        )
    }

    if (isExpired) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-white rounded-[40px] shadow-2xl max-w-lg w-full p-10 text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
                    <div className="absolute -top-24 -right-24 size-48 bg-primary/5 rounded-full blur-3xl" />

                    <div className="size-20 rounded-3xl bg-rose-50 border-2 border-rose-100 flex items-center justify-center mx-auto mb-8">
                        <Lock className="size-10 text-primary" />
                    </div>

                    <h2 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter mb-4">
                        Período de teste expirado
                    </h2>

                    <p className="text-slate-500 font-medium leading-relaxed mb-10">
                        Obrigado por testar o DoceGestão! Para continuar gerenciando sua confeitaria, pedidos e receitas com excelência, escolha um dos nossos planos profissionais.
                    </p>

                    <div className="grid gap-4">
                        <Link href="/dashboard/billing" className="w-full">
                            <Button className="w-full h-14 rounded-2xl bg-primary hover:bg-primary shadow-xl shadow-primary/20 text-white font-black uppercase italic text-lg flex items-center justify-center gap-3">
                                <CreditCard className="size-6" />
                                Escolher um Plano
                                <ArrowRight className="size-6" />
                            </Button>
                        </Link>

                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Acesso bloqueado temporariamente
                        </p>
                    </div>
                </motion.div>
            </div>
        )
    }

    return <>{children}</>
}
