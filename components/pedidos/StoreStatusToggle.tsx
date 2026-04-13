"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Store, Power, AlertCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { StoreStatusResult } from "@/lib/storeStatus"

interface StoreStatusToggleProps {
    status: StoreStatusResult
    onToggle: (isOpen: boolean) => void
    isLoading?: boolean
}

export function StoreStatusToggle({ status, onToggle, isLoading }: StoreStatusToggleProps) {
    const isManualOpen = status.status !== 'MANUAL_CLOSED' // Actually is_open_manual is what we toggle

    return (
        <div className="flex flex-col gap-1">
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onToggle(!isManualOpen)}
                disabled={isLoading}
                className={cn(
                    "relative h-12 px-6 rounded-2xl flex items-center gap-3 transition-all duration-500 overflow-hidden shadow-lg",
                    status.isOpen 
                        ? "bg-emerald-500 text-white shadow-emerald-200" 
                        : isManualOpen 
                            ? "bg-amber-500 text-white shadow-amber-200" // Manual Open but Outside Hours
                            : "bg-rose-500 text-white shadow-rose-200"    // Manual Closed
                )}
            >
                {/* Background Glow Animation when Open */}
                <AnimatePresence>
                    {status.isOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-white"
                        />
                    )}
                </AnimatePresence>

                <div className="relative z-10 flex items-center gap-3 w-full">
                    {isLoading ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                            <Power className="size-5" />
                        </motion.div>
                    ) : status.isOpen ? (
                        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                            <Store className="size-5" />
                        </motion.div>
                    ) : isManualOpen ? (
                        <Clock className="size-5" />
                    ) : (
                        <Power className="size-5" />
                    )}

                    <div className="flex flex-col items-start leading-none gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                            {isLoading ? "Processando..." : status.isOpen ? "Loja Aberta" : isManualOpen ? "Fora de Horário" : "Loja Fechada"}
                        </span>
                        <span className="text-xs font-black italic uppercase tracking-tighter">
                            {status.isOpen ? "Recebendo Pedidos" : isManualOpen ? "Abre em Breve" : "Clique p/ Abrir"}
                        </span>
                    </div>
                </div>

                {/* Status Indicator Dot */}
                <div className={cn(
                    "size-2.5 rounded-full border-2 border-white ml-auto relative z-10",
                    status.isOpen ? "bg-white animate-pulse" : "bg-white/30"
                )} />
            </motion.button>

            {/* Hint message below */}
            <AnimatePresence>
                {!status.isOpen && (
                    <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 flex items-center gap-1.5"
                    >
                        <AlertCircle className="size-3" />
                        {status.message}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    )
}
