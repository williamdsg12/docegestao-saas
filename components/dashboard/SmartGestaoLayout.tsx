"use client"

import React from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
    LayoutDashboard, 
    Package, 
    ShoppingBag, 
    Flame, 
    Bell, 
    User,
    ChevronLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const TABS = [
    { id: 'home', label: 'Gestão', icon: LayoutDashboard, href: '/dashboard/gestao' },
    { id: 'estoque', label: 'Estoque', icon: Package, href: '/dashboard/estoque' },
    { id: 'compras', label: 'Compras', icon: ShoppingBag, href: '/dashboard/lista-compras' },
    { id: 'producao', label: 'Produção', icon: Flame, href: '/dashboard/producao' },
]

export function SmartGestaoLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()

    return (
        <div className="min-h-screen flex flex-col font-sans select-none">
            {/* Fix Header - Mobile Only */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 z-50 px-4 flex md:hidden items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                     <div className="size-8 rounded-lg bg-pink-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                        <Flame size={18} fill="white" />
                    </div>
                    <span className="font-black italic uppercase text-lg tracking-tighter text-slate-900">
                        Doce <span className="text-pink-500">Gestão</span>
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="size-10 rounded-full text-slate-400 relative">
                        <Bell size={20} />
                        <span className="absolute top-2.5 right-2.5 size-2 bg-pink-500 rounded-full border-2 border-white" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-10 rounded-full text-slate-400">
                        <User size={20} />
                    </Button>
                </div>
            </header>

            {/* Main Content Area - Wide on Desktop */}
            <main className="flex-1 md:pt-0 pt-20 md:pb-0 pb-28 overflow-x-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="w-full"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Bottom Tab Navigation - Mobile Only */}
            <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50 flex md:hidden items-center justify-around px-2 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] border-t-slate-100">
                {TABS.map((tab) => {
                    const isActive = pathname === tab.href
                    return (
                        <button
                            key={tab.id}
                            onClick={() => router.push(tab.href)}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1.5 transition-all duration-300 w-16",
                                isActive ? "text-pink-600 scale-110" : "text-slate-300"
                            )}
                        >
                            <div className={cn(
                                "flex flex-col items-center justify-center rounded-2xl transition-all duration-500",
                                isActive ? "bg-pink-100/50 p-2.5 -mt-2" : "p-2"
                            )}>
                                <tab.icon size={isActive ? 20 : 22} strokeWidth={isActive ? 3 : 2} />
                            </div>
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest transition-opacity duration-300",
                                isActive ? "opacity-100" : "opacity-0 h-0"
                            )}>
                                {tab.label}
                            </span>
                        </button>
                    )
                })}
            </nav>
        </div>
    )
}
