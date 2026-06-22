"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface Category {
  id: string
  name: string
}

interface MenuCategoryBarProps {
  categories: Category[]
  activeCategory: string
  onCategoryChange: (id: string) => void
}

export function MenuCategoryBar({ categories, activeCategory, onCategoryChange }: MenuCategoryBarProps) {
  return (
    <div className="sticky top-0 z-40 w-full bg-white border-b border-slate-100 overflow-x-auto no-scrollbar">
      <div className="max-w-4xl mx-auto px-6 flex gap-8 min-w-max">
        <button
          onClick={() => onCategoryChange("all")}
          className={cn(
            "py-4 text-[11px] font-black uppercase tracking-widest transition-all relative",
            activeCategory === "all" ? "text-[var(--primary-color)]" : "text-slate-400 hover:text-slate-600"
          )}
        >
          Tudo
          {activeCategory === "all" && (
            <motion.div 
              layoutId="active-underline" 
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-color)]" 
            />
          )}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={cn(
              "py-4 text-[11px] font-black uppercase tracking-widest transition-all relative",
              activeCategory === cat.id ? "text-[var(--primary-color)]" : "text-slate-400 hover:text-slate-600"
            )}
          >
            {cat.name}
            {activeCategory === cat.id && (
              <motion.div 
                layoutId="active-underline" 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-color)]" 
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
