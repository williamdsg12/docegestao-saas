"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Package, 
  Trash2, 
  Edit2, 
  Copy, 
  Eye, 
  EyeOff,
  MoreVertical,
  Plus,
  RotateCw,
  Clock,
  TrendingUp,
  GripVertical,
  Sparkles,
  Zap,
  CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  price: number
  category: string
  active: boolean
  image_url?: string
  description?: string
  preparation_time?: number
  ai_score?: number
  ai_optimized?: boolean
}

interface HorizontalProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  onDuplicate: (product: Product) => void
  onToggleStatus: (id: string, currentStatus: boolean) => void
  onUpdateInline: (id: string, updates: Partial<Product>) => void
  onOptimize: (product: Product) => void
  isDragging?: boolean
  dragHandleProps?: any
}

export function HorizontalProductCard({
  product,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
  onUpdateInline,
  onOptimize,
  isDragging,
  dragHandleProps
}: HorizontalProductCardProps) {
  const [inlinePrice, setInlinePrice] = useState(product.price.toString())
  const [isEditingPrice, setIsEditingPrice] = useState(false)

  const handlePriceBlur = () => {
    const newPrice = parseFloat(inlinePrice)
    if (!isNaN(newPrice) && newPrice !== product.price) {
      onUpdateInline(product.id, { price: newPrice })
    }
    setIsEditingPrice(false)
  }

  return (
    <motion.div
      layout
      className={cn(
        "group relative bg-white rounded-3xl border border-slate-100 p-4 transition-all hover:shadow-2xl hover:border-indigo-100",
        isDragging && "shadow-3xl ring-4 ring-indigo-500/10 opacity-90 z-50 cursor-grabbing bg-slate-50"
      )}
    >
      {/* Botões de Ação no Hover */}
      <div className="absolute -top-3 -right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 z-20">
         <Button 
          size="sm" 
          onClick={() => onOptimize(product)}
          className="size-10 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 p-0"
         >
            <Sparkles size={16} />
         </Button>
         <Button 
          size="sm" 
          variant="outline"
          onClick={() => onEdit(product)}
          className="size-10 rounded-2xl bg-white border-slate-100 text-slate-500 shadow-xl p-0 hover:text-blue-500"
         >
            <Edit2 size={16} />
         </Button>
         <Button 
          size="sm" 
          variant="outline"
          onClick={() => onDuplicate(product)}
          className="size-10 rounded-2xl bg-white border-slate-100 text-slate-500 shadow-xl p-0 hover:text-indigo-500"
         >
            <Copy size={16} />
         </Button>
         <Button 
          size="sm" 
          variant="outline"
          onClick={() => onDelete(product.id)}
          className="size-10 rounded-2xl bg-white border-slate-100 text-rose-400 shadow-xl p-0 hover:text-rose-600 hover:bg-rose-50"
         >
            <Trash2 size={16} />
         </Button>
      </div>

      <div className="flex items-center gap-5">
        {/* Drag Handle */}
        <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-slate-200 hover:text-indigo-400 transition-colors">
          <GripVertical size={22} />
        </div>

        {/* Image / Thumbnail */}
        <div className="relative size-24 rounded-[32px] overflow-hidden bg-slate-50 border border-slate-100 shrink-0 shadow-inner">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="size-full object-cover transition-transform group-hover:scale-110 duration-500" />
          ) : (
            <div className="size-full flex items-center justify-center text-slate-300">
              <Package size={28} />
            </div>
          )}
          
          {product.ai_optimized && (
             <div className="absolute top-2 left-2 size-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg animate-pulse">
                <Sparkles size={12} />
             </div>
          )}

          {!product.active && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
              <EyeOff size={18} className="text-white" />
            </div>
          )}
        </div>

        {/* Info Area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
             <h3 className="text-lg font-black text-slate-900 uppercase italic leading-none truncate tracking-tight">
               {product.name}
             </h3>
             {product.ai_optimized && (
                <div className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-widest border border-indigo-100">
                   Top Score {product.ai_score || 0}
                </div>
             )}
          </div>
          
          <div className="flex items-center gap-3">
             {isEditingPrice ? (
                <div className="relative">
                   <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-black text-indigo-400 italic">R$</span>
                   <Input 
                     autoFocus
                     value={inlinePrice}
                     onChange={(e) => setInlinePrice(e.target.value)}
                     onBlur={handlePriceBlur}
                     onKeyDown={(e) => e.key === 'Enter' && handlePriceBlur()}
                     className="h-8 w-24 pl-7 rounded-xl border-2 border-indigo-400 font-black text-sm italic py-0"
                   />
                </div>
             ) : (
                <button 
                  onClick={() => setIsEditingPrice(true)}
                  className="text-xl font-black italic text-indigo-600 hover:text-indigo-400 transition-colors"
                >
                  R$ {product.price.toFixed(2)}
                </button>
             )}
             <div className="size-1 rounded-full bg-slate-200" />
             <div className="flex items-center gap-1 text-slate-400">
                <Clock size={12} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{product.preparation_time || 30}m</span>
             </div>
          </div>

          <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <Switch 
                   checked={product.active}
                   onCheckedChange={() => onToggleStatus(product.id, product.active)}
                   className="scale-75 data-[state=checked]:bg-emerald-500"
                 />
                 <span className={cn(
                   "text-[9px] font-black uppercase tracking-widest",
                   product.active ? "text-emerald-500" : "text-slate-400"
                 )}>
                    {product.active ? "Visível" : "Oculto"}
                 </span>
              </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
