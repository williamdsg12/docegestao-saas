"use client"

import { motion } from "framer-motion"
import { 
  ChevronLeft, 
  Search, 
  ShoppingCart, 
  Clock, 
  Star, 
  Instagram,
  MapPin,
  ChevronRight,
  Plus
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  price: number
  category: string
  active: boolean
  image_url?: string
  description?: string
}

interface DigitalMenuMockupProps {
  businessName?: string
  logoUrl?: string
  primaryColor?: string
  products: Product[]
  city?: string
  state?: string
}

export function DigitalMenuMockup({
  businessName = "Minha Doce Gestão",
  logoUrl,
  primaryColor = "#FF2F81",
  products,
  city,
  state
}: DigitalMenuMockupProps) {
  const activeProducts = products.filter(p => p.active)
  const categories = Array.from(new Set(activeProducts.map(p => p.category)))

  return (
    <div className="w-full h-full max-w-[320px] mx-auto bg-white rounded-[40px] border-[8px] border-slate-900 shadow-2xl relative overflow-hidden flex flex-col font-sans">
      {/* Top Status Bar (Mock) */}
      <div className="h-10 bg-white flex items-center justify-between px-6 shrink-0">
         <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">14:14</span>
         <div className="flex gap-1">
            <div className="size-2 rounded-full bg-slate-200" />
            <div className="size-2 rounded-full bg-slate-200" />
         </div>
      </div>

      {/* Header / Store Info */}
      <div className="relative shrink-0">
          <div className="h-32 bg-slate-100 overflow-hidden relative">
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
             <img 
              src={logoUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1000&auto=format&fit=crop"} 
              className="size-full object-cover opacity-50 blur-[2px]" 
             />
          </div>
          
          <div className="px-5 -mt-10 relative z-10">
             <div className="bg-white rounded-3xl p-4 shadow-xl border border-slate-100 flex flex-col items-center text-center space-y-2">
                <div className="size-16 rounded-2xl bg-white border-4 border-white shadow-lg -mt-12 overflow-hidden bg-slate-50">
                   {logoUrl ? (
                     <img src={logoUrl} className="size-full object-cover" />
                   ) : (
                     <div className="size-full flex items-center justify-center text-slate-300">🏪</div>
                   )}
                </div>
                <h4 className="text-sm font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                  {businessName}
                </h4>
                <div className={cn(
                   "flex items-center gap-2 text-[8px] font-bold uppercase tracking-widest",
                   city ? "text-slate-400" : "text-amber-500 animate-pulse"
                )}>
                   <MapPin size={8} /> 
                   {city ? `${city}, ${state}` : "Defina sua localização"}
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                   <div className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase">Aberto Agora</div>
                   <div className="flex items-center gap-0.5 text-amber-500">
                      <Star size={8} fill="currentColor" />
                      <span className="text-[8px] font-black">4.9</span>
                   </div>
                </div>
             </div>
          </div>
      </div>

      {/* Search & Categories Bar */}
      <div className="px-5 py-6 space-y-4 shrink-0">
         <div className="h-10 bg-slate-50 rounded-2xl flex items-center px-4 gap-3 border border-slate-100">
            <Search size={14} className="text-slate-400" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">O que vamos pedir?</span>
         </div>

         <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {["Destaques", ...categories].map((c, i) => (
              <div 
                key={c} 
                className={cn(
                  "px-4 py-2 rounded-xl text-[9px] font-black uppercase italic tracking-tighter shrink-0 whitespace-nowrap",
                  i === 0 ? "text-white" : "bg-slate-50 text-slate-400"
                )}
                style={i === 0 ? { backgroundColor: primaryColor } : {}}
              >
                {c}
              </div>
            ))}
         </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto px-5 space-y-6 pb-20 no-scrollbar">
         {categories.map(cat => (
           <div key={cat} className="space-y-4">
              <h5 className="text-[11px] font-black uppercase italic text-slate-900 flex items-center gap-2">
                 {cat} <div className="h-px flex-1 bg-slate-100" />
              </h5>
              
              <div className="grid grid-cols-1 gap-4">
                 {activeProducts.filter(p => p.category === cat).map(product => (
                   <div key={product.id} className="flex gap-4 items-center">
                      <div className="flex-1 space-y-1">
                         <h6 className="text-[10px] font-black uppercase italic text-slate-900 leading-tight truncate">
                           {product.name}
                         </h6>
                         <p className="text-[8px] text-slate-400 font-bold line-clamp-2 italic leading-relaxed">
                           {product.description || "Descrição irresistível disponível em breve..."}
                         </p>
                         <p className="text-xs font-black italic" style={{ color: primaryColor }}>
                           R$ {product.price.toFixed(2)}
                         </p>
                      </div>
                      <div className="size-16 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0 relative group">
                         {product.image_url ? (
                           <img src={product.image_url} className="size-full object-cover" />
                         ) : (
                           <div className="size-full flex items-center justify-center text-slate-200">🍪</div>
                         )}
                         <div className="absolute top-1 right-1 size-5 rounded-lg bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center">
                            <Plus size={12} style={{ color: primaryColor }} strokeWidth={4} />
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
         ))}
      </div>

      {/* Floating Cart (Mock) */}
      <div className="absolute bottom-6 left-5 right-5 h-12 rounded-2xl shadow-2xl flex items-center justify-between px-6 text-white transition-all transform active:scale-95 cursor-pointer" style={{ backgroundColor: primaryColor }}>
         <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-white/20 flex items-center justify-center font-black text-[10px]">2</div>
            <span className="text-[10px] font-black uppercase italic tracking-widest leading-none">Ver Meu Pedido</span>
         </div>
         <span className="text-[11px] font-black italic tracking-tighter">R$ 54,90</span>
      </div>
    </div>
  )
}
