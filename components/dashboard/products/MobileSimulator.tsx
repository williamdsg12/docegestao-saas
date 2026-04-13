"use client"

import { motion } from "framer-motion"
import { 
  Wifi, 
  Battery,
  Star,
  Clock,
  MapPin,
  Search,
  ShoppingCart
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  category: string
  price: number
  active: boolean
  image_url?: string
  description?: string
}

interface MobileSimulatorProps {
  business: any
  products: Product[]
  selectedCategory: string
}

export function MobileSimulator({ business, products, selectedCategory }: MobileSimulatorProps) {
  const filteredProducts = products.filter(p => 
    selectedCategory === "Todos" || p.category === selectedCategory
  )

  return (
    <div className="flex flex-col items-center py-4 w-full">
      {/* 📱 SMARTPHONE FRAME (PROPORÇÃO REAL 9/19.5) */}
      <div className="relative">
        {/* Sombra Profissional */}
        <div className="absolute -inset-10 bg-black/5 blur-[50px] rounded-[100px] pointer-events-none" />
        
        {/* Case do Smartphone */}
        <div className="relative w-[360px] aspect-[9/19.5] bg-slate-900 rounded-[55px] p-2.5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-[8px] border-slate-800 ring-1 ring-white/10 overflow-hidden">
          
          {/* Inner Screen */}
          <div className="relative size-full bg-[#F8F9FA] rounded-[42px] overflow-hidden flex flex-col">
            
            {/* 🔋 STATUS BAR */}
            <div className="h-12 flex items-center justify-between px-10 pt-4 shrink-0 z-50">
               <span className="text-[11px] font-black text-slate-900 italic">9:41</span>
               <div className="flex items-center gap-1.5 text-slate-900">
                  <Wifi size={12} strokeWidth={3} />
                  <Battery size={14} strokeWidth={3} />
               </div>
            </div>

            {/* 🔳 NOTCH (DINÂMICO) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-slate-900 rounded-b-3xl z-50 flex items-center justify-center gap-2">
               <div className="w-10 h-1bg-slate-800 rounded-full" />
               <div className="size-2 rounded-full bg-slate-800" />
            </div>

            {/* 📍 CONTEÚDO NATIVO DO CARDÁPIO */}
            <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
              {/* Cover Image Simulation */}
              <div className="relative h-32 w-full overflow-hidden shrink-0">
                <img 
                  src={business?.cover_url || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=1000"} 
                  className="size-full object-cover" 
                  alt="Cover"
                />
                <div className="absolute inset-0 bg-black/20" />
              </div>

              {/* Profile Bar */}
              <div className="px-5 -mt-8 relative z-10">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="size-14 rounded-xl overflow-hidden border-2 border-white shadow-md shrink-0">
                      <img src={business?.logo_url || "https://api.dicebear.com/7.x/initials/svg?seed=DG"} className="size-full object-cover" alt="Logo" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black uppercase italic tracking-tighter truncate leading-none">{business?.nome || 'Minha Loja'}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-emerald-50 text-emerald-600 border-none px-1.5 py-0 text-[7px] font-black uppercase">Aberto</Badge>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">30-45 min</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Native Category Pills */}
              <div className="mt-4 px-5 flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {["Todos", "Combos", "Bolos", "Doces"].map(cat => (
                  <button key={cat} className={cn(
                    "px-4 py-1.5 rounded-full text-[8px] font-black uppercase italic tracking-widest whitespace-nowrap transition-all",
                    selectedCategory === cat ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-100"
                  )}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Simulation */}
              <div className="px-5 mt-4">
                <div className="h-10 bg-white rounded-xl border border-slate-100 flex items-center px-4 gap-3 text-slate-300">
                  <Search size={14} />
                  <span className="text-[10px] font-medium italic">Buscar no cardápio...</span>
                </div>
              </div>

              {/* Product List */}
              <div className="px-5 mt-6 pb-20 space-y-3">
                <h5 className="text-[10px] font-black uppercase italic tracking-tighter mb-4 flex items-center gap-2">
                  {selectedCategory} <div className="h-px flex-1 bg-slate-100" />
                </h5>
                
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p, idx) => (
                    <motion.div 
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-2xl p-3 flex gap-3 shadow-sm border border-slate-50 group active:scale-95 transition-all"
                    >
                      <div className="size-16 rounded-xl overflow-hidden shrink-0">
                        <img 
                          src={p.image_url || "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=400"} 
                          className="size-full object-cover transition-transform group-hover:scale-110" 
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-0.5">
                        <div className="space-y-0.5">
                          <h6 className="text-[10px] font-black uppercase leading-tight line-clamp-1">{p.name}</h6>
                          <p className="text-[8px] text-slate-400 line-clamp-1 font-medium">{p.description || 'Sem descrição.'}</p>
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-black text-indigo-600 italic">R$ {p.price.toFixed(2)}</span>
                           <div className="size-5 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">+</div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-20 text-center space-y-2 opacity-50">
                    <div className="size-10 bg-slate-100 rounded-full mx-auto flex items-center justify-center text-slate-200">
                      <Search size={20} />
                    </div>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Nenhum produto encontrado</p>
                  </div>
                )}
              </div>
            </div>

            {/* Floating Cart Button Simulation */}
            <div className="absolute bottom-4 left-4 right-4 h-12 bg-slate-900 rounded-2xl shadow-xl flex items-center justify-between px-6 z-50">
               <div className="flex items-center gap-3">
                  <div className="size-7 rounded-lg bg-white/10 flex items-center justify-center text-white"><ShoppingCart size={14} /></div>
                  <span className="text-[10px] font-black text-white italic">R$ 0,00</span>
               </div>
               <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Ver Sacola</span>
            </div>
            
            {/* Home Indicator */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-20 h-1 bg-slate-200 rounded-full z-50" />
          </div>

          {/* Botões Laterais (Visuais) */}
          <div className="absolute -left-2 top-24 w-1 h-8 bg-slate-800 rounded-l-md" />
          <div className="absolute -left-2 top-36 w-1 h-12 bg-slate-800 rounded-l-md" />
          <div className="absolute -right-2 top-32 w-1 h-16 bg-slate-800 rounded-r-md" />
        </div>
      </div>

      {/* Status de Conexão */}
      <div className="mt-4 flex items-center gap-2 px-4 py-1.5 bg-indigo-50 rounded-full border border-indigo-100 opacity-60">
        <div className="size-1.5 rounded-full bg-indigo-500 animate-pulse" />
        <span className="text-[8px] font-black text-indigo-600 uppercase italic tracking-widest">Sincronização Nativa Ativa</span>
      </div>
    </div>
  )
}
