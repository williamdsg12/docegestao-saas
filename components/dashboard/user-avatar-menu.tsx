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
import { useTheme } from "next-themes"
import { useUserSettings } from "@/hooks/useUserSettings"
import { cn } from "@/lib/utils"

export function UserAvatarMenu({ variant = "default" }: { variant?: "default" | "transparent" }) {
    const { user, logout, isAdmin, role: userRole } = useAuth()
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const { updateSettings } = useUserSettings()

    const toggleTheme = async () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark'
        setTheme(newTheme)
        if (user) {
            await updateSettings({ theme: newTheme })
        }
    }

    if (!user) return null

    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "Usuário"
    const email = user.email || ""
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture
    const roleDisplay = isAdmin ? "Dono Supremo" : (userRole === 'admin' ? "Administrador" : "Confeiteira")

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
                    "flex items-center gap-3 pl-3 cursor-pointer group select-none transition-all",
                    variant === "default" ? "border-l border-[var(--border)]" : "border-l border-white/20"
                )}>
                    <div className="relative">
                        <div className={cn(
                            "size-10 rounded-2xl border-2 border-[var(--bg-card)] shadow-sm overflow-hidden flex items-center justify-center font-black transition-all duration-300",
                            variant === "default" ? "bg-[var(--accent-light)] text-[var(--primary)] ring-1 ring-[var(--border)] group-hover:ring-[var(--secondary)]/30" : "bg-white/20 backdrop-blur-md text-white group-hover:bg-white/30"
                        )}>
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={fullName}
                                    className="size-full object-cover"
                                />
                            ) : (
                                <span className="text-[10px] uppercase italic tracking-tighter">{getInitials(fullName)}</span>
                            )}
                        </div>
                        {/* Status Online */}
                        <div className="absolute -bottom-1 -right-1 size-3.5 bg-emerald-500 rounded-full border-[3px] border-[var(--bg-card)] shadow-sm" />
                    </div>

                    <div className="hidden sm:flex flex-col items-start leading-tight">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-black italic uppercase tracking-tighter text-[var(--text-primary)] group-hover:text-[var(--secondary)] transition-colors">
                                {fullName.split(' ')[0]}
                            </span>
                            <ChevronDown className="size-3 text-[var(--text-muted)] transition-all group-hover:translate-y-0.5 group-hover:text-[var(--secondary)]" />
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] mt-0.5">
                            {roleDisplay}
                        </span>
                    </div>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
                align="end" 
                className="w-72 rounded-[32px] p-2 shadow-2xl border-[var(--border)] bg-[var(--bg-card)]/95 backdrop-blur-xl animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
            >
                <DropdownMenuLabel className="p-4 mb-2">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] shrink-0 shadow-lg shadow-[var(--primary)]/10">
                            <UserCircle className="size-7" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <p className="text-[11px] font-black text-[var(--text-primary)] uppercase italic tracking-tighter truncate">
                                {fullName}
                            </p>
                            <p className="text-[9px] font-bold text-[var(--text-muted)] truncate uppercase tracking-widest">
                                {email}
                            </p>
                        </div>
                    </div>
                </DropdownMenuLabel>
                
                <div className="px-2 pb-2 space-y-1">
                    <DropdownMenuItem 
                        onClick={() => router.push("/dashboard/profile")}
                        className="rounded-[18px] px-4 py-3 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest italic focus:bg-[var(--accent-light)] focus:text-[var(--primary)] cursor-pointer gap-3 transition-all"
                    >
                        <User className="size-4 opacity-50" />
                        Meu Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        onClick={() => router.push("/dashboard/settings")}
                        className="rounded-[18px] px-4 py-3 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest italic focus:bg-[var(--accent-light)] focus:text-[var(--primary)] cursor-pointer gap-3 transition-all"
                    >
                        <Settings className="size-4 opacity-50" />
                        Configurações
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        onClick={() => router.push("/dashboard/notificacoes")}
                        className="rounded-[18px] px-4 py-3 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest italic focus:bg-[var(--accent-light)] focus:text-[var(--primary)] cursor-pointer gap-3 transition-all"
                    >
                        <Bell className="size-4 opacity-50" />
                        Notificações
                    </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="mx-2 my-2 bg-[var(--border)]" />
                
                <div className="px-2 pb-2 space-y-1">
                    <div 
                        onClick={toggleTheme}
                        className="flex items-center justify-between rounded-[18px] px-4 py-3 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest italic hover:bg-[var(--accent-light)] hover:text-[var(--primary)] cursor-pointer transition-all"
                    >
                        <div className="flex items-center gap-3">
                            {theme === 'dark' ? <Sun className="size-4 text-amber-500" /> : <Moon className="size-4 text-indigo-500" />}
                            Modo Escuro
                        </div>
                        <div className={cn(
                            "w-10 h-5 rounded-full relative transition-colors duration-300 p-1",
                            theme === 'dark' ? "bg-[var(--primary)]" : "bg-[var(--border)]"
                        )}>
                            <div className={cn(
                                "size-3 bg-white rounded-full shadow-sm transition-transform duration-300",
                                theme === 'dark' ? "translate-x-5" : "translate-x-0"
                            )} />
                        </div>
                    </div>

                    <DropdownMenuItem
                        onClick={handleLogout}
                        className="rounded-[18px] px-4 py-3 text-[10px] font-black text-rose-500 uppercase tracking-widest italic focus:bg-rose-500/10 focus:text-rose-600 cursor-pointer gap-3 transition-all"
                    >
                        <LogOut className="size-4" />
                        Sair do Sistema
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

