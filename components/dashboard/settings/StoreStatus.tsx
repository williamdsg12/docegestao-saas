"use client"

import { Button } from "@/components/ui/button"
import { Power, Pause, Play, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface StoreStatusProps {
    data: any
    onChange: (updates: any) => void
}

export function StoreStatus({ data, onChange }: StoreStatusProps) {
    const isManual = data.is_manual_override === true
    const manualStatus = data.manual_status || 'closed'
    
    // Determine visual active state
    const currentMode = isManual ? manualStatus : 'AUTO'

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 rounded-xl p-6 text-white space-y-6 shadow-xl relative overflow-hidden group"
        >
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-white/10 text-emerald-400 flex items-center justify-center border border-white/5 backdrop-blur-md">
                        <Power size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Status da Operação</h3>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">Controle central de vendas</p>
                    </div>
                </div>
                {!isManual && (
                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                        ● Modo Automático Ativo
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                {/* AUTO */}
                <Button
                    onClick={() => onChange({ is_manual_override: false })}
                    className={cn(
                        "h-16 rounded-xl border-2 font-bold text-xs transition-all flex flex-col items-center justify-center gap-1",
                        currentMode === 'AUTO' 
                            ? "bg-slate-700 border-slate-500 text-white shadow-lg" 
                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                    )}
                >
                    <div className="size-2 rounded-full bg-blue-400 animate-pulse" />
                    <span>Automático</span>
                </Button>

                {/* OPEN */}
                <Button
                    onClick={() => onChange({ is_manual_override: true, manual_status: 'open' })}
                    className={cn(
                        "h-16 rounded-xl border-2 font-bold text-xs transition-all flex flex-col items-center justify-center gap-1",
                        currentMode === 'open' 
                            ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20" 
                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                    )}
                >
                    <Play className="size-4" />
                    <span>Abrir Manual</span>
                </Button>

                {/* PAUSED */}
                <Button
                    onClick={() => onChange({ is_manual_override: true, manual_status: 'paused' })}
                    className={cn(
                        "h-16 rounded-xl border-2 font-bold text-xs transition-all flex flex-col items-center justify-center gap-1",
                        currentMode === 'paused' 
                            ? "bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-500/20" 
                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                    )}
                >
                    <Pause className="size-4" />
                    <span>Pausar</span>
                </Button>

                {/* CLOSED */}
                <Button
                    onClick={() => onChange({ is_manual_override: true, manual_status: 'closed' })}
                    className={cn(
                        "h-16 rounded-xl border-2 font-bold text-xs transition-all flex flex-col items-center justify-center gap-1",
                        currentMode === 'closed' 
                            ? "bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/20" 
                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                    )}
                >
                    <Power className="size-4" />
                    <span>Fechar</span>
                </Button>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3 relative z-10">
                <AlertCircle className="size-4 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                    <span className="text-white font-bold">Nota de Operação:</span> O status selecionado aqui é refletido <span className="text-white italic">instantaneamente</span> para todos os clientes no cardápio. O <span className="text-blue-400">Modo Automático</span> segue seu horário de funcionamento configurado abaixo.
                </p>
            </div>
        </motion.div>
    )
}
