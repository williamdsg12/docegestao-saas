"use client"

import { useState, useEffect, createContext, useContext } from "react"
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
  Globe,
  Crown,
  Calculator,
  Ticket,
  Printer,
  Menu,
  Award,
  Palette,
  Monitor
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { hasFeature } from "@/lib/access-control"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const menuGroups = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { name: "Visão Geral", icon: LayoutDashboard, path: "/dashboard", feature: "dashboard" },
      { name: "Assinatura", icon: Crown, path: "/dashboard/assinatura", feature: "assinatura" },
    ]
  },
  {
    name: "Produção",
    icon: UtensilsCrossed,
    items: [
      { name: "Ingredientes", icon: UtensilsCrossed, path: "/dashboard/estoque", feature: "ingredientes" },
      { name: "Receitas", icon: BookOpen, path: "/dashboard/receitas", feature: "receitas" },
      { name: "Produtos", icon: Package, path: "/dashboard/produtos", feature: "produtos" },
    ]
  },
  {
    name: "Vendas",
    icon: ShoppingCart,
    items: [
      { name: "Pedidos", icon: ShoppingCart, path: "/dashboard/painel-pedidos", feature: "pedidos" },
      { name: "Orçamentos", icon: ClipboardList, path: "/dashboard/orcamentos", feature: "orcamentos" },
      { name: "Clientes", icon: Users, path: "/dashboard/clientes", feature: "clientes" },
      { name: "Histórico de Vendas", icon: ClipboardList, path: "/dashboard/delivery-painel/historico", feature: "delivery-painel" },
      { name: "Cardápio Digital", icon: Coffee, path: "/dashboard/menu", feature: "menu" },
    ]
  },
  {
    name: "Marketing",
    icon: Ticket,
    items: [
      { name: "Promoções & VIP", icon: Ticket, path: "/dashboard/marketing", badge: "V3", feature: "marketing" },
    ]
  },
  {
    name: "Financeiro",
    icon: Calculator,
    items: [
      { name: "Precificação", icon: Calculator, path: "/dashboard/precificacao-inteligente", badge: "Novo", feature: "precificacao" },
      { name: "Vendas Online", icon: ShoppingCart, path: "/dashboard/financeiro/vendas", badge: "Live", feature: "financeiro" },
      { name: "Métodos de pagamento", icon: Wallet, path: "/dashboard/financeiro/pagamentos", feature: "financeiro" },
      { name: "Fluxo de Caixa", icon: Wallet, path: "/dashboard/financeiro", feature: "financeiro" },
      { name: "Relatórios", icon: BarChart3, path: "/dashboard/relatorios", badge: "Beta", feature: "relatorios" },
    ]
  },
  {
    name: "Configurações",
    icon: Settings,
    items: [
      { name: "Visual do Sistema", icon: Palette, path: "/dashboard/configuracoes", badge: "NOVO", feature: "perfil" },
      { name: "Meu Perfil", icon: Settings, path: "/dashboard/settings/profile", feature: "perfil" },
      { name: "Afiliados", icon: Award, path: "/dashboard/afiliados", feature: "afiliados" },
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
      className={cn("md:hidden text-slate-600 hover:bg-slate-100", className)}
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
    <div className="flex flex-col h-full bg-[#0F172A] text-slate-300 overflow-hidden">
      {/* Header / Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-8 shrink-0 flex items-center justify-center p-1.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/20">
            <UtensilsCrossed className="size-full text-white" />
          </div>
          {(!isCollapsed || isMobile) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col min-w-0">
              <span className="font-bold text-white leading-none uppercase tracking-tight text-sm">Doce Gestão</span>
              <span className="text-[9px] text-blue-400 font-medium uppercase tracking-widest leading-none mt-1">SaaS Platinum</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Nav Content */}
      <TooltipProvider delayDuration={0}>
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-none">
          {menuGroups.map((group) => {
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
                        (isOpen && !isCollapsed) || (hasActive && isCollapsed) ? "text-white" : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                      )}
                    >
                      <GroupIcon className={cn("size-4 shrink-0 transition-colors", hasActive && "text-blue-500")} />
                      {(!isCollapsed || isMobile) && (
                        <>
                          <span className="flex-1 text-left font-semibold text-[10px] uppercase tracking-wider">{group.name}</span>
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
                      <div className="ml-4 pl-4 border-l border-slate-800 space-y-1 mt-1">
                        {group.items.map((item) => {
                          const isActive = pathname === item.path
                          if (!hasFeature(userAuth, item.feature)) return null

                          return (
                            <Link key={item.path} href={item.path}>
                              <div className={cn(
                                "relative flex items-center justify-between px-3 py-1.5 rounded-lg transition-all group cursor-pointer",
                                isActive ? "bg-blue-600/10 text-blue-400" : "hover:bg-white/5 text-slate-400 hover:text-white"
                              )}>
                                <span className="font-medium text-xs tracking-tight truncate">{item.name}</span>
                                {item.badge && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase shrink-0 border border-blue-500/20">
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
      <div className="p-4 border-t border-slate-800 space-y-2 shrink-0 bg-[#0B1222]">
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
            className="w-full h-8 flex items-center justify-center hover:bg-white/5 rounded-lg text-slate-600 transition-all"
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
        {!isMobile && (
          <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 68 : 240 }}
            className={cn(
              "relative flex flex-col bg-[#0F172A] border-r border-slate-800 transition-all duration-300 z-50 overflow-hidden shrink-0",
              isCollapsed && "items-center"
            )}
          >
            <SidebarContent 
              isCollapsed={isCollapsed} 
              onLogout={handleLogout} 
              onToggleCollapse={() => setIsCollapsed(!isCollapsed)} 
            />
          </motion.aside>
        )}

        {isMobile && (
          <Sheet open={isOpenMobile} onOpenChange={setIsOpenMobile}>
            <SheetContent side="left" className="p-0 border-none w-[280px] sm:w-[320px] bg-[#0F172A] safe-area-pt">
              <SidebarContent isCollapsed={false} onLogout={handleLogout} isMobile />
            </SheetContent>
          </Sheet>
        )}

        <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0 bg-[#F8FAFC]">
          <div className="flex-1 flex flex-col min-h-0">
            {children}
          </div>
          {/* Footer - Hidden on mobile due to bottom nav */}
          <div className="hidden md:flex h-10 lg:h-12 bg-white border-t border-slate-200 px-4 lg:px-8 items-center justify-between text-[9px] lg:text-[10px] font-bold text-slate-400 shrink-0">
            <div className="truncate uppercase tracking-tighter italic">Copyright © 2026 <span className="text-blue-600 font-black">Doce Gestão</span></div>
            <div className="hidden lg:block uppercase tracking-widest text-[9px]">v4.5.0 Premium</div>
          </div>
        </main>
      </div>
    </SidebarContext.Provider>
  )
}
