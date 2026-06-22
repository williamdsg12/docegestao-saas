"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

interface AdminModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    description?: string
    children: React.ReactNode
    className?: string
    showClose?: boolean
}

export function AdminModal({
    isOpen,
    onClose,
    title,
    description,
    children,
    className,
    showClose = true
}: AdminModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={cn(
                "bg-[#0B0F1A] border-white/10 text-white rounded-[32px] p-0 overflow-hidden shadow-2xl max-w-2xl w-[95vw]",
                className
            )}>
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/5 rounded-full blur-[80px] pointer-events-none" />

                <div className="relative z-10 p-8 pt-10">
                    <DialogHeader className="mb-8 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                                    {title}
                                </DialogTitle>
                                {description && (
                                    <DialogDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                                        {description}
                                    </DialogDescription>
                                )}
                            </div>
                            {showClose && (
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all active:scale-95 translate-x-2 -translate-y-4"
                                >
                                    <X className="size-6" />
                                </button>
                            )}
                        </div>
                    </DialogHeader>

                    <div className="space-y-6">
                        {children}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
