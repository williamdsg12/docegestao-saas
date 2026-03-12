"use client"

import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { SubscriptionGuard } from "@/components/dashboard/SubscriptionGuard"
import { useAuth } from "@/hooks/useAuth"
import { Bell, User, Clock, ChevronDown } from "lucide-react"
import { UserAvatarMenu } from "@/components/dashboard/user-avatar-menu"
import { differenceInDays } from "date-fns"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { OnboardingModal } from "@/components/dashboard/OnboardingModal"
import { useState, useEffect } from "react"
import { toast } from "sonner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, subscription, isAdmin, loadingSubscription } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Update showOnboarding if user data changes later (e.g. after login)
  useEffect(() => {
    if (user && !isAdmin && !loadingSubscription) {
      const hasCompleted = user.user_metadata?.has_completed_onboarding === true
      if (!hasCompleted) {
        setShowOnboarding(true)
      }
    }
  }, [user, isAdmin, loadingSubscription])

  const calculateDaysLeft = () => {
    if (subscription?.trial_end) {
      return differenceInDays(new Date(subscription.trial_end), new Date())
    }
    if (user?.created_at) {
      const signupDate = new Date(user.created_at)
      const trialEndDate = new Date(signupDate.getTime() + 14 * 24 * 60 * 60 * 1000)
      return differenceInDays(trialEndDate, new Date())
    }
    return 14
  }

  const daysLeft = calculateDaysLeft()

  const getTrialLabel = () => {
    if (daysLeft > 1) return `${daysLeft} Dias de Teste - Seja PRO!`
    if (daysLeft === 1) return `Último dia de Teste! - Seja PRO!`
    if (daysLeft === 0) return `Teste Expirando hoje! - Seja PRO!`
    return `Teste Expirado - Assine PRO!`
  }

  return (
    <SubscriptionGuard>
      <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
        {showOnboarding && (
          <OnboardingModal onComplete={() => setShowOnboarding(false)} />
        )}
        <DashboardSidebar>
          <div className="flex flex-col h-full">
            {/* Header with soft pink gradient - Refined Style */}
            <header className="h-20 bg-gradient-to-r from-[#FBCFE8] via-[#F472B6] to-[#FBCFE8] px-8 flex items-center justify-between shrink-0 shadow-lg relative z-20 transition-all duration-500">
              <div className="flex flex-col">
                <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">Dashboard</h1>
                <p className="text-[10px] text-pink-700 font-bold uppercase tracking-widest">Bem-vindo de volta!</p>
              </div>

              {/* Trial Banner - Clickable Link to Billing */}
              <Link
                href="/dashboard/billing"
                className="hidden md:flex items-center gap-2 px-6 py-2 rounded-full bg-white/40 backdrop-blur-md border border-white/60 text-pink-900 font-black text-sm transition-all hover:bg-white/60 hover:scale-105 active:scale-95 cursor-pointer italic shadow-sm group"
              >
                <Clock className="size-4 animate-pulse text-pink-600 group-hover:rotate-12 transition-transform" />
                <span>{getTrialLabel()}</span>
              </Link>

              <div className="flex items-center gap-6">
                <button className="relative text-pink-700 hover:text-pink-900 transition-colors">
                  <Bell className="size-6" />
                  <span className="absolute -top-1 -right-1 size-2 bg-pink-500 rounded-full border-2 border-[#FBCFE8]" />
                </button>

                <UserAvatarMenu variant="transparent" />
              </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 xl:p-10">
              <div className="max-w-[1400px] mx-auto">
                {children}
              </div>
            </div>
          </div>
        </DashboardSidebar>
      </div>
    </SubscriptionGuard>
  )
}
