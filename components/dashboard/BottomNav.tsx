"use client"

import { LayoutDashboard, ShoppingBag, Users, Wallet, Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar"

export function BottomNav() {
  const pathname = usePathname()
  const { setIsOpenMobile } = useSidebar()

  const navItems = [
    { name: "Painel", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Pedidos", icon: ShoppingBag, path: "/dashboard/painel-pedidos" },
    { name: "Clientes", icon: Users, path: "/dashboard/clientes" },
    { name: "Financeiro", icon: Wallet, path: "/dashboard/financeiro" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[var(--background)]/80 backdrop-blur-lg border-t border-[var(--border)] flex items-center justify-around px-2 z-[40] md:hidden safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = pathname === item.path
        return (
          <Link key={item.path} href={item.path} className="flex-1">
            <div className={cn(
              "flex flex-col items-center justify-center gap-1 transition-all",
              isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
            )}>
              <div className={cn(
                "p-1.5 rounded-xl transition-all",
                isActive && "bg-[var(--primary)]/10"
              )}>
                <item.icon className={cn("size-5", isActive && "fill-current")} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tight">{item.name}</span>
            </div>
          </Link>
        )
      })}
      
      <button 
        onClick={() => setIsOpenMobile(true)}
        className="flex-1 flex flex-col items-center justify-center gap-1 text-[var(--text-muted)]"
      >
        <div className="p-1.5">
          <Menu className="size-5" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-tight">Mais</span>
      </button>
    </nav>
  )
}
