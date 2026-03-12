"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import {
    LayoutDashboard,
    Building2,
    Users,
    CreditCard,
    Package,
    BarChart3,
    History,
    Settings,
    Headset,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Bell,
    ShieldCheck
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"

interface SidebarItemProps {
    href: string
    icon: any
    label: string
    active?: boolean
    collapsed?: boolean
    onClick?: () => void
    color: string
}

function SidebarItem({ href, icon: Icon, label, active, collapsed, onClick, color }: SidebarItemProps) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative overflow-hidden",
                active
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
        >
            <div className={cn(
                "size-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500",
                active ? "bg-white/10" : cn("bg-white shadow-sm border border-slate-100 group-hover:scale-110", color)
            )}>
                <Icon className={cn("size-5", active ? "text-white" : "text-inherit")} />
            </div>

            {!collapsed && (
                <span className="font-bold text-sm tracking-tight uppercase italic whitespace-nowrap">
                    {label}
                </span>
            )}

            {active && !collapsed && (
                <div className="absolute right-4 size-1.5 bg-primary rounded-full" />
            )}
        </Link>
    )
}

import { NotificationCenter } from "@/components/premium/NotificationCenter"

export function AdminSidebar({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const pathname = usePathname()
    const { logout } = useAuth()
    const router = useRouter()

    const handleLogout = async () => {
        await logout()
        router.push("/login")
    }

    const menuItems = [
        { href: "/admin", icon: LayoutDashboard, label: "Dashboard", color: "group-hover:text-blue-500" },
        { href: "/admin/companies", icon: Building2, label: "Empresas", color: "group-hover:text-amber-500" },
        { href: "/admin/users", icon: Users, label: "Usuários", color: "group-hover:text-emerald-500" },
        { href: "/admin/subscriptions", icon: CreditCard, label: "Assinaturas", color: "group-hover:text-indigo-500" },
        { href: "/admin/payments", icon: History, label: "Pagamentos", color: "group-hover:text-rose-500" },
        { href: "/admin/plans", icon: Package, label: "Planos", color: "group-hover:text-purple-500" },
        { href: "/admin/stats", icon: BarChart3, label: "Estatísticas", color: "group-hover:text-cyan-500" },
        { href: "/admin/support", icon: Headset, label: "Suporte", color: "group-hover:text-pink-500" },
        { href: "/admin/logs", icon: History, label: "Logs", color: "group-hover:text-slate-500" },
        { href: "/admin/security", icon: ShieldCheck, label: "Segurança", color: "group-hover:text-amber-500" },
        { href: "/admin/settings", icon: Settings, label: "Configurações", color: "group-hover:text-slate-700" },
    ]

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar */}
            <aside
                className={cn(
                    "h-full bg-white border-r border-slate-200 flex flex-col transition-all duration-500 ease-in-out relative z-30 shadow-2xl shadow-slate-200/50",
                    isCollapsed ? "w-24" : "w-72"
                )}
            >
                {/* Logo Area */}
                <div className="h-24 flex items-center px-6 shrink-0 justify-between">
                    <div className="flex items-center">
                        <div className="size-12 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center text-white shadow-xl shadow-slate-900/20 rotate-3">
                            <ShieldCheck className="size-7" />
                        </div>
                        {!isCollapsed && (
                            <div className="ml-4 flex flex-col">
                                <span className="text-lg font-black text-slate-900 italic uppercase leading-none tracking-tighter">Admin</span>
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">DoceGestão</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-10 size-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-colors"
                >
                    {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
                </button>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2 custom-scrollbar">
                    {menuItems.map((item) => (
                        <SidebarItem
                            key={item.href}
                            {...item}
                            active={pathname === item.href}
                            collapsed={isCollapsed}
                        />
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all duration-300 group",
                            isCollapsed && "justify-center"
                        )}
                    >
                        <div className="size-10 rounded-xl bg-white shadow-sm border border-rose-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <LogOut className="size-5" />
                        </div>
                        {!isCollapsed && (
                            <span className="font-black text-sm tracking-tight uppercase italic whitespace-nowrap">Sair</span>
                        )}
                    </button>
                </div>
            </aside>

            {/* Main Content Scroll Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {children}
            </div>
        </div>
    )
}
