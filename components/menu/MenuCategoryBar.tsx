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
    <div className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 overflow-x-auto no-scrollbar shadow-sm">
      <div className="max-w-4xl mx-auto px-4 flex gap-2 py-3 min-w-max">
        <button
          onClick={() => onCategoryChange("all")}
          className={cn(
            "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all relative overflow-hidden",
            activeCategory === "all" 
              ? "text-white shadow-md shadow-red-100" 
              : "text-slate-400 hover:text-slate-600 bg-white border border-slate-100"
          )}
          style={activeCategory === "all" ? { backgroundColor: "var(--ifood-red)" } : {}}
        >
          {activeCategory === "all" && (
            <motion.div 
              layoutId="category-bg" 
              className="absolute inset-0 z-[-1]" 
              style={{ backgroundColor: "var(--ifood-red)" }} 
            />
          )}
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={cn(
              "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all relative overflow-hidden",
              activeCategory === cat.id 
                ? "text-white shadow-md shadow-red-100" 
                : "text-slate-400 hover:text-slate-600 bg-white border border-slate-100"
            )}
            style={activeCategory === cat.id ? { backgroundColor: "var(--ifood-red)" } : {}}
          >
            {activeCategory === cat.id && (
              <motion.div 
                layoutId="category-bg" 
                className="absolute inset-0 z-[-1]" 
                style={{ backgroundColor: "var(--ifood-red)" }} 
              />
            )}
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  )
}
