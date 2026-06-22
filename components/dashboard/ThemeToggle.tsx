"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-9 w-[140px] rounded-full bg-[var(--bg-card)] border border-[var(--border)] animate-pulse" />
  }

  const isDark = resolvedTheme === "dark"

  return (
    <div className="flex items-center gap-1 p-1 bg-[var(--bg-app)] border border-[var(--border)] rounded-full shadow-inner h-9">
      <button
        onClick={() => setTheme("light")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all h-7",
          !isDark 
            ? "bg-white text-[var(--primary)] shadow-sm border border-[var(--border)]" 
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        )}
      >
        <Sun size={12} className={cn(!isDark && "animate-spin-slow")} />
        <span className={cn(isDark && "hidden md:inline-block")}>Light</span>
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all h-7",
          isDark 
            ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm" 
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        )}
      >
        <Moon size={12} className={cn(isDark && "animate-pulse")} />
        <span className={cn(!isDark && "hidden md:inline-block")}>Dark</span>
      </button>
    </div>
  )
}
