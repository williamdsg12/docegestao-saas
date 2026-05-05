"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, Trash2, Scale, Calculator, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Ingredient, RecipeItem } from "@/hooks/useSmartPricing"
import { cn } from "@/lib/utils"

interface RecipeStepProps {
  allIngredients: Ingredient[]
  selectedItems: RecipeItem[]
  onUpdateItems: (items: RecipeItem[]) => void
}

export function RecipeStep({ allIngredients, selectedItems, onUpdateItems }: RecipeStepProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const filteredIngredients = allIngredients.filter(i => 
    i.nome.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5)

  const addItem = (ing: Ingredient) => {
    if (selectedItems.find(item => item.ingredientId === ing.id)) return
    onUpdateItems([...selectedItems, {
      ingredientId: ing.id,
      name: ing.nome,
      quantity: 0,
      unit: ing.unidade_compra === 'kg' ? 'g' : ing.unidade_compra === 'L' ? 'ml' : 'un',
      cost: ing.custo_unitario
    }])
    setSearchTerm("")
    setIsSearchOpen(false)
  }

  const removeItem = (id: string) => {
    onUpdateItems(selectedItems.filter(i => i.ingredientId !== id))
  }

  const updateQty = (id: string, qty: number) => {
    onUpdateItems(selectedItems.map(i => i.ingredientId === id ? { ...i, quantity: qty } : i))
  }

  const totalCost = selectedItems.reduce((acc, i) => acc + (i.cost * i.quantity), 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-bottom-4 duration-500">
      {/* Left Column: List Builder */}
      <div className="lg:col-span-8 space-y-8">
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Adicionar Ingrediente à Receita</label>
          <div className="relative">
            <div className={cn(
              "flex items-center gap-4 bg-white border-2 rounded-[28px] px-8 h-20 transition-all shadow-sm",
              isSearchOpen ? "border-[#FF2F81] ring-8 ring-pink-50" : "border-slate-100"
            )}>
              <Search className={cn("size-6 transition-colors", isSearchOpen ? "text-[#FF2F81]" : "text-slate-300")} />
              <input 
                placeholder="Ex: Leite Condensado, Chocolate..."
                className="flex-1 bg-transparent border-none outline-none font-black uppercase italic tracking-tighter text-xl text-slate-800 placeholder:text-slate-200"
                value={searchTerm}
                onFocus={() => setIsSearchOpen(true)}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <AnimatePresence>
              {isSearchOpen && searchTerm.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[32px] border border-slate-100 shadow-2xl z-50 overflow-hidden"
                >
                  {filteredIngredients.length > 0 ? (
                    filteredIngredients.map(ing => (
                      <button 
                        key={ing.id}
                        onClick={() => addItem(ing)}
                        className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none"
                      >
                        <div className="flex items-center gap-4">
                           <div className="size-10 rounded-xl bg-pink-50 flex items-center justify-center text-[#FF2F81] font-black uppercase text-[10px] italic">
                              {ing.nome.charAt(0)}
                           </div>
                           <div className="text-left">
                              <p className="font-black uppercase italic tracking-tight text-slate-800">{ing.nome}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{ing.categoria}</p>
                           </div>
                        </div>
                        <Plus className="size-5 text-slate-300" />
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhum ingrediente encontrado</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {selectedItems.map((item, idx) => (
              <motion.div 
                key={item.ingredientId}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-6 p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm group hover:border-pink-100 transition-all"
              >
                <div className="size-14 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-slate-400 font-black uppercase text-[8px] italic tracking-tighter leading-tight shrink-0 group-hover:bg-[#FF2F81] group-hover:text-white transition-colors py-1">
                  <span className="text-lg mb-0.5">#{idx + 1}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-black uppercase italic tracking-tight text-slate-800 truncate">{item.name}</p>
                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">R$ {(item.cost || 0).toFixed(3)} / {item.unit}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex flex-col items-center">
                    <input 
                      type="number"
                      className="w-24 h-12 bg-slate-50 border-none rounded-xl text-center font-black italic text-lg text-slate-800 focus:ring-2 focus:ring-[#FF2F81]/20"
                      value={item.quantity || ""}
                      onChange={e => updateQty(item.ingredientId, Number(e.target.value))}
                      placeholder="Qtd"
                    />
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">{item.unit}</span>
                  </div>
                  
                  <div className="w-24 text-right">
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Custo Item</p>
                    <p className="font-black italic text-slate-800">R$ {((item.cost || 0) * (item.quantity || 0)).toFixed(2)}</p>
                  </div>

                  <button onClick={() => removeItem(item.ingredientId)} className="p-3 text-slate-200 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {selectedItems.length === 0 && (
            <div className="py-20 border-2 border-dashed border-slate-100 rounded-[40px] flex flex-col items-center justify-center text-center space-y-4 opacity-50">
               <Scale className="size-12 text-slate-200" />
               <p className="font-black uppercase italic tracking-widest text-slate-300">A lista está vazia</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Real-time Summary */}
      <div className="lg:col-span-4">
        <div className="sticky top-8 bg-slate-900 rounded-[40px] p-10 text-white space-y-8 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 size-60 bg-[#FF2F81] rounded-full blur-[100px] opacity-20 pointer-events-none" />
          
          <div className="relative space-y-6">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Calculator className="text-[#FF2F81] size-6" />
              </div>
              <div>
                <h3 className="font-black uppercase italic tracking-tight text-xl">Custo Parcial</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total da Receita Base</p>
              </div>
            </div>

            <div className="py-8 border-y border-white/5 space-y-6">
               <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Itens Adicionados</span>
                  <span className="font-black italic">{selectedItems.length}</span>
               </div>
               <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Peso Estimado</span>
                  <span className="font-black italic">{selectedItems.reduce((acc, i) => acc + (i.unit === 'un' ? 0 : i.quantity), 0)}g</span>
               </div>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#FF2F81] italic">Total Ingredientes</p>
              <p className="text-6xl font-black italic tracking-tighter leading-tight py-2">R$ {totalCost.toFixed(2)}</p>
            </div>

            <div className="bg-white/5 p-6 rounded-3xl flex items-start gap-3">
               <Info className="size-4 text-pink-400 shrink-0 mt-0.5" />
               <p className="text-[10px] font-bold text-slate-300 leading-relaxed uppercase tracking-wider">
                  Este valor considera apenas os insumos. Na próxima etapa, vamos incluir custos fixos e embalagens.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
