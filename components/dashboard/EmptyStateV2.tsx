"use client"

import { SearchX, LucideIcon } from "lucide-react"
import { motion } from "framer-motion"

interface EmptyStateV2Props {
  icon?: LucideIcon
  title: string
  subtitle: string
  action?: React.ReactNode
}

export function EmptyStateV2({ icon: Icon = SearchX, title, subtitle, action }: EmptyStateV2Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="col-span-full py-32 text-center flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-100 rounded-[32px] sm:rounded-[48px]"
    >
      <div className="size-20 bg-white shadow-xl shadow-rose-500/5 rounded-3xl flex items-center justify-center text-rose-500 mb-8 border border-rose-50">
        <Icon className="size-10 opacity-40 shrink-0" />
      </div>
      <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">{title}</h3>
      <p className="text-slate-400 mt-2 max-w-xs font-bold uppercase text-[10px] tracking-widest italic">{subtitle}</p>
      {action && <div className="mt-8">{action}</div>}
    </motion.div>
  )
}
