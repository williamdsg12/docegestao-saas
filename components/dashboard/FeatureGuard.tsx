"use client"

import { useAuth } from "@/hooks/useAuth"
import { hasFeature } from "@/lib/access-control"
import { motion } from "framer-motion"
import { Lock, Crown, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface FeatureGuardProps {
    children: React.ReactNode
    feature: string
    planRequired?: 'starter' | 'pro' | 'business'
}

export function FeatureGuard({ children, feature, planRequired = 'pro' }: FeatureGuardProps) {
    const userAuth = useAuth()
    const { hasAccess, loadingSubscription, isAdmin } = userAuth

    if (loadingSubscription) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        )
    }

    const isAllowed = hasFeature(userAuth, feature) || isAdmin

    if (!isAllowed) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-white/10"
            >
                <div className="size-20 rounded-3xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mb-6">
                    <Crown className="size-10 text-amber-500" />
                </div>

                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">
                    Recurso Premium
                </h3>
                
                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mb-8">
                    Esta funcionalidade está disponível apenas para assinantes do plano <span className="text-amber-500 font-bold uppercase">{planRequired.toUpperCase()}</span> ou superior.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/dashboard/billing">
                        <Button className="h-12 px-8 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase italic shadow-xl shadow-amber-500/20 flex items-center gap-2">
                            Fazer Upgrade
                            <ArrowRight className="size-4" />
                        </Button>
                    </Link>
                    
                    <Button variant="ghost" className="h-12 px-8 rounded-xl text-slate-500 font-bold uppercase tracking-widest text-xs">
                        Saiba mais
                    </Button>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 w-full flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Lock className="size-3" />
                    Proteção de Recurso SaaS
                </div>
            </motion.div>
        )
    }

    return <>{children}</>
}
