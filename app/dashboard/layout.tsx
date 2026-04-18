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
import { cn } from "@/lib/utils"
import { Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePedidoStore } from "@/store/pedidoStore"

import { usePathname } from "next/navigation"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { initSound, requestNotificationPermission, startAlert, stopAlert } from "@/lib/notifications"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, subscription, isAdmin, loadingSubscription } = useAuth()
  
  // Routes that should NOT show the standard sidebar (Smart Gestão)
  const isSmartGestao = pathname?.includes('/dashboard/gestao') || 
                       pathname?.includes('/dashboard/estoque') || 
                       pathname?.includes('/dashboard/lista-compras') || 
                       pathname?.includes('/dashboard/producao')
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
                <div className="flex-1 overflow-y-auto w-full min-w-0 bg-[#F8FAFC]">
                  {/* Modern Header - Professional & Fluid */}
                  <header className={cn(
                    "h-[var(--min-tap-target)] md:h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0 relative z-20 sticky top-0",
                    isSmartGestao && "hidden md:flex"
                  )}>
                    <div className="flex items-center gap-3 md:gap-6 flex-1 min-w-0">
                      <SidebarTrigger />
                      <button
                        onClick={() => setCommandOpen(true)}
                        className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-2xl w-full max-w-xs border border-slate-200 hover:bg-slate-200 transition-all group"
                      >
                        <Search className="size-4 text-slate-400 group-hover:text-blue-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left flex-1">
                          BUSCAR (⌘+K)
                        </span>
                      </button>
                      <div className="lg:hidden">
                        <h1 className="text-sm font-black italic uppercase tracking-tighter text-slate-900 truncate">
                          Doce <span className="text-pink-500">Gestão</span>
                        </h1>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 ml-auto">
                      {/* Subscription Info - Desktop Only */}
                      <Link
                        href="/dashboard/billing"
                        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all shrink-0"
                      >
                        <Clock className="size-3 animate-pulse" />
                        <span>{getTrialLabel()}</span>
                      </Link>

                      <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block" />

                      <div className="flex items-center gap-2 md:gap-3">
                        <ThemeToggle />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleSound}
                          className={cn(
                            "size-10 rounded-full border transition-all shadow-sm",
                            soundEnabled ? "border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100"
                          )}
                        >
                          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                        </Button>
                        <NotificationBell />
                        <UserAvatarMenu />
                      </div>
                    </div>
                  </header>

                  <main className="max-w-[1600px] mx-auto p-[var(--space-sm)] md:p-[var(--space-lg)]">
                    {children}
                  </main>
                  
                  <footer className="mt-auto h-12 bg-white border-t border-slate-200 px-4 md:px-8 flex items-center justify-between text-[8px] font-bold text-slate-400 shrink-0 uppercase tracking-widest">
                    <div className="truncate">© 2026 DOCE GESTÃO <span className="text-pink-500 font-black ml-2">• PRO</span></div>
                    <div className="hidden sm:block opacity-60">SaaS Platinum v4.5</div>
                  </footer>
                </div>
          </DashboardSidebar>
          <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
        </div>
      </SubscriptionGuard>
    </AuthGuard>
  )
}

