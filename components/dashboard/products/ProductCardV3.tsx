"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Package, 
  Trash2, 
  Edit2, 
  Copy, 
  EyeOff,
  MoreVertical,
  RotateCw,
  Clock,
  Sparkles,
  Zap,
  ExternalLink
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

import type { Product } from "@/hooks/useProducts"

interface ProductCardV3Props {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  onDuplicate: (product: Product) => void | Promise<any>
  onToggleStatus: (id: string, currentStatus: boolean) => void | Promise<any>
  onUpdateInline: (id: string, updates: Partial<Product>) => void | Promise<any>
  onOptimize: (product: Product) => void | Promise<any>
}

export function ProductCardV3({
  product,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
  onUpdateInline,
  onOptimize
}: ProductCardV3Props) {
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
      whileHover={{ y: -8 }}
      className={cn(
        "group relative bg-white rounded-[24px] border border-slate-100 overflow-hidden transition-all hover:shadow-2xl hover:border-indigo-100 flex flex-col h-full",
        !product.active && "opacity-80 grayscale-[0.5]"
      )}
    >
      {/* Imagem do Produto (Topo) */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="size-full object-cover transition-transform duration-700 group-hover:scale-110" 
          />
        ) : (
          <div className="size-full flex items-center justify-center text-slate-200">
            <Package size={48} strokeWidth={1} />
          </div>
        )}

        {/* Badges Flutuantes */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
           {product.ai_optimized && (
              <div className="px-3 py-1 rounded-full bg-indigo-600 text-white text-[9px] font-black uppercase italic tracking-widest flex items-center gap-1.5 shadow-lg shadow-indigo-600/20">
                 <Sparkles size={10} /> Otimizado IA
              </div>
           )}
           <div className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-900 text-[9px] font-black uppercase tracking-widest shadow-sm">
              {product.category}
           </div>
        </div>

        {/* Status Switch (Floating Top Right) */}
        <div className="absolute top-4 right-4 z-10">
           <Switch 
             checked={product.active}
             onCheckedChange={() => onToggleStatus(product.id, product.active)}
             className="data-[state=checked]:bg-emerald-500 shadow-xl"
           />
        </div>

        {/* Overlay em Inativos */}
        {!product.active && (
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
              <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest italic backdrop-blur-md">
                 Produto Oculto
              </div>
           </div>
        )}
      </div>

      {/* Info Content */}
      <div className="p-6 flex-1 flex flex-col space-y-4">
         <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 uppercase italic leading-tight truncate tracking-tighter group-hover:text-indigo-600 transition-colors">
              {product.name}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold italic line-clamp-2 leading-relaxed h-8">
              {product.description || "Adicione uma descrição irresistível para vender mais."}
            </p>
         </div>

         <div className="flex items-center justify-between pt-2">
            <div className="flex flex-col">
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Preço de Venda</span>
               {isEditingPrice ? (
                 <div className="relative">
                   <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-black text-indigo-400 italic">R$</span>
                   <Input 
                     autoFocus
                     value={inlinePrice}
                     onChange={(e) => setInlinePrice(e.target.value)}
                     onBlur={handlePriceBlur}
                     onKeyDown={(e) => e.key === 'Enter' && handlePriceBlur()}
                     className="h-8 w-24 pl-7 rounded-lg border-2 border-indigo-500 font-black text-sm italic"
                   />
                 </div>
               ) : (
                 <button 
                   onClick={() => setIsEditingPrice(true)}
                   className="text-2xl font-black text-indigo-600 italic leading-none hover:scale-105 transition-transform origin-left"
                 >
                   R$ {product.price.toFixed(2)}
                 </button>
               )}
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
               <Clock size={12} className="text-slate-300" />
               <span className="text-[10px] font-black italic">{product.preparation_time || 30}m</span>
            </div>
         </div>
      </div>

      {/* Ações (Base) */}
      <div className="p-4 bg-slate-50/50 border-t border-slate-100 grid grid-cols-2 gap-2">
         <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit(product)}
            className="h-9 rounded-xl border-slate-200 text-slate-500 font-bold text-[9px] uppercase italic gap-2 hover:bg-white hover:text-indigo-600 transition-all shadow-sm"
         >
            <Edit2 size={12} /> Editar
         </Button>
         <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onOptimize(product)}
            className="h-9 rounded-xl border-slate-200 text-indigo-500 hover:bg-white transition-all shadow-sm gap-2 font-bold text-[9px] uppercase italic"
         >
            <Sparkles size={12} /> IA Expert
         </Button>
      </div>

      <div className="px-4 pb-4 bg-slate-50/50 flex items-center justify-between gap-2">
         <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 h-9 rounded-xl text-slate-400 font-bold text-[9px] uppercase tracking-widest gap-2 hover:bg-white"
         >
            <ExternalLink size={12} /> Ver no Site
         </Button>
         
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button variant="ghost" size="sm" className="h-9 w-9 rounded-xl text-slate-300 hover:text-slate-600">
                  <MoreVertical size={16} />
               </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 border-slate-100 shadow-2xl">
               <DropdownMenuItem onClick={() => onDuplicate(product)} className="rounded-xl font-bold py-2.5 px-3 gap-3 cursor-pointer">
                  <Copy size={14} className="text-slate-400" /> Duplicar Produto
               </DropdownMenuItem>
               <DropdownMenuItem 
                  onClick={() => onDelete(product.id)}
                  className="rounded-xl font-bold py-2.5 px-3 gap-3 text-rose-500 cursor-pointer hover:!bg-rose-50 hover:!text-rose-600"
               >
                  <Trash2 size={14} /> Excluir permanentemente
               </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
      </div>
    </motion.div>
  )
}
