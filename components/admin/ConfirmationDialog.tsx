"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { AlertTriangle, Trash2 } from "lucide-react"

interface ConfirmationDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'info'
    loading?: boolean
}

export function ConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = 'danger',
    loading = false
}: ConfirmationDialogProps) {
    const variants = {
        danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20",
        warning: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20",
        info: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
    }

    const icons = {
        danger: <Trash2 className="size-8 text-rose-500" />,
        warning: <AlertTriangle className="size-8 text-amber-500" />,
        info: <AlertTriangle className="size-8 text-indigo-500" />
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="bg-[#0B0F1A] border-white/10 rounded-[32px] p-10 shadow-2xl max-w-md">
                <div className="flex flex-col items-center text-center">
                    <div className={cn(
                        "size-20 rounded-3xl mb-8 flex items-center justify-center animate-in zoom-in-50 duration-300",
                        variant === 'danger' && "bg-rose-500/10 border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.1)]",
                        variant === 'warning' && "bg-amber-500/10 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]",
                        variant === 'info' && "bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.1)]"
                    )}>
                        {icons[variant]}
                    </div>

                    <AlertDialogHeader className="mb-8">
                        <AlertDialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none mb-4 text-center">
                            {title}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400 font-medium text-sm leading-relaxed px-4">
                            {description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter className="w-full sm:flex-col gap-4">
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                onConfirm()
                            }}
                            className={cn(
                                "w-full h-14 rounded-2xl font-black uppercase italic tracking-widest text-xs transition-all active:scale-95 shadow-lg",
                                variants[variant]
                            )}
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : confirmText}
                        </AlertDialogAction>
                        <AlertDialogCancel
                            onClick={onClose}
                            className="w-full h-14 rounded-2xl bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10 font-black uppercase italic tracking-widest text-xs transition-all active:scale-95"
                            disabled={loading}
                        >
                            {cancelText}
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    )
}
