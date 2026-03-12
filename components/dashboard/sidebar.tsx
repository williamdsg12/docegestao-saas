"use client"

import { useState } from "react"
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
  Camera,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  User,
  Wallet,
  BarChart3,
  Coffee,
  Globe,
  Crown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"

const menuGroups = [
  {
    name: "Dashboard",
    items: [
      { name: "Visão Geral", icon: LayoutDashboard, path: "/dashboard", color: "text-blue-600", bg: "bg-blue-50" },
      { name: "Assinatura", icon: Crown, path: "/dashboard/assinatura", color: "text-amber-600", bg: "bg-amber-50" },
    ]
  },
  {
    name: "Produção",
    items: [
      { name: "Ingredientes", icon: UtensilsCrossed, path: "/dashboard/estoque", color: "text-emerald-600", bg: "bg-emerald-50" },
      { name: "Receitas", icon: BookOpen, path: "/dashboard/precificacao", color: "text-orange-600", bg: "bg-orange-50" },
      { name: "Produtos", icon: Package, path: "/dashboard/produtos", color: "text-rose-600", bg: "bg-rose-50" },
    ]
  },
  {
    name: "Vendas",
    items: [
      { name: "Pedidos", icon: ShoppingCart, path: "/dashboard/pedidos", color: "text-cyan-600", bg: "bg-cyan-50" },
      { name: "Orçamentos", icon: ClipboardList, path: "/dashboard/orcamentos", color: "text-emerald-600", bg: "bg-emerald-50" },
      { name: "Clientes", icon: Users, path: "/dashboard/clientes", color: "text-pink-600", bg: "bg-pink-50" },
      { name: "Cardápio Digital", icon: Coffee, path: "/dashboard/menu", color: "text-amber-600", bg: "bg-amber-50" },
    ]
  },
  {
    name: "Financeiro",
    items: [
      { name: "Fluxo de Caixa", icon: Wallet, path: "/dashboard/financeiro", color: "text-indigo-600", bg: "bg-indigo-50" },
      { name: "Relatórios", icon: BarChart3, path: "/dashboard/relatorios", color: "text-purple-600", bg: "bg-purple-50", badge: "Beta" },
    ]
  },
  {
    name: "Configurações",
    items: [
      { name: "Perfil & Config.", icon: Settings, path: "/dashboard/settings/profile", color: "text-slate-600", bg: "bg-slate-50" },
    ]
  }
]

export function DashboardSidebar({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        className={cn(
          "relative flex flex-col bg-[var(--bg-sidebar)] border-r border-[var(--border)] transition-all duration-300 z-50 overflow-hidden shrink-0 shadow-[var(--shadow-card)]",
          isCollapsed ? "items-center" : ""
        )}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-12 shrink-0 flex items-center justify-center p-1 bg-white/10 rounded-xl">
              <img src="/logo_cupcake.png" alt="Doce Gestão" className="size-full object-contain" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-black text-[var(--text-primary)] leading-none truncate uppercase tracking-tighter text-lg italic">Doce Gestão</span>
                <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider truncate">SaaS Premium</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6 scrollbar-none">
          {menuGroups.map((group) => (
            <div key={group.name} className="space-y-1">
              {!isCollapsed && (
                <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">
                  {group.name}
                </p>
              )}
              {group.items.map((item) => {
                const isActive = pathname === item.path
                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={cn(
                        "group flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 cursor-pointer",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-main)] hover:text-primary"
                      )}
                    >
                      <div className={cn(
                        "size-10 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm shrink-0",
                        isActive ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" : "bg-[var(--bg-app)] group-hover:scale-110 border border-[var(--border)]"
                      )}>
                        <item.icon className="size-5" />
                      </div>
                      {!isCollapsed && (
                        <div className="flex flex-1 items-center justify-between overflow-hidden">
                          <span className={cn(
                            "font-black text-sm tracking-tight truncate italic uppercase",
                            isActive ? "text-primary" : ""
                          )}>
                            {item.name}
                          </span>
                          {item.badge && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        {/* User Section - Minimalist */}
        <div className="p-4 border-t border-[var(--border)] space-y-2 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full h-12 flex items-center gap-4 px-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all group"
          >
            <div className="size-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
              <LogOut className="size-5" />
            </div>
            {!isCollapsed && <span className="font-black text-sm truncate uppercase tracking-widest italic">Sair</span>}
          </button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full h-8 hover:bg-[var(--bg-app)] rounded-lg text-[var(--text-secondary)] transition-all mt-2"
          >
            {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        <div className="flex-1 overflow-y-auto bg-[var(--bg-app)]">
          {children}
        </div>

        {/* Footer (Minha Confeitaria Style) */}
        <div className="h-12 bg-[var(--bg-sidebar)] border-t border-[var(--border)] px-8 flex items-center justify-between text-[10px] font-bold text-[var(--text-secondary)] shrink-0">
          <div className="truncate uppercase tracking-tighter italic">Copyright © 2026 <span className="text-primary font-black">Doce Gestão</span> - Todos os Direitos Reservados</div>
          <div className="hidden sm:block uppercase tracking-widest text-[9px]">Versão 4.4.0 Feita com ❤️ por nossa equipe</div>
        </div>
      </main>
    </div>
  )
}
