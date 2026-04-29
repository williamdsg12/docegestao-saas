"use client"

import { Search, Bell, Settings, User, LogOut, Menu } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { AdminBreadcrumbs } from "./AdminBreadcrumbs"
import { ThemeToggle } from "./ThemeToggle"

interface AdminTopbarProps {
    onMenuClick?: () => void
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
    const { user, profile, logout } = useAuth()
    const router = useRouter()

    const handleLogout = async () => {
        await logout()
        router.push("/login")
    }

    return (
        <header className="h-16 shrink-0 border-b border-white/[0.05] bg-[#0c0c0e]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40 w-full">
            <div className="flex items-center gap-6 flex-1">
                {onMenuClick && (
                    <button 
                        onClick={onMenuClick}
                        className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 lg:hidden hover:text-white transition-all"
                    >
                        <Menu className="size-4" />
                    </button>
                )}

                <div className="flex flex-col">
                    <h1 className="text-sm font-semibold text-white flex items-center gap-2">
                        Nexus <span className="text-slate-600 font-normal">/</span> <AdminBreadcrumbs />
                    </h1>
                </div>

                {/* Search Trigger */}
                <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('toggle-admin-search'))}
                    className="flex-1 max-w-[240px] relative group hidden xl:flex items-center text-left ml-4"
                >
                    <Search className="absolute left-3 size-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                    <div className="w-full bg-white/[0.03] border border-white/[0.05] text-slate-500 text-xs rounded-lg pl-10 pr-3 h-8 flex items-center justify-between hover:bg-white/[0.05] transition-all">
                        <span>Buscar...</span>
                        <span className="text-[10px] font-medium opacity-50 px-1.5 py-0.5 rounded border border-white/10 italic">⌘K</span>
                    </div>
                </button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    
                    <button className="relative size-8 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all group">
                        <Bell className="size-4" />
                        <span className="absolute top-2 right-2 size-1.5 bg-indigo-500 rounded-full" />
                    </button>
                </div>

                <div className="h-6 w-px bg-white/[0.05]" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 focus:outline-none group px-2 py-1 rounded-lg hover:bg-white/[0.03] transition-all">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-semibold text-white leading-none mb-1">{profile?.owner_name || 'Admin'}</p>
                                <p className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Super Admin</p>
                            </div>
                            <div className="size-8 rounded-full bg-indigo-600 flex items-center justify-center overflow-hidden border border-white/10">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="size-4 text-white" />
                                )}
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    {/* ... rest unchanged ... */}

                    <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-white/10 text-slate-300 rounded-2xl shadow-2xl shadow-black/50 p-2">
                        <DropdownMenuLabel className="font-bold text-white px-3 py-2">Minha Conta</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5 my-1" />
                        <DropdownMenuItem className="px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-white cursor-pointer transition-colors focus:bg-white/5 focus:text-white">
                            <User className="mr-3 size-4 opacity-70" />
                            <span>Perfil</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-white cursor-pointer transition-colors focus:bg-white/5 focus:text-white">
                            <Settings className="mr-3 size-4 opacity-70" />
                            <span>Preferências</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5 my-1" />
                        <DropdownMenuItem 
                            onClick={handleLogout}
                            className="px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 cursor-pointer transition-colors focus:bg-rose-500/10 focus:text-rose-300"
                        >
                            <LogOut className="mr-3 size-4 opacity-70" />
                            <span>Sair do Sistema</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}

