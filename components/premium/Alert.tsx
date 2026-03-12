"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { 
    CheckCircle2, 
    AlertTriangle, 
    XCircle, 
    Info,
    X
} from "lucide-react"

interface AlertProps {
    variant: "success" | "warning" | "error" | "info"
    title: string
    description?: string
    onClose?: () => void
    className?: string
}

const variantStyles = {
    success: {
        container: "bg-[#E1F9F0] border-[#34D399] text-[#14532D]",
        icon: <CheckCircle2 className="size-5 text-[#34D399]" />,
        iconBg: "bg-[#34D399]"
    },
    warning: {
        container: "bg-[#FFF9E6] border-[#FBBF24] text-[#92400E]",
        icon: <AlertTriangle className="size-5 text-[#FBBF24]" />,
        iconBg: "bg-[#FBBF24]"
    },
    error: {
        container: "bg-[#FEEBEB] border-[#F87171] text-[#7F1D1D]",
        icon: <XCircle className="size-5 text-[#F87171]" />,
        iconBg: "bg-[#F87171]"
    },
    info: {
        container: "bg-[#EBF5FF] border-[#60A5FA] text-[#1E3A8A]",
        icon: <Info className="size-5 text-[#60A5FA]" />,
        iconBg: "bg-[#60A5FA]"
    }
}

export function PremiumAlert({ variant, title, description, onClose, className }: AlertProps) {
    const styles = variantStyles[variant]

    return (
        <div className={cn(
            "relative w-full flex items-start gap-4 p-4 md:p-6 rounded-lg border shadow-sm transition-all animate-in fade-in slide-in-from-top-4 duration-300",
            styles.container,
            className
        )}>
            {/* Left Indicator Line (TailAdmin style detail) */}
            <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-lg", styles.iconBg)} />

            {/* Icon */}
            <div className="shrink-0 mt-0.5">
                {styles.icon}
            </div>

            {/* Content */}
            <div className="flex-1">
                <h5 className="font-bold text-sm md:text-base leading-tight">
                    {title}
                </h5>
                {description && (
                    <p className="mt-2 text-xs md:text-sm font-medium opacity-90 leading-relaxed">
                        {description}
                    </p>
                )}
            </div>

            {/* Close Button */}
            {onClose && (
                <button 
                    onClick={onClose}
                    className="shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors"
                >
                    <X className="size-4 opacity-60" />
                </button>
            )}
        </div>
    )
}
