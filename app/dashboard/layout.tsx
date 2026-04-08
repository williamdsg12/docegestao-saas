"use client"

import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { SubscriptionGuard } from "@/components/dashboard/SubscriptionGuard"
import { useAuth } from "@/hooks/useAuth"
import { Bell, User, Clock, ChevronDown, Search } from "lucide-react"
import { UserAvatarMenu } from "@/components/dashboard/user-avatar-menu"
import { differenceInDays } from "date-fns"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { OnboardingModal } from "@/components/dashboard/OnboardingModal"
import { ThemeToggle } from "@/components/dashboard/ThemeToggle"
import { NotificationBell } from "@/components/dashboard/NotificationBell"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { SidebarTrigger } from "@/components/dashboard/sidebar"
import { CommandPalette } from "@/components/dashboard/CommandPalette"

import { AuthGuard } from "@/components/auth/AuthGuard"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, subscription, isAdmin, loadingSubscription } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)

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
    // ... logic preserved (omitted for brevity in replacement but kept in tool call)
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
    <AuthGuard>
      <SubscriptionGuard>
        <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
          {showOnboarding && (
            <OnboardingModal onComplete={() => setShowOnboarding(false)} />
          )}
          <DashboardSidebar>
            <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC]">
              {/* Modern Header - Professional & Clean */}
              <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between shrink-0 relative z-20">
                <div className="flex items-center gap-6 flex-1">
                  <button 
                    onClick={() => setCommandOpen(true)}
                    className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-2xl w-full max-w-md border border-slate-200 hover:bg-slate-200 transition-all group"
                  >
                    <Search className="size-4 text-slate-400 group-hover:text-blue-500" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest text-left flex-1">
                      Pesquisa Inteligente (⌘+K)
                    </span>
                    <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-slate-300 bg-white px-1.5 font-mono text-[10px] font-black text-slate-500">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                  </button>
                  <SidebarTrigger className="md:hidden" />
                </div>

                <div className="flex items-center gap-4">
                  {/* Trial Info - Professional Badge */}
                  <Link
                    href="/dashboard/billing"
                    className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all"
                  >
                    <Clock className="size-3 animate-pulse" />
                    <span>{getTrialLabel()}</span>
                  </Link>

                  <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block" />

                  <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <NotificationBell />
                    <UserAvatarMenu />
                  </div>
                </div>
              </header>

              {/* Standardized Content Area */}
              <div className="flex-1 overflow-y-auto w-full min-w-0">
                <main className="max-w-[1600px] mx-auto px-6 md:px-10 py-8 lg:py-12">
                  {children}
                </main>
              </div>
            </div>
          </DashboardSidebar>
          <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
        </div>
      </SubscriptionGuard>
    </AuthGuard>
  )
}

