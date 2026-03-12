"use client"

import { useAuth } from "@/hooks/useAuth"
import { AlertCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { differenceInDays } from "date-fns"

export function TrialBanner() {
    const { subscription, loadingSubscription } = useAuth()

    if (loadingSubscription || !subscription || subscription.status !== 'trial') {
        return null
    }

    const daysLeft = differenceInDays(new Date(subscription.trial_end), new Date())

    if (daysLeft < 0) return null

    return (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium text-primary">
            <div className="flex items-center gap-2">
                <Clock className="size-4 animate-pulse" />
                <span>
                    Você está no período de teste.
                    <span className="font-bold ml-1">Faltam {daysLeft} dias para expirar.</span>
                </span>
            </div>
            <Link href="/dashboard/configuracoes?tab=plano">
                <Button variant="link" className="h-auto p-0 text-primary font-black uppercase text-xs hover:no-underline underline-offset-4 decoration-2">
                    Assinar agora
                </Button>
            </Link>
        </div>
    )
}
