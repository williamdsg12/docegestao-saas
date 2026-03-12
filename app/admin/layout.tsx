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
                <div className="flex flex-col h-full">
                    {/* Admin Header */}
                    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 relative z-20">
                        <div className="flex items-center gap-8 flex-1">
                            <div className="relative max-w-md w-full hidden md:block">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar empresas, usuários ou faturas..."
                                    className="w-full h-11 pl-12 pr-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-slate-900/5 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <NotificationCenter />
                            <UserAvatarMenu />
                        </div>
                    </header>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 xl:p-12">
                        <div className="max-w-[1600px] mx-auto">
                            {children}
                        </div>
                    </div>
                </div>
            </AdminSidebar>
        </AdminGuard>
    )
}
