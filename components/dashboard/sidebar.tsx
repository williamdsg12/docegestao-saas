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
  Globe
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard", color: "text-blue-600", bg: "bg-blue-50" },
  { name: "Ingredientes", icon: UtensilsCrossed, path: "/dashboard/estoque", color: "text-emerald-600", bg: "bg-emerald-50" },
  { name: "Receitas", icon: BookOpen, path: "/dashboard/precificacao", color: "text-orange-600", bg: "bg-orange-50" },
  { name: "Produtos", icon: Package, path: "/dashboard/produtos", color: "text-rose-600", bg: "bg-rose-50" },
  { name: "Clientes", icon: Users, path: "/dashboard/clientes", color: "text-pink-600", bg: "bg-pink-50" },
  { name: "Orçamentos", icon: ClipboardList, path: "/dashboard/orcamentos", color: "text-amber-600", bg: "bg-amber-50" },
  { name: "Pedidos", icon: ShoppingCart, path: "/dashboard/pedidos", color: "text-cyan-600", bg: "bg-cyan-50" },
  { name: "Cardápio Digital", icon: Coffee, path: "/dashboard/menu", color: "text-amber-600", bg: "bg-amber-50" },
  { name: "Pedidos Online", icon: Globe, path: "/dashboard/orders", color: "text-purple-600", bg: "bg-purple-50", badge: "Novo" },
  { name: "Fluxo de Caixa", icon: Wallet, path: "/dashboard/financeiro", color: "text-indigo-600", bg: "bg-indigo-50" },
  { name: "Relatórios", icon: BarChart3, path: "/dashboard/relatorios", color: "text-purple-600", bg: "bg-purple-50", badge: "Beta" },
  { name: "Perfil & Config.", icon: Settings, path: "/dashboard/settings/profile", color: "text-slate-600", bg: "bg-slate-50" },
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
          "relative flex flex-col bg-white border-r border-slate-200 transition-all duration-300 z-50 overflow-hidden shrink-0",
          isCollapsed ? "items-center" : ""
        )}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-12 shrink-0 flex items-center justify-center">
              <img src="/logo_cupcake.png" alt="Doce Gestão" className="size-full object-contain" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-black text-indigo-900 leading-none truncate uppercase tracking-tighter text-lg">Doce Gestão</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">Sistema de Gestão</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-none">
          {menuItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={cn(
                    "group flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 cursor-pointer",
                    isActive
                      ? "bg-slate-50 text-indigo-900"
                      : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
                  )}
                >
                  <div className={cn(
                    "size-10 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm shrink-0",
                    item.bg, item.color,
                    isActive ? "shadow-md scale-110" : "group-hover:scale-110"
                  )}>
                    <item.icon className="size-5" />
                  </div>
                  {!isCollapsed && (
                    <div className="flex flex-1 items-center justify-between overflow-hidden">
                      <span className={cn(
                        "font-bold text-sm tracking-tight truncate",
                        isActive ? item.color : ""
                      )}>
                        {item.name}
                      </span>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[9px] font-black uppercase shrink-0">
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

        {/* User Section - Minimalist */}
        <div className="p-4 border-t border-slate-100 space-y-2 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full h-12 flex items-center gap-4 px-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all group"
          >
            <div className="size-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
              <LogOut className="size-5" />
            </div>
            {!isCollapsed && <span className="font-bold text-sm truncate uppercase tracking-widest italic">Sair</span>}
          </button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full h-8 hover:bg-slate-100 rounded-lg text-slate-300 transition-all mt-2"
          >
            {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </div>

        {/* Footer (Minha Confeitaria Style) */}
        <div className="h-12 bg-white border-t border-slate-200 px-8 flex items-center justify-between text-[10px] font-medium text-slate-400 shrink-0">
          <div className="truncate">Copyright © 2026 <span className="text-indigo-900 font-bold">Doce Gestão</span> - Todos os Direitos Reservados</div>
          <div className="hidden sm:block">Versão 4.4.0 Feita com ❤️ por nossa equipe</div>
        </div>
      </main>
    </div>
  )
}
