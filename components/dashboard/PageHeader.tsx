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
      className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4"
    >
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
          {title} {highlight && <span className="text-primary">{highlight}</span>}
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1 line-clamp-2 sm:line-clamp-none">
          {subtitle}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
        {actions}
      </div>
    </motion.header>
  )
}
