"use client"

import { useState, useEffect, createContext, useContext, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  UtensilsCrossed,
  BookOpen,
  Package,
  Users,
  ClipboardList,
  ShoppingCart,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Wallet,
  BarChart3,
  Coffee,
  Crown,
  Calculator,
  Ticket,
  Printer,
  Menu,
  Award,
  Palette,
  FileText,
  MessageSquare,
  Megaphone,
  ShoppingBag,
  Bot,
  ShieldCheck
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import { usePedidoStore } from "@/store/pedidoStore"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { hasFeature } from "@/lib/access-control"
import { supabase } from "@/lib/supabase"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const menuGroups = [
  {
    name: "Principal",
    icon: LayoutDashboard,
    items: [
      { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard", feature: "dashboard" },
      { name: "Pedidos", icon: ShoppingBag, path: "/dashboard/pedidos", feature: "pedidos" },
      { name: "Mensagens", icon: MessageSquare, path: "/dashboard/mensagens", feature: "dashboard", badge: "2" },
    ]
  },
  {
    name: "Gestão",
    icon: Package,
    items: [
      { name: "Clientes", icon: Users, path: "/dashboard/clientes", feature: "clientes" },
      { name: "Produtos (Catálogo)", icon: Coffee, path: "/dashboard/menu", feature: "menu" },
      { name: "Estoque (Insumos)", icon: UtensilsCrossed, path: "/dashboard/estoque", feature: "ingredientes" },
      { name: "Receitas", icon: BookOpen, path: "/dashboard/receitas", feature: "receitas" },
      { name: "Mesas", icon: UtensilsCrossed, path: "/dashboard/mesas", feature: "pedidos" },
    ]
  },
  {
    name: "Crescimento",
    icon: Megaphone,
    items: [
      { name: "Marketing & VIP", icon: Megaphone, path: "/dashboard/marketing", feature: "marketing" },
      { name: "Configurar Robô", icon: Bot, path: "/dashboard/chatbot", feature: "marketing" },
      { name: "Relatórios", icon: BarChart3, path: "/dashboard/relatorios", feature: "relatorios" },
    ]
  },
  {
    name: "Financeiro",
    icon: Wallet,
    items: [
      { name: "Fluxo de Caixa", icon: Wallet, path: "/dashboard/financeiro", feature: "financeiro" },
      { name: "Configuração de Recebimentos", icon: ShieldCheck, path: "/dashboard/financeiro/recebimentos", feature: "financeiro" },
      { name: "Precificação", icon: Calculator, path: "/dashboard/precificacao-inteligente", badge: "Novo", feature: "precificacao" },
      { name: "Assinatura", icon: Crown, path: "/dashboard/assinatura", feature: "assinatura" },
    ]
  },
  {
    name: "Configurações",
    icon: Settings,
    items: [
      { name: "Ajustes do Sistema", icon: Settings, path: "/dashboard/settings", feature: "perfil" },
      { name: "Visual Premium", icon: Palette, path: "/dashboard/configuracoes", feature: "perfil" },
      { name: "Equipe e Funções", icon: Users, path: "/dashboard/equipe", feature: "equipe" },
      { name: "Impressoras", icon: Printer, path: "/dashboard/settings/impressoras", badge: "PRO", feature: "pro_features" },
    ]
  }
]

interface SidebarContextType {
  isOpenMobile: boolean
  setIsOpenMobile: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider")
  return context
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { setIsOpenMobile } = useSidebar()
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("lg:hidden touch-target text-slate-600 hover:bg-slate-100", className)}
      onClick={() => setIsOpenMobile(true)}
    >
      <Menu className="size-6" />
    </Button>
  )
}

