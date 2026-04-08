"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"

interface PageHeaderProps {
  title: string
  highlight?: string
  subtitle: string
  actions?: ReactNode
}

export function PageHeader({ title, highlight, subtitle, actions }: PageHeaderProps) {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h1 className="text-3xl font-black text-slate-900 uppercase italic leading-none">
          {title} {highlight && <span className="text-rose-500">{highlight}</span>}
        </h1>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest italic mt-2">
          {subtitle}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {actions}
      </div>
    </motion.header>
  )
}
