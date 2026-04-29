"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
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
    LogOut,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
    ShoppingBag,
    Menu,
    X,
    ChevronDown,
    Award,
    Headset
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AdminTopbar } from "./AdminTopbar"
import { useAuth } from "@/hooks/useAuth"
import { 
    Tooltip, 
    TooltipContent, 
    TooltipProvider, 
    TooltipTrigger 
} from "@/components/ui/tooltip"

interface NavItem {
    href: string
    label: string
    icon?: any
    color?: string
    badge?: string | number
}

interface NavGroup {
    title: string
    type: "simple" | "dropdown"
    icon?: any
    items: NavItem[]
}

export function AdminSidebar({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [openDropdowns, setOpenDropdowns] = useState<string[]>([])
    const pathname = usePathname()
    const { logout } = useAuth()

    // Persistent State
    useEffect(() => {
        const savedCollapsed = localStorage.getItem("admin-sidebar-collapsed")
        const savedDropdowns = localStorage.getItem("admin-sidebar-dropdowns")
        
        if (savedCollapsed) setIsCollapsed(savedCollapsed === "true")
        if (savedDropdowns) setOpenDropdowns(JSON.parse(savedDropdowns))
    }, [])

    useEffect(() => {
        localStorage.setItem("admin-sidebar-collapsed", String(isCollapsed))
    }, [isCollapsed])

    useEffect(() => {
        localStorage.setItem("admin-sidebar-dropdowns", JSON.stringify(openDropdowns))
    }, [openDropdowns])

    const toggleDropdown = (title: string) => {
        setOpenDropdowns(prev => {
            if (prev.includes(title)) {
                return []
            } else {
                return [title]
            }
        })
    }

    const menuGroups: NavGroup[] = [
        {
            title: "PRINCIPAL",
            type: "simple",
            items: [
                { href: "/admin", icon: LayoutDashboard, label: "Dashboard", color: "text-emerald-400" },
                { href: "/admin/subscriptions", icon: CreditCard, label: "Assinaturas", color: "text-indigo-400" },
                { href: "/admin/users", icon: Users, label: "Usuários", color: "text-rose-400" },
            ]
        },
        {
            title: "GESTÃO",
            type: "simple",
            items: [
                { href: "/admin/payments", icon: ShoppingBag, label: "Financeiro", color: "text-amber-400", badge: 2 },
                { href: "/admin/stats", icon: BarChart3, label: "Relatórios", color: "text-cyan-400" },
            ]
        },
        {
            title: "SISTEMA",
            type: "simple",
            items: [
                { href: "/admin/support", icon: Headset, label: "Suporte", color: "text-purple-400", badge: "Live" },
                { href: "/admin/companies", icon: Building2, label: "Empresas", color: "text-blue-400" },
                { href: "/admin/plans", icon: Award, label: "Planos", color: "text-orange-400" },
                { href: "/admin/settings", icon: Settings, label: "Configurações", color: "text-slate-400" },
            ]
        }
    ]

    return (
        <TooltipProvider delayDuration={0}>
            <div className="flex h-screen bg-background overflow-hidden font-inter text-foreground">
                {/* Mobile Overlay */}
                <AnimatePresence>
                    {isMobileOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
                        />
                    )}
                </AnimatePresence>

                {/* Sidebar */}
                <motion.aside
                    initial={false}
                    animate={isMobileOpen ? { x: 0, width: "280px" } : { 
                        x: 0, 
                        width: isCollapsed ? "80px" : "280px" 
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={cn(
                        "fixed inset-y-0 left-0 z-[70] bg-[#09090b] border-r border-white/[0.05] flex flex-col lg:relative overflow-hidden shadow-2xl transition-all duration-300",
                        !isMobileOpen && "-translate-x-full lg:translate-x-0",
                        isMobileOpen && "translate-x-0"
                    )}
                >
                    {/* Logo Area */}
                    <div className="h-20 flex items-center px-6 shrink-0 justify-between relative overflow-hidden border-b border-white/[0.05]">
                        <div className="flex items-center relative gap-3">
                            <div className="size-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
                                <ShieldCheck className="size-5" />
                            </div>
                            
                            <AnimatePresence mode="wait">
                                {(!isCollapsed || isMobileOpen) && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="flex flex-col whitespace-nowrap"
                                    >
                                        <span className="text-sm font-bold text-white tracking-tight leading-none">DoceGestão</span>
                                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">Admin Panel</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {isMobileOpen && (
                            <button 
                                onClick={() => setIsMobileOpen(false)}
                                className="lg:hidden text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl"
                            >
                                <X className="size-6" />
                            </button>
                        )}
                    </div>

                    {/* Toggle Button (Desktop) */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="absolute -right-3 top-28 size-7 bg-indigo-600 border border-white/20 rounded-full hidden lg:flex items-center justify-center text-white shadow-xl transition-all duration-300 z-50 hover:scale-110 active:scale-90"
                    >
                        <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }}>
                            <ChevronLeft className="size-4" />
                        </motion.div>
                    </button>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-8 custom-scrollbar scrollbar-hide">
                        {menuGroups.map((group, gIdx) => (
                            <div key={group.title} className="space-y-4">
                                {(!isCollapsed || isMobileOpen) && (
                                    <div className="px-3 mb-2">
                                        <motion.span 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block whitespace-nowrap"
                                        >
                                            {group.title}
                                        </motion.span>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {group.type === "simple" ? (
                                        group.items.map((item) => (
                                            <MenuItem 
                                                key={item.href} 
                                                item={item} 
                                                collapsed={isCollapsed && !isMobileOpen} 
                                                active={pathname === item.href}
                                            />
                                        ))
                                    ) : (
                                        <DropdownGroup 
                                            group={group}
                                            isOpen={openDropdowns.includes(group.title)}
                                            onToggle={() => toggleDropdown(group.title)}
                                            collapsed={isCollapsed && !isMobileOpen}
                                            pathname={pathname}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* Footer Section */}
                    <div className="p-4 border-t border-white/[0.05] bg-black/10">
                        <button
                            onClick={logout}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 h-10 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all duration-200 group active:scale-95",
                                (isCollapsed && !isMobileOpen) && "justify-center px-0"
                            )}
                        >
                            <LogOut className="size-4" />
                            {(!isCollapsed || isMobileOpen) && (
                                <span className="font-medium text-xs tracking-tight whitespace-nowrap">
                                    Encerrar Sessão
                                </span>
                            )}
                        </button>
                    </div>
                </motion.aside>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#0c0c0e] relative">
                    
                    <AdminTopbar onMenuClick={() => setIsMobileOpen(true)} />

                    <main className="relative flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
                        <div className="p-6 lg:p-10 max-w-[1400px] mx-auto w-full">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </TooltipProvider>
    )
}

function MenuItem({ item, collapsed, active }: { item: NavItem, collapsed: boolean, active: boolean }) {
    const content = (
        <Link
            href={item.href}
            className={cn(
                "group flex items-center gap-3 px-3 h-10 rounded-lg transition-all duration-200 relative overflow-hidden",
                active
                    ? "bg-white/[0.05] text-white border border-white/[0.05]"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
            )}
        >
            {/* Active Lateral Highlight */}
            {active && (
                <motion.div 
                    layoutId="active-bar"
                    className="absolute left-0 top-2 bottom-2 w-0.5 bg-indigo-500 rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}

            <div className={cn(
                "size-5 flex items-center justify-center shrink-0 transition-all duration-200",
                active ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
            )}>
                {item.icon && <item.icon className="size-4" />}
            </div>

            {!collapsed && (
                <div className="flex flex-1 items-center justify-between overflow-hidden">
                    <span className="font-medium text-[13px] tracking-tight">
                        {item.label}
                    </span>
                    {item.badge && (
                        <span className="bg-indigo-500/10 text-indigo-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-indigo-500/10">
                            {item.badge}
                        </span>
                    )}
                </div>
            )}
        </Link>
    )

    if (collapsed) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent side="right" className="bg-slate-900 border-white/10 text-white font-bold uppercase italic text-[11px] px-3 py-1.5 shadow-2xl backdrop-blur-xl">
                    {item.label}
                    {item.badge && <span className="ml-2 text-rose-400">({item.badge})</span>}
                </TooltipContent>
            </Tooltip>
        )
    }

    return content
}

function DropdownGroup({ group, isOpen, onToggle, collapsed, pathname }: { 
    group: NavGroup, 
    isOpen: boolean, 
    onToggle: () => void, 
    collapsed: boolean,
    pathname: string 
}) {
    const isAnyActive = group.items.some(item => pathname === item.href)

    const content = (
        <button
            onClick={onToggle}
            className={cn(
                "w-full group flex items-center gap-4 px-4 h-14 rounded-2xl transition-all duration-300 relative active:scale-95",
                isAnyActive ? "text-white bg-white/5" : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
        >
            {isAnyActive && !isOpen && (
                 <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-indigo-500 rounded-full" />
            )}

            <div className={cn(
                "size-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110",
                isAnyActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "bg-slate-900 border border-white/5"
            )}>
                {group.icon && <group.icon className="size-5" />}
            </div>

            {!collapsed && (
                <div className="flex flex-1 items-center justify-between overflow-hidden">
                    <span className="font-bold text-[13px] tracking-tight uppercase italic whitespace-nowrap">
                        {group.title}
                    </span>
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: "backOut" }}
                    >
                        <ChevronDown className="size-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                </div>
            )}
        </button>
    )

    return (
        <div className="space-y-2">
            {collapsed ? (
                <Tooltip>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent side="right" className="bg-slate-900 border-white/10 text-white font-bold uppercase italic text-[11px] px-3 py-1.5 shadow-2xl backdrop-blur-xl">
                        {group.title}
                    </TooltipContent>
                </Tooltip>
            ) : content}

            <AnimatePresence initial={false}>
                {(isOpen || (collapsed && isAnyActive)) && !collapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, y: -10 }}
                        animate={{ height: "auto", opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                        className="overflow-hidden space-y-1.5 ml-8 border-l border-white/10 pl-4 py-1"
                    >
                        {group.items.map((item) => {
                            const active = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "group flex items-center justify-between px-4 h-10 rounded-xl text-[12px] font-bold uppercase italic tracking-wider transition-all duration-300 active:scale-95",
                                        active 
                                            ? "text-indigo-400 bg-indigo-500/10 shadow-sm shadow-indigo-500/10" 
                                            : "text-slate-500 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <span className="transition-transform duration-300 group-hover:translate-x-1">{item.label}</span>
                                    {item.badge && (
                                        <span className="bg-indigo-600/20 text-indigo-400 text-[9px] font-black px-2 py-0.5 rounded-full ring-1 ring-indigo-500/30">
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            )
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
