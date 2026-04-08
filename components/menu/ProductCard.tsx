"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  description?: string
  price: number
  image_url?: string
  is_highlight?: boolean
}

interface ProductCardProps {
  product: Product
  onClick: (product: Product) => void
  onAddClick: (product: Product) => void
}

export function ProductCard({ product, onClick, onAddClick }: ProductCardProps) {
  return (
    <div 
      onClick={() => onClick(product)}
      className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 flex gap-4 md:gap-6 cursor-pointer hover-lift transition-all group relative overflow-hidden h-full shadow-sm"
    >
      <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
        <div className="space-y-1.5 md:space-y-2">
          {product.is_highlight && (
             <span className="text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2 py-0.5 rounded-full mb-1 inline-block">
               Destaque
             </span>
          )}
          <h3 className="font-bold text-slate-800 uppercase italic leading-tight text-sm md:text-base truncate group-hover:text-red-600 transition-colors">
            {product.name}
          </h3>
          <p className="text-[11px] md:text-xs text-slate-500 font-medium line-clamp-2 md:line-clamp-3 leading-relaxed">
            {product.description || "Descrição em breve..."}
          </p>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <span className="text-base md:text-xl font-black text-slate-900 italic tracking-tighter">
            R$ {Number(product.price).toFixed(2)}
          </span>
          <Button 
            size="icon"
            className="size-8 md:size-10 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-lg transition-all active:scale-90 group/btn shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              onAddClick(product)
            }}
          >
            <Plus className="size-4 md:size-5 group-hover/btn:rotate-90 transition-transform" />
          </Button>
        </div>
      </div>

      <div className="size-24 md:size-32 rounded-2xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100 relative group-hover:scale-105 transition-transform duration-500">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="size-full object-cover" />
        ) : (
          <div className="size-full flex items-center justify-center text-slate-300 italic font-black text-xs p-2 text-center leading-none">
            DOCE GESTÃO
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
      </div>
    </div>
  )
}
