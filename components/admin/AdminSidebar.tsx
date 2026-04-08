"use client"
import { motion, AnimatePresence } from "framer-motion"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
    ShieldCheck,
    ShoppingBag,
    Award
} from "lucide-react"
import { cn } from "@/lib/utils"

import { AdminTopbar } from "./AdminTopbar"
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

export function AdminSidebar({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const pathname = usePathname()
    const { logout } = useAuth()

    const navGroups = [
        {
            title: "Admin",
            items: [
                { href: "/admin", icon: LayoutDashboard, label: "Dashboard", color: "text-blue-400" },
                { href: "/admin/stats", icon: BarChart3, label: "Estatísticas", color: "text-cyan-400" },
            ]
        },
        {
            title: "Financeiro",
            items: [
                { href: "/admin/subscriptions", icon: CreditCard, label: "Assinaturas", color: "text-indigo-400" },
                { href: "/admin/payments", icon: History, label: "Pagamentos", color: "text-rose-400" },
                { href: "/admin/plans", icon: Package, label: "Planos", color: "text-purple-400" },
                { href: "/admin/afiliados", icon: Award, label: "Afiliados", color: "text-amber-500" },
            ]
        },
        {
            title: "Sistema",
            items: [
                { href: "/admin/companies", icon: Building2, label: "Empresas", color: "text-amber-400" },
                { href: "/admin/users", icon: Users, label: "Usuários", color: "text-emerald-400" },
                { href: "/admin/orders", icon: ShoppingBag, label: "Pedidos", color: "text-orange-400" },
                { href: "/admin/support", icon: Headset, label: "Suporte", color: "text-pink-400" },
                { href: "/admin/security", icon: ShieldCheck, label: "Segurança", color: "text-amber-400" },
                { href: "/admin/settings", icon: Settings, label: "Configurações", color: "text-slate-300" },
            ]
        }
    ]

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden font-inter text-slate-300">
            {/* Sidebar */}
            <aside
                className={cn(
                    "h-full bg-slate-950 border-r border-white/5 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] relative z-50",
                    isCollapsed ? "w-20" : "w-72"
                )}
            >
                {/* Logo Area */}
                <div className="h-20 flex items-center px-6 shrink-0 justify-between relative overflow-hidden border-b border-white/5">
                    {/* Background glow for logo */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
                    
                    <div className="flex items-center">
                        <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-500 to-primary flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:rotate-0 transition-transform duration-500 shrink-0">
                            <ShieldCheck className="size-5" />
                        </div>
                        <AnimatePresence mode="wait">
                            {!isCollapsed && (
                                <motion.div 
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 120 }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="ml-4 flex flex-col overflow-hidden whitespace-nowrap"
                                >
                                    <span className="text-lg font-black text-white italic uppercase leading-none tracking-tighter">Admin</span>
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">DoceGestão</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-24 size-6 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white shadow-xl transition-all duration-300 z-50 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    {isCollapsed ? <ChevronRight className="size-3" /> : <ChevronLeft className="size-3" />}
                </button>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-6 custom-scrollbar scrollbar-hide">
                    {navGroups.map((group, groupIdx) => (
                        <div key={groupIdx} className="space-y-1">
                            {!isCollapsed && (
                                <div className="px-3 mb-2">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{group.title}</span>
                                </div>
                            )}
                            {group.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 relative overflow-hidden",
                                        pathname === item.href
                                            ? "bg-white/5 text-white shadow-inner"
                                            : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                                    )}
                                >
                                    <div className={cn(
                                        "size-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300",
                                        pathname === item.href 
                                            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                                            : cn("bg-slate-900 group-hover:bg-slate-800", item.color)
                                    )}>
                                        <item.icon className="size-4.5" />
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {!isCollapsed && (
                                            <motion.span 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="font-bold text-xs tracking-tight uppercase italic whitespace-nowrap"
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>

                                    {pathname === item.href && !isCollapsed && (
                                        <motion.div 
                                            layoutId="active-pill"
                                            className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-indigo-500 rounded-l-full" 
                                        />
                                    )}
                                </Link>
                            ))}
                        </div>
                    ))}
                </nav>

                {/* Footer Section */}
                <div className="p-4 border-t border-white/5 bg-slate-950">
                    <button
                        onClick={logout}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-rose-500/50",
                            isCollapsed && "justify-center"
                        )}
                    >
                        <div className="size-9 rounded-lg bg-slate-900 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-rose-500/20 group-hover:text-rose-400">
                            <LogOut className="size-4.5" />
                        </div>
                        <AnimatePresence mode="wait">
                            {!isCollapsed && (
                                <motion.span 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="font-bold text-xs tracking-tight uppercase italic whitespace-nowrap"
                                >
                                    Sair
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-indigo-500/5 to-transparent pointer-events-none" />
                <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
                
                {/* Animated Topbar */}
                <AdminTopbar />

                {/* Page Content */}
                <div className="relative flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
                    <div className="p-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}