function SidebarContent({ 
  isCollapsed, 
  onLogout,
  onToggleCollapse,
  isMobile 
}: { 
  isCollapsed: boolean, 
  onLogout: () => void,
  onToggleCollapse?: () => void,
  isMobile?: boolean
}) {
  const pathname = usePathname()
  const userAuth = useAuth()
  const [openGroups, setOpenGroups] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Initialize open groups from localStorage or active path
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-open-groups")
    let initialGroups = saved ? JSON.parse(saved) : []
    
    // Auto-expand group containing the active path
    menuGroups.forEach(group => {
      if (group.items.some(item => item.path === pathname)) {
        if (!initialGroups.includes(group.name)) {
          initialGroups.push(group.name)
        }
      }
    })
    
    setOpenGroups(initialGroups)
    setIsLoaded(true)
  }, [pathname])

  const [unreadSupportCount, setUnreadSupportCount] = useState(0)

  // Fetch unread support messages count
  const fetchUnreadSupport = useCallback(async () => {
    if (!userAuth.user) return
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, tenant_id')
      .eq('id', userAuth.user.id)
      .single()

    let query = supabase
      .from('mensagens_suporte')
      .select(`
        id,
        tickets!inner(tenant_id)
      `, { count: 'exact', head: true })
      .eq('lido', false)
      .eq('remetente', profile?.is_admin ? 'usuario' : 'admin')

    if (!profile?.is_admin) {
      query = query.eq('tickets.tenant_id', profile?.tenant_id)
    }

    const { count, error } = await query.range(0, 0)
    if (!error && count !== null) {
      setUnreadSupportCount(count)
    }
  }, [userAuth.user])

  useEffect(() => {
    fetchUnreadSupport()

    const channel = supabase
      .channel('sidebar-support-badges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensagens_suporte' }, () => fetchUnreadSupport())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchUnreadSupport])

  const pendingOrdersCount = usePedidoStore(s => s.pedidos.filter(p => p.status === 'novo' || p.status === 'pending').length)

  // Update menu groups with dynamic badge
  const updatedMenuGroups = menuGroups.map(group => ({
    ...group,
    items: group.items.map(item => {
      if (item.name === "Mensagens") {
        return { ...item, badge: unreadSupportCount > 0 ? unreadSupportCount.toString() : undefined }
      }
      if (item.name === "Pedidos") {
        return { ...item, badge: pendingOrdersCount > 0 ? pendingOrdersCount.toString() : undefined }
      }
      return item
    })
  }))

  // Save changes to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("sidebar-open-groups", JSON.stringify(openGroups))
    }
  }, [openGroups, isLoaded])

  const toggleGroup = (name: string) => {
    setOpenGroups(prev => 
      prev.includes(name) ? prev.filter(g => g !== name) : [...prev, name]
    )
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-sidebar)] text-[var(--text-primary)] overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Header / Logo */}
      <div className="h-20 flex items-center px-6 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-10 shrink-0 flex items-center justify-center rounded-xl overflow-hidden shadow-sm bg-white p-1">
            <img src="/logo_cupcake.png" alt="Logo" className="size-full object-contain" />
          </div>
          {(!isCollapsed || isMobile) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col min-w-0">
              <span className="font-black text-[var(--text-primary)] leading-none uppercase tracking-tighter text-sm italic">Doce Gestão</span>
              <span className="text-[8px] text-[var(--secondary)] font-black uppercase tracking-[0.2em] leading-none mt-1 italic">Intelligent Bakery</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Nav Content */}
      <TooltipProvider delayDuration={0}>
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-none">
          {updatedMenuGroups.map((group) => {
            const isOpen = openGroups.includes(group.name)
            const hasActive = group.items.some(i => i.path === pathname)
            const GroupIcon = group.icon

            return (
              <div key={group.name} className="space-y-1">
                {/* Group Header (Accordion) */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => (isCollapsed && !isMobile) ? onToggleCollapse?.() : toggleGroup(group.name)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300",
                        (isOpen && !isCollapsed) || (hasActive && isCollapsed) ? "text-[var(--primary)] font-bold bg-[var(--bg-app)]/50" : "text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      <GroupIcon className={cn("size-4 shrink-0 transition-colors", hasActive && "text-[var(--primary)]")} />
                      {(!isCollapsed || isMobile) && (
                        <>
                          <span className="flex-1 text-left font-black text-[9px] uppercase tracking-widest">{group.name}</span>
                          <ChevronDown className={cn("size-3 transition-transform duration-300", isOpen ? "rotate-0" : "-rotate-90 opacity-50")} />
                        </>
                      )}
                    </button>
                  </TooltipTrigger>
                  {isCollapsed && !isMobile && <TooltipContent side="right" className="font-black uppercase text-[10px] italic">{group.name}</TooltipContent>}
                </Tooltip>

                {/* Sub Items */}
                <AnimatePresence initial={false}>
                  {((isOpen && !isCollapsed) || isMobile) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-4 pl-4 border-l border-[var(--border)] space-y-1 mt-1">
                        {group.items.map((item) => {
                          const isActive = pathname === item.path
                          if (!hasFeature(userAuth, item.feature)) return null

                          return (
                            <Link key={item.path} href={item.path}>
                              <div className={cn(
                                "relative flex items-center justify-between px-3 py-1.5 rounded-lg transition-all group cursor-pointer",
                                isActive ? "bg-[var(--accent-light)] text-[var(--primary)]" : "hover:bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                              )}>
                                <span className={cn("font-bold text-xs tracking-tight truncate", isMobile && "text-sm")}>{item.name}</span>
                                {item.badge && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-[var(--secondary)]/10 text-[var(--secondary)] text-[8px] font-black uppercase shrink-0 border border-[var(--secondary)]/20">
                                     {item.badge}
                                   </span>
                                )}
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </TooltipProvider>

      {/* Logout / Collapse Toggle */}
      <div className="p-4 border-t border-[var(--border)] space-y-2 shrink-0 bg-[var(--bg-app)]/30">
        <button
          onClick={onLogout}
          className="w-full h-11 flex items-center gap-4 px-4 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all group"
        >
          <LogOut className="size-5 shrink-0 opacity-50 group-hover:opacity-100" />
          {(!isCollapsed || isMobile) && <span className="font-bold text-xs uppercase tracking-widest italic">Sair da Conta</span>}
        </button>

        {!isMobile && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="w-full h-8 flex items-center justify-center hover:bg-[var(--bg-app)] rounded-lg text-[var(--text-muted)] transition-all"
          >
            {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

export function DashboardSidebar({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isOpenMobile, setIsOpenMobile] = useState(false)
  const pathname = usePathname()
  const { logout } = useAuth()
  const router = useRouter()
  const isMobile = useIsMobile()

  // Load isCollapsed from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved) setIsCollapsed(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(isCollapsed))
  }, [isCollapsed])

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  useEffect(() => { setIsOpenMobile(false) }, [pathname])

  return (
    <SidebarContext.Provider value={{ isOpenMobile, setIsOpenMobile }}>
      <div className="flex flex-1 h-full overflow-hidden">
        {/* Desktop Sidebar (Laptops & Desktops) */}
        <motion.aside
          initial={false}
          animate={{ width: isCollapsed ? 68 : 240 }}
          className={cn(
            "relative hidden lg:flex flex-col bg-[var(--bg-sidebar)] border-r border-[var(--border)] transition-all duration-300 z-50 overflow-hidden shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
            isCollapsed && "items-center"
          )}
        >
          <SidebarContent 
            isCollapsed={isCollapsed} 
            onLogout={handleLogout} 
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)} 
          />
        </motion.aside>

        {/* Mobile & Tablet Drawer (sm, md) */}
        <Sheet open={isOpenMobile} onOpenChange={setIsOpenMobile}>
          <SheetContent side="left" className="p-0 border-none w-[280px] bg-[var(--bg-sidebar)]">
            <SidebarContent isCollapsed={false} onLogout={handleLogout} isMobile />
          </SheetContent>
        </Sheet>

        {children}
      </div>
    </SidebarContext.Provider>
  )
}
