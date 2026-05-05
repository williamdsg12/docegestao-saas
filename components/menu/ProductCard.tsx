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
      className="bg-white p-4 rounded-xl border border-slate-100 flex gap-4 cursor-pointer hover:bg-slate-50 transition-all group relative overflow-hidden h-full shadow-sm"
    >
      <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
        <div className="space-y-1">
          <h3 className="font-bold text-slate-900 text-sm md:text-base leading-tight group-hover:text-[#1a56db] transition-colors">
            {product.name}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
            {product.description || "Descrição em breve..."}
          </p>
        </div>
        
        <div className="mt-3">
          <span className="text-sm md:text-base font-black text-slate-900 italic">
            R$ {Number(product.price).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="size-24 rounded-xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100 relative">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="size-full object-cover" />
        ) : (
          <div className="size-full flex items-center justify-center text-slate-200 italic font-black text-[10px] p-2 text-center leading-none">
            DOCE GESTÃO
          </div>
        )}
        
        {/* Floating Add Button OVER photo */}
        <Button 
          size="icon"
          className="absolute bottom-1 right-1 size-7 rounded-full bg-[#1a56db] hover:bg-[#1e40af] text-white shadow-md transition-all active:scale-90 shrink-0 z-10"
          onClick={(e) => {
            e.stopPropagation()
            onAddClick(product)
          }}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  )
}
