"use client"

import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { SubscriptionGuard } from "@/components/dashboard/SubscriptionGuard"
import { useAuth } from "@/hooks/useAuth"
import { Bell, User, Clock, ChevronDown, Search, MessageSquare, ShoppingBag, Volume2, VolumeX, Settings as SettingsIcon } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { usePedidoStore } from "@/store/pedidoStore"
import { usePathname } from "next/navigation"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { initSound, requestNotificationPermission, startAlert, stopAlert } from "@/lib/notifications"
import { BottomNav } from "@/components/dashboard/BottomNav"

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
        <div className="flex h-screen w-full bg-[var(--bg-app)] overflow-hidden">
          {showOnboarding && (
            <OnboardingModal onComplete={() => setShowOnboarding(false)} />
          )}
          <DashboardSidebar>
                <div className="flex-1 overflow-y-auto w-full min-w-0 bg-[var(--bg-app)] flex flex-col relative">
                  {/* Modern Header - Professional & Fluid */}
                  <header className={cn(
                    "h-14 md:h-20 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)] px-4 md:px-8 flex items-center justify-between shrink-0 relative z-20 sticky top-0",
                    isSmartGestao && "hidden md:flex"
                  )}>
                    <div className="flex items-center gap-3 md:gap-6 flex-1 min-w-0">
                      <SidebarTrigger />
                      <div className="hidden lg:flex items-center flex-1 max-w-md relative group">
                        <Search className="absolute left-4 size-4 text-[var(--text-muted)] group-focus-within:text-[var(--secondary)] transition-colors" />
                        <input
                          onClick={() => setCommandOpen(true)}
                          readOnly
                          placeholder="BUSCAR NO SISTEMA (⌘+K)"
                          className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl py-2.5 pl-11 pr-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--secondary)]/20 transition-all cursor-pointer hover:bg-[var(--accent-light)]/50"
                        />
                      </div>
                      
                      {/* Mobile Logo Title */}
                      <div className="lg:hidden flex flex-col">
                        <h1 className="text-xs sm:text-sm font-black italic uppercase tracking-tighter text-[var(--text-primary)] truncate">
                          Doce <span className="text-[var(--secondary)]">Gestão</span>
                        </h1>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 ml-auto">
                      {/* Subscription Info - Large Desktop Only */}
                      <Link
                        href="/dashboard/billing"
                        className="hidden 2xl:flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-light)] border border-[var(--border)] text-[var(--secondary)] font-black text-[10px] uppercase tracking-widest hover:brightness-95 transition-all shrink-0"
                      >
                        <Clock className="size-3 animate-pulse" />
                        <span>{getTrialLabel()}</span>
                      </Link>

                      <div className="h-6 w-px bg-[var(--border)] mx-1 hidden md:block" />

                      <div className="flex items-center gap-1 md:gap-3">
                        {/* Hidden on very small screens to avoid crowding */}
                        <div className="hidden sm:flex items-center gap-1 md:gap-3">
                          <ThemeToggle />
                          
                          <Link href="/dashboard/mensagens">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-9 md:size-10 rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--accent-light)] transition-all shadow-sm"
                            >
                              <MessageSquare size={16} className="md:size-[18px]" />
                            </Button>
                          </Link>
                        </div>

                        <NotificationBell />
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleSound}
                          className={cn(
                            "hidden md:flex size-10 rounded-full border transition-all shadow-sm",
                            soundEnabled 
                              ? "border-[var(--secondary)]/20 bg-[var(--secondary)]/10 text-[var(--secondary)] hover:bg-[var(--secondary)]/20" 
                              : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:bg-[var(--bg-app)]"
                          )}
                        >
                          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                        </Button>

                        <UserAvatarMenu />
                      </div>
                    </div>
                  </header>

                  <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-8">
                    {children}
                  </main>
                  
                  <footer className="hidden md:flex mt-auto h-12 bg-[var(--bg-card)] border-t border-[var(--border)] px-8 items-center justify-between text-[8px] font-bold text-[var(--text-muted)] shrink-0 uppercase tracking-widest">
                    <div className="truncate">© 2026 DOCE GESTÃO <span className="text-[var(--secondary)] font-black ml-2">• PRO</span></div>
                    <div className="opacity-60">SaaS Platinum v4.5</div>
                  </footer>
                </div>
            <BottomNav />
          </DashboardSidebar>
          <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
        </div>
      </SubscriptionGuard>
    </AuthGuard>
  )
}

