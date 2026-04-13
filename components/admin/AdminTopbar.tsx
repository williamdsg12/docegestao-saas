"use client"

import { Search, Bell, Settings, User, LogOut } from "lucide-react"
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

export function AdminTopbar() {
    const { user, profile, logout } = useAuth()
    const router = useRouter()

    const handleLogout = async () => {
        await logout()
        router.push("/login")
    }

    return (
        <header className="h-20 shrink-0 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-40">
            {/* Search Bar */}
            <div className="flex-1 max-w-md relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="size-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar em todo o sistema (Ctrl+K)..."
                    className="w-full bg-slate-900/50 border border-white/5 text-slate-300 text-sm rounded-2xl pl-11 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all placeholder:text-slate-600"
                />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <button className="relative size-10 rounded-xl bg-slate-900/50 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <Bell className="size-4.5" />
                        <span className="absolute top-2.5 right-2.5 size-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                    </button>
                    <button className="size-10 rounded-xl bg-slate-900/50 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <Settings className="size-4.5" />
                    </button>
                </div>

                <div className="h-8 w-px bg-white/5" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 focus:outline-none group">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-white leading-none mb-1 group-hover:text-primary transition-colors">{profile?.owner_name || 'Administrador'}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Super Admin</p>
                            </div>
                            <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-500 to-primary p-[2px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="size-5 text-indigo-400" />
                                    )}
                                </div>
                            </div>
                        </button>
                    </DropdownMenuTrigger>
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
