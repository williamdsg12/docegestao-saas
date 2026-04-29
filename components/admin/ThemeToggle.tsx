"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => setMounted(true), [])

    if (!mounted) return <div className="size-11 rounded-xl bg-slate-900/30 lg:size-12" />

    const isDark = theme === "dark"

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="relative size-11 lg:size-12 rounded-xl bg-slate-900/30 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all shadow-inner group overflow-hidden"
        >
            <motion.div
                initial={false}
                animate={{ 
                    y: isDark ? 0 : 40,
                    rotate: isDark ? 0 : 180
                }}
                className="absolute"
            >
                <Moon className="size-5" />
            </motion.div>
            
            <motion.div
                initial={false}
                animate={{ 
                    y: isDark ? -40 : 0,
                    rotate: isDark ? -180 : 0
                }}
                className="absolute text-amber-500"
            >
                <Sun className="size-5" />
            </motion.div>
        </button>
    )
}
