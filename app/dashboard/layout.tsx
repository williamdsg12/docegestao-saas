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
import { BottomNav } from "@/components/dashboard/BottomNav"
import { cn } from "@/lib/utils"
import { Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePedidoStore } from "@/store/pedidoStore"

import { AuthGuard } from "@/components/auth/AuthGuard"
import { initSound, requestNotificationPermission, startAlert, stopAlert } from "@/lib/notifications"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, subscription, isAdmin, loadingSubscription } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)

  const novoPedido = usePedidoStore(s => s.novoPedido)
  // usePedidoSound removido para usar o novo sistema nativo em notifications.ts

  const pedidos = usePedidoStore(s => s.pedidos)

  useEffect(() => {
    const saved = localStorage.getItem("order_sound_enabled")
    if (saved !== null) {
      setSoundEnabled(saved === "true")
    }
  }, [])

  // Efeito reativo para controlar o som baseado nos pedidos pendentes
  useEffect(() => {
    if (!soundEnabled) {
      stopAlert()
      return
    }

    const temPedidosPendentes = pedidos.some(p => p.status === 'novo' || p.status === 'pending')
    
    if (temPedidosPendentes) {
      startAlert()
    } else {
      stopAlert()
    }
  }, [pedidos, soundEnabled])

  const toggleSound = async () => {
    const newState = !soundEnabled
    
    if (newState) {
      // Gesto do usuário para inicializar áudio e pedir permissão
      const soundOk = await initSound()
      const pushOk = await requestNotificationPermission()
      
      if (soundOk && pushOk) {
        toast.success("Sistema de Alertas iFood Ativado! 🔔🔊")
      } else if (soundOk) {
        toast.warning("Som ativado, mas as notificações push foram bloqueadas.")
      }
    }

    setSoundEnabled(newState)
    localStorage.setItem("order_sound_enabled", String(newState))
    if (!newState) {
      stopAlert()
      toast.info("Som de alerta desativado")
    }
  }

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
    // ... logic preserved
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
              {/* Modern Header - Fully Responsive */}
              <header className="h-14 sm:h-16 lg:h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-3 sm:px-4 md:px-6 lg:px-8 flex items-center justify-between shrink-0 relative z-20">
                <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 flex-1 min-w-0">
                  <SidebarTrigger className="md:hidden shrink-0" />
                  
                  {/* Search - Desktop/Tablet */}
                  <button
                    onClick={() => setCommandOpen(true)}
                    className="hidden md:flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 bg-slate-100 rounded-xl lg:rounded-2xl w-full max-w-xs lg:max-w-md border border-slate-200 hover:bg-slate-200 transition-all group"
                  >
                    <Search className="size-4 text-slate-400 group-hover:text-blue-500 shrink-0" />
                    <span className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-wider lg:tracking-widest text-left flex-1 truncate">
                      Pesquisar
                    </span>
                    <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border border-slate-300 bg-white px-1.5 font-mono text-[10px] font-black text-slate-500">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                  </button>
                  
                  {/* Mobile Search Icon */}
                  <button
                    onClick={() => setCommandOpen(true)}
                    className="md:hidden flex items-center justify-center size-9 bg-slate-100 rounded-xl border border-slate-200 hover:bg-slate-200 transition-all"
                  >
                    <Search className="size-4 text-slate-500" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-4">
                  {/* Trial Info - Desktop only */}
                  <Link
                    href="/dashboard/billing"
                    className="hidden xl:flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[9px] lg:text-[10px] uppercase tracking-wider lg:tracking-widest hover:bg-amber-100 transition-all"
                  >
                    <Clock className="size-3 animate-pulse shrink-0" />
                    <span className="truncate max-w-[140px] lg:max-w-none">{getTrialLabel()}</span>
                  </Link>

                  <div className="h-6 lg:h-8 w-px bg-slate-200 mx-1 lg:mx-2 hidden lg:block" />

                  <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-3">
                    <ThemeToggle />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleSound}
                      className={cn(
                        "size-8 sm:size-9 lg:size-10 rounded-full border transition-all shadow-sm",
                        soundEnabled ? "border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100"
                      )}
                      title={soundEnabled ? "Som Ativo" : "Som Mudo"}
                    >
                      {soundEnabled ? <Volume2 className="size-4 sm:size-5" strokeWidth={3} /> : <VolumeX className="size-4 sm:size-5" />}
                    </Button>
                    <NotificationBell />
                    <UserAvatarMenu />
                  </div>
                </div>
              </header>

              {/* Responsive Content Area */}
              <div className="flex-1 overflow-y-auto w-full min-w-0">
                <main className="max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 lg:py-8 xl:py-10 pb-20 md:pb-8">
                  {children}
                </main>
              </div>
              
              {/* Bottom Navigation - Mobile Only */}
              <BottomNav />
            </div>
          </DashboardSidebar>
          <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
        </div>
      </SubscriptionGuard>
    </AuthGuard>
  )
}

