"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"

interface FilterOption {
  key: string
  label: string
  count?: number
}

interface PageFiltersProps {
  options: FilterOption[]
  activeKey: string
  onSelect: (key: string) => void
}

export function PageFilters({ options, activeKey, onSelect }: PageFiltersProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {options.map((option) => (
        <motion.button
          key={option.key}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(option.key)}
          className={cn(
            "px-4 py-2 rounded-xl border text-[10px] font-black uppercase transition-all whitespace-nowrap flex items-center gap-2",
            activeKey === option.key
              ? "bg-slate-900 text-white border-slate-900 shadow-lg"
              : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
          )}
        >
          {option.label}
          {option.count !== undefined && (
            <Badge 
              className={cn(
                "h-4 px-1 rounded transition-colors",
                activeKey === option.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              )}
            >
              {option.count}
            </Badge>
          )}
        </motion.button>
      ))}
    </div>
  )
}
