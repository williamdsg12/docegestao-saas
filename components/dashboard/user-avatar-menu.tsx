"use client"

import { useAuth } from "@/hooks/useAuth"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
    User,
    Settings,
    CreditCard,
    LogOut,
    ChevronDown,
    Bell,
    Shield,
    Moon,
    Sun,
    UserCircle
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function UserAvatarMenu({ variant = "default" }: { variant?: "default" | "transparent" }) {
    const { user, logout, isAdmin } = useAuth()
    const router = useRouter()
    const [isDarkMode, setIsDarkMode] = useState(false)

    if (!user) return null

    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "Usuário"
    const email = user.email || ""
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture
    const role = isAdmin ? "Administrador" : "Confeiteira"

    const getInitials = (name: string | null) => {
        if (!name) return "U"
        return name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()
    }

    const handleLogout = async () => {
        await logout()
        router.push("/login")
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className={cn(
                    "flex items-center gap-4 pl-4 cursor-pointer group select-none",
                    variant === "default" ? "border-l border-slate-200" : "border-l border-white/20"
                )}>
                    <div className="relative">
                        <div className={cn(
                            "size-10 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center font-black transition-all duration-300",
                            variant === "default" ? "bg-rose-50 text-primary ring-1 ring-slate-100 group-hover:ring-primary/20" : "bg-white/20 backdrop-blur-md text-white group-hover:bg-white/30"
                        )}>
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={fullName}
                                    className="size-full object-cover"
                                />
                            ) : (
                                <span className="text-xs uppercase italic">{getInitials(fullName)}</span>
                            )}
                        </div>
                        {/* Status Online */}
                        <div className={cn(
                            "absolute bottom-0 right-0 size-3 bg-emerald-500 rounded-full border-2 shadow-sm animate-pulse",
                            variant === "default" ? "border-white ring-1 ring-emerald-100" : "border-pink-400"
                        )} />
                    </div>

                    <div className="flex flex-col items-start leading-tight">
                        <div className="flex items-center gap-1.5">
                            <span className={cn(
                                "text-sm font-black italic uppercase tracking-tighter transition-colors",
                                variant === "default" ? "text-slate-900 group-hover:text-primary" : "text-slate-900 group-hover:text-white"
                            )}>
                                {fullName.split(' ')[0]} {fullName.split(' ').length > 1 ? fullName.split(' ').slice(-1) : ''}
                            </span>
                            <ChevronDown className={cn(
                                "size-3 transition-all group-hover:translate-y-0.5",
                                variant === "default" ? "text-slate-400 group-hover:text-primary" : "text-pink-700 group-hover:text-white"
                            )} />
                        </div>
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest mt-0.5",
                            variant === "default" ? "text-slate-400" : "text-pink-700"
                        )}>
                            {role}
                        </span>
                    </div>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
                align="end" 
                className="w-72 rounded-[32px] p-2 shadow-2xl border-slate-100/50 bg-white/80 backdrop-blur-xl animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
            >
                <DropdownMenuLabel className="p-4 mb-2">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-lg shadow-slate-900/10">
                            <UserCircle className="size-7" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <p className="text-sm font-black text-slate-900 uppercase italic tracking-tighter truncate">
                                {fullName}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest">
                                {email}
                            </p>
                        </div>
                    </div>
                </DropdownMenuLabel>
                
                <div className="px-2 pb-2 space-y-1">
                    <DropdownMenuItem className="rounded-[18px] px-4 py-3 text-[11px] font-black text-slate-600 uppercase tracking-widest italic focus:bg-slate-50 focus:text-primary cursor-pointer gap-3 transition-all">
                        <User className="size-4 text-primary/50" />
                        Meu Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-[18px] px-4 py-3 text-[11px] font-black text-slate-600 uppercase tracking-widest italic focus:bg-slate-50 focus:text-primary cursor-pointer gap-3 transition-all">
                        <Settings className="size-4 text-primary/50" />
                        Configurações
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-[18px] px-4 py-3 text-[11px] font-black text-slate-600 uppercase tracking-widest italic focus:bg-slate-50 focus:text-primary cursor-pointer gap-3 transition-all">
                        <Bell className="size-4 text-primary/50" />
                        Notificações
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-[18px] px-4 py-3 text-[11px] font-black text-slate-600 uppercase tracking-widest italic focus:bg-slate-50 focus:text-primary cursor-pointer gap-3 transition-all">
                        <Shield className="size-4 text-primary/50" />
                        Segurança
                    </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="mx-2 my-2 bg-slate-100/50" />
                
                <div className="px-2 pb-2 space-y-1">
                    <div 
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="flex items-center justify-between rounded-[18px] px-4 py-3 text-[11px] font-black text-slate-600 uppercase tracking-widest italic hover:bg-slate-50 hover:text-primary cursor-pointer transition-all"
                    >
                        <div className="flex items-center gap-3">
                            {isDarkMode ? <Sun className="size-4 text-amber-500" /> : <Moon className="size-4 text-indigo-500" />}
                            Modo Escuro
                        </div>
                        <div className={cn(
                            "w-10 h-5 rounded-full relative transition-colors duration-300 p-1",
                            isDarkMode ? "bg-slate-900" : "bg-slate-200"
                        )}>
                            <div className={cn(
                                "size-3 bg-white rounded-full shadow-sm transition-transform duration-300",
                                isDarkMode ? "translate-x-5" : "translate-x-0"
                            )} />
                        </div>
                    </div>

                    <DropdownMenuItem
                        onClick={handleLogout}
                        className="rounded-[18px] px-4 py-3 text-[11px] font-black text-rose-500 uppercase tracking-widest italic focus:bg-rose-50 focus:text-rose-600 cursor-pointer gap-3 transition-all"
                    >
                        <LogOut className="size-4" />
                        Sair do Sistema
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
