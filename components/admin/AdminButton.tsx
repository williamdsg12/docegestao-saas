"use client"

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean
    icon?: any
    label: string
}

export function AdminButton({ loading, icon: Icon, label, className, ...props }: AdminButtonProps) {
    return (
        <button
            disabled={loading || props.disabled}
            className={cn(
                "h-12 px-6 rounded-xl bg-indigo-600 text-white font-black uppercase italic text-[11px] tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2",
                className
            )}
            {...props}
        >
            {loading ? (
                <Loader2 className="size-4 animate-spin" />
            ) : Icon && (
                <Icon className="size-4" />
            )}
            <span>{loading ? 'Processando...' : label}</span>
        </button>
    )
}
