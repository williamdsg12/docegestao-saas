"use client"

import { motion } from "framer-motion"
import { Target, Zap, Trophy, TrendingUp, Sparkles, Star } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface GamificationCardProps {
  currentTotal: number
  dailyGoal: number
  streak?: number
}

export function GamificationCard({ currentTotal, dailyGoal, streak = 5 }: GamificationCardProps) {
  const percentage = Math.min(Math.round((currentTotal / dailyGoal) * 100), 100)
  const isGoalReached = currentTotal >= dailyGoal

  return (
    <div className="bg-[var(--bg-card)] rounded-[40px] border border-[var(--border)] p-8 shadow-premium relative overflow-hidden group">
      {/* Background Glow */}
      <div className={cn(
        "absolute -top-24 -right-24 size-64 rounded-full blur-[100px] transition-colors duration-1000",
        isGoalReached ? "bg-emerald-500/10" : "bg-[var(--primary)]/5"
      )} />

      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-[11px] font-black uppercase text-[var(--text-primary)] italic tracking-widest flex items-center gap-2">
              <Target size={14} className="text-[var(--secondary)]" /> Meta Diária de Vendas
            </h4>
            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Mantenha o ritmo para bater seu recorde!</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <Zap size={14} className="text-amber-500 fill-amber-500" />
            <span className="text-[10px] font-black text-amber-500 italic uppercase">{streak} Dias de Fogo</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Progresso Atual</span>
              <h3 className="text-3xl font-black italic tracking-tighter text-[var(--text-primary)]">
                R$ {currentTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Objetivo</span>
              <p className="text-sm font-black text-[var(--text-primary)] uppercase italic">R$ {dailyGoal}</p>
            </div>
          </div>

          <div className="relative h-4 w-full bg-[var(--bg-app)] rounded-full overflow-hidden border border-[var(--border)]">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full relative",
                isGoalReached ? "bg-emerald-500" : "bg-[var(--secondary)]"
              )}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                {percentage > 90 && (
                    <motion.div 
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                    >
                        <Sparkles size={10} className="text-white" />
                    </motion.div>
                )}
            </motion.div>
          </div>

          <div className="flex justify-between items-center text-[10px] font-black uppercase italic tracking-widest">
            <span className={cn(isGoalReached ? "text-emerald-500" : "text-[var(--text-muted)]")}>
                {percentage}% Concluído
            </span>
            {isGoalReached ? (
                <span className="text-emerald-500 flex items-center gap-1">
                    <Trophy size={12} /> Meta Batida!
                </span>
            ) : (
                <span className="text-[var(--text-muted)]">Faltam R$ {(dailyGoal - currentTotal).toFixed(2)}</span>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <TrendingUp size={20} />
                </div>
                <div>
                    <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase">Crescimento</p>
                    <p className="text-[10px] font-black text-[var(--text-primary)] uppercase">+12.5%</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <Star size={20} />
                </div>
                <div>
                    <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase">Nível</p>
                    <p className="text-[10px] font-black text-[var(--text-primary)] uppercase italic">Chef Expert</p>
                </div>
            </div>
        </div>
      </div>

      {isGoalReached && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
          >
            <div className="absolute top-4 right-4 animate-bounce">
                <Trophy size={48} className="text-amber-500/20" />
            </div>
          </motion.div>
      )}
    </div>
  )
}
