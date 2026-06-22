"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Search, Milk, MoreVertical, Trash2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Ingredient } from "@/hooks/useSmartPricing"

interface IngredientStepProps {
  ingredients: Ingredient[]
  isLoading: boolean
  onAddClick: () => void
}

export function IngredientStep({ ingredients, isLoading, onAddClick }: IngredientStepProps) {
  const [search, setSearch] = useState("")

  const filtered = ingredients.filter(i => 
    i.nome.toLowerCase().includes(search.toLowerCase()) ||
    i.categoria.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
          <Input 
            placeholder="Buscar ingredientes..." 
            className="h-12 pl-12 rounded-2xl border-none bg-slate-100/50 focus-visible:ring-[#FF2F81]/20 font-medium"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button 
          onClick={onAddClick}
          className="w-full md:w-auto h-12 px-8 rounded-2xl bg-[#FF2F81] hover:bg-[#e02970] text-white font-black uppercase italic tracking-widest text-[10px] shadow-xl shadow-pink-500/20 gap-2"
        >
          <Plus size={16} /> Novo Ingrediente
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 rounded-3xl bg-slate-50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((ing) => (
              <motion.div
                key={ing.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-pink-100 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="size-12 rounded-2xl bg-pink-50 flex items-center justify-center text-[#FF2F81] group-hover:bg-[#FF2F81] group-hover:text-white transition-colors">
                    <Milk size={20} />
                  </div>
                  <Badge variant="secondary" className="bg-slate-50 text-slate-500 font-black uppercase text-[8px] tracking-widest px-3 py-1 rounded-full">
                    {ing.categoria}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <h3 className="font-black uppercase italic tracking-tight text-slate-800 text-lg leading-tight group-hover:text-[#FF2F81] transition-colors line-clamp-1">{ing.nome}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ing.marca || "Marca não inf."}</p>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-end">
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-tight mb-1">Custo Base</p>
                    <p className="text-xl font-black italic text-slate-900 tracking-tighter">R$ {(ing.custo_unitario || 0).toFixed(3)}<span className="text-[10px] ml-1 opacity-40">/ {ing.unidade_compra === 'kg' ? 'g' : ing.unidade_compra === 'L' ? 'ml' : 'un'}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-tight mb-1">Emb. {ing.quantidade_embalagem || 0}{ing.unidade_compra}</p>
                    <p className="text-sm font-bold text-slate-600">R$ {(ing.valor_pago || 0).toFixed(2)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
               <div className="size-20 rounded-[30px] bg-slate-50 flex items-center justify-center text-slate-200">
                  <Milk size={40} />
               </div>
               <div className="space-y-1">
                  <p className="font-black uppercase italic tracking-widest text-slate-300">Nenhum ingrediente encontrado</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Comece cadastrando seus insumos base.</p>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
