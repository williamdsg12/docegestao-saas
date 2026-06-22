"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ShoppingCart, Users, Wallet, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar"

const mainNavItems = [
  { name: "Início", icon: LayoutDashboard, path: "/dashboard" },
  { name: "Pedidos", icon: ShoppingCart, path: "/dashboard/pedidos" },
  { name: "Clientes", icon: Users, path: "/dashboard/clientes" },
  { name: "Financeiro", icon: Wallet, path: "/dashboard/financeiro" },
]

export function BottomNav() {
  const pathname = usePathname()
  const { setIsOpenMobile } = useSidebar()

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(path)
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] safe-area-pb">
        <div className="flex items-center justify-around h-16 px-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all",
                  active ? "text-blue-600" : "text-slate-500"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-10 h-8 rounded-xl transition-all",
                  active && "bg-blue-50"
                )}>
                  <Icon className={cn("size-5", active && "stroke-[2.5]")} />
                </div>
                <span className={cn(
                  "text-[10px] font-semibold tracking-tight",
                  active && "text-blue-600"
                )}>
                  {item.name}
                </span>
              </Link>
            )
          })}
          
          {/* More Button */}
          <button
            onClick={() => setIsOpenMobile(true)}
            className="flex flex-col items-center justify-center gap-1 flex-1 py-2 text-slate-500"
          >
            <div className="flex items-center justify-center w-10 h-8 rounded-xl">
              <MoreHorizontal className="size-5" />
            </div>
            <span className="text-[10px] font-semibold tracking-tight">Mais</span>
          </button>
        </div>
      </nav>

      {/* Spacer para o conteúdo não ficar atrás da bottom nav */}
      <div className="h-16 md:hidden shrink-0" />
    </>
  )
}
