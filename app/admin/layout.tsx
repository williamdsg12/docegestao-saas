"use client"

import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminGuard } from "@/components/admin/AdminGuard"
import { useAuth } from "@/hooks/useAuth"
import { Search, User, ChevronDown } from "lucide-react"
import { UserAvatarMenu } from "@/components/dashboard/user-avatar-menu"
import { NotificationCenter } from "@/components/premium/NotificationCenter"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user } = useAuth()

    return (
        <AdminGuard>
            <AdminSidebar>
                <div className="flex flex-col h-full bg-slate-50/50">
                    {/* Admin Header - Floating SaaS Style */}
                    <header className="h-20 px-8 flex items-center justify-between shrink-0 sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
                        <div className="flex items-center gap-8 flex-1">
                            <div className="relative max-w-md w-full hidden md:group-block">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Comando + K para buscar..."
                                    className="w-full h-11 pl-12 pr-4 bg-slate-100/50 border border-slate-200/50 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/20 transition-all outline-none placeholder:text-slate-400 placeholder:italic placeholder:font-black placeholder:uppercase placeholder:tracking-tighter"
                                />
                            </div>
                            
                            {/* Breadcrumbs Placeholder */}
                            <nav className="hidden lg:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                                <span>Platform</span>
                                <span className="size-1 bg-slate-300 rounded-full" />
                                <span className="text-slate-900">Dashboard</span>
                            </nav>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="h-6 w-px bg-slate-200 hidden md:block" />
                            <NotificationCenter />
                            <UserAvatarMenu />
                        </div>
                    </header>

                    {/* Content Area */}
                    <main className="flex-1 overflow-y-auto p-6 md:p-10 xl:p-12 scroll-smooth">
                        <div className="max-w-[1600px] mx-auto pb-20">
                            {children}
                        </div>
                    </main>
                </div>
            </AdminSidebar>
        </AdminGuard>
    )
}
