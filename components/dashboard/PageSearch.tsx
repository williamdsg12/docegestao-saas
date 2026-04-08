"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface PageSearchProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
}

export function PageSearch({ value, onChange, placeholder = "Pesquisar...", className }: PageSearchProps) {
  return (
    <div className={cn("relative max-w-md group", className)}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
      <Input
        placeholder={placeholder}
        className="pl-11 h-12 rounded-xl bg-white border-slate-100 shadow-sm focus:ring-4 focus:ring-rose-500/5 transition-all text-xs font-bold uppercase tracking-tight"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
