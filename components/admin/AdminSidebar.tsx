"use client"
import { motion } from "framer-motion"

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
    ShieldCheck,
    ShoppingBag
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
        { href: "/admin", icon: LayoutDashboard, label: "Dashboard", color: "text-blue-400" },
        { href: "/admin/companies", icon: Building2, label: "Empresas", color: "text-amber-400" },
        { href: "/admin/users", icon: Users, label: "Usuários", color: "text-emerald-400" },
        { href: "/admin/orders", icon: ShoppingBag, label: "Pedidos", color: "text-orange-400" },
        { href: "/admin/subscriptions", icon: CreditCard, label: "Assinaturas", color: "text-indigo-400" },
        { href: "/admin/payments", icon: History, label: "Pagamentos", color: "text-rose-400" },
        { href: "/admin/plans", icon: Package, label: "Planos", color: "text-purple-400" },
        { href: "/admin/stats", icon: BarChart3, label: "Estatísticas", color: "text-cyan-400" },
        { href: "/admin/support", icon: Headset, label: "Suporte", color: "text-pink-400" },
        { href: "/admin/logs", icon: History, label: "Logs", color: "text-slate-400" },
        { href: "/admin/security", icon: ShieldCheck, label: "Segurança", color: "text-amber-400" },
        { href: "/admin/settings", icon: Settings, label: "Configurações", color: "text-slate-300" },
    ]

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-inter">
            {/* Sidebar */}
            <aside
                className={cn(
                    "h-full bg-[#020617] text-slate-100 flex flex-col transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] relative z-30 shadow-[10px_0_40px_rgba(0,0,0,0.1)]",
                    isCollapsed ? "w-20" : "w-72"
                )}
            >
                {/* Logo Area */}
                <div className="h-24 flex items-center px-6 shrink-0 justify-between relative overflow-hidden">
                    {/* Background glow for logo */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
                    
                    <div className="flex items-center">
                        <div className="size-11 rounded-xl bg-gradient-to-br from-indigo-500 to-primary flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                            <ShieldCheck className="size-6" />
                        </div>
                        {!isCollapsed && (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="ml-4 flex flex-col"
                            >
                                <span className="text-lg font-black text-white italic uppercase leading-none tracking-tighter">Admin</span>
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">DoceGestão</span>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Toggle Button - Float style */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-10 size-6 bg-[#020617] border border-slate-800 rounded-full flex items-center justify-center text-slate-500 hover:text-white shadow-xl transition-all duration-300 z-50 hover:scale-110"
                >
                    {isCollapsed ? <ChevronRight className="size-3" /> : <ChevronLeft className="size-3" />}
                </button>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1 custom-scrollbar scrollbar-hide">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 relative overflow-hidden",
                                pathname === item.href
                                    ? "bg-white/10 text-white shadow-inner"
                                    : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
                            )}
                        >
                            <div className={cn(
                                "size-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-500",
                                pathname === item.href 
                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                                    : cn("bg-slate-800/50 group-hover:bg-slate-800", item.color)
                            )}>
                                <item.icon className="size-4.5" />
                            </div>

                            {!isCollapsed && (
                                <span className="font-semibold text-xs tracking-tight uppercase italic whitespace-nowrap">
                                    {item.label}
                                </span>
                            )}

                            {pathname === item.href && !isCollapsed && (
                                <motion.div 
                                    layoutId="active-pill"
                                    className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-indigo-500 rounded-l-full" 
                                />
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Footer / User Profile shortcut or Logout */}
                <div className="p-4 border-t border-slate-800/50">
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300 group",
                            isCollapsed && "justify-center"
                        )}
                    >
                        <div className="size-9 rounded-lg bg-slate-800/50 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-rose-500/20 group-hover:text-rose-400">
                            <LogOut className="size-4.5" />
                        </div>
                        {!isCollapsed && (
                            <span className="font-semibold text-xs tracking-tight uppercase italic whitespace-nowrap">Sair</span>
                        )}
                    </button>
                </div>
            </aside>

            {/* Main Content Scroll Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 relative">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-indigo-500/5 to-transparent pointer-events-none" />
                <div className="relative flex-1 flex flex-col">
                    {children}
                </div>
            </div>
        </div>
    )
}
