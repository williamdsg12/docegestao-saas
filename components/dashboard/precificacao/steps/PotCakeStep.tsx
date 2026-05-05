"use client"

import { motion } from "framer-motion"
import { ShoppingBag, Zap, Flame, LayoutGrid, Info } from "lucide-react"
import { Ingredient, RecipeItem } from "@/hooks/useSmartPricing"

interface PotCakeStepProps {
  recipeInfo: {
    yieldPots: number
    gramsPerPot: number
  }
  overheads: {
    gas: number
    energy: number
    labor: number
  }
  onUpdateInfo: (info: any) => void
  onUpdateOverheads: (ov: any) => void
}

export function PotCakeStep({ recipeInfo, overheads, onUpdateInfo, onUpdateOverheads }: PotCakeStepProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-right-4 duration-500">
      {/* Yield Section */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-6">
           <div className="size-14 rounded-[24px] bg-[#FF2F81] text-white flex items-center justify-center shadow-lg shadow-pink-200">
              <ShoppingBag size={24} />
           </div>
           <div>
              <h3 className="font-black uppercase italic tracking-tight text-2xl text-slate-800">Rendimento do Pote</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Configure o volume de produção</p>
           </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-4 group hover:border-pink-100 transition-all">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Qtd de Potes (Rendimento)</label>
            <div className="flex items-end gap-3">
              <input 
                type="number"
                className="w-full h-16 bg-slate-50 border-none rounded-2xl text-center font-black italic text-4xl text-slate-900 focus:ring-4 focus:ring-[#FF2F81]/10"
                value={recipeInfo.yieldPots}
                onChange={e => onUpdateInfo({ ...recipeInfo, yieldPots: Number(e.target.value) })}
              />
              <span className="font-black uppercase italic text-slate-300 mb-4">UN</span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase text-center">Quantos potes essa receita rende?</p>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-4 group hover:border-pink-100 transition-all">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Gramas por Pote</label>
            <div className="flex items-end gap-3">
              <input 
                type="number"
                className="w-full h-16 bg-slate-50 border-none rounded-2xl text-center font-black italic text-4xl text-slate-900 focus:ring-4 focus:ring-[#FF2F81]/10"
                value={recipeInfo.gramsPerPot}
                onChange={e => onUpdateInfo({ ...recipeInfo, gramsPerPot: Number(e.target.value) })}
              />
              <span className="font-black uppercase italic text-slate-300 mb-4">G</span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase text-center">Tamanho padrão do seu pote.</p>
          </div>
        </div>

        <div className="bg-emerald-50 p-8 rounded-[40px] border border-emerald-100 flex items-start gap-6">
           <div className="size-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-100">
              <LayoutGrid size={20} />
           </div>
           <div>
              <p className="font-black uppercase italic tracking-tight text-emerald-800 text-lg">Sugestão Técnica</p>
              <p className="text-xs font-medium text-emerald-600/80 leading-relaxed mt-1">
                Para um bolo de pote de 220g equilibrado, use 100g de massa, 80g de recheio e 40g de cobertura/decoração.
              </p>
           </div>
        </div>
      </div>

      {/* Overhead Section */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-6">
           <div className="size-14 rounded-[24px] bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-200">
              <Zap size={24} />
           </div>
           <div>
              <h3 className="font-black uppercase italic tracking-tight text-2xl text-slate-800">Custos Invisíveis</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Energia, Gás e Mão de Obra</p>
           </div>
        </div>

        <div className="space-y-4">
           {[
             { id: 'gas', label: 'Custo de Gás por Fornada', icon: <Flame className="size-4" />, value: overheads.gas },
             { id: 'energy', label: 'Custo Energia / Refrigeração', icon: <Zap className="size-4" />, value: overheads.energy },
             { id: 'labor', label: 'Mão de Obra por Receita', icon: <Info className="size-4" />, value: overheads.labor },
           ].map(item => (
             <div key={item.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-pink-100 transition-all">
                <div className="flex items-center gap-4">
                   <div className="size-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-pink-50 group-hover:text-[#FF2F81] transition-colors">
                      {item.icon}
                   </div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.label}</label>
                </div>
                <div className="flex items-center gap-3">
                   <span className="font-black text-slate-300 italic">R$</span>
                   <input 
                     type="number"
                     step="0.01"
                     className="w-24 h-12 bg-slate-50 border-none rounded-xl text-right font-black italic text-lg text-slate-800 focus:ring-2 focus:ring-[#FF2F81]/20"
                     value={item.value || ""}
                     onChange={e => onUpdateOverheads({ ...overheads, [item.id]: Number(e.target.value) })}
                   />
                </div>
             </div>
           ))}
        </div>

        <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-4 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF2F81] to-transparent" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Custos Invisíveis</p>
           <p className="text-4xl font-black italic tracking-tighter">R$ {(overheads.gas + overheads.energy + overheads.labor).toFixed(2)}</p>
           <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Este valor será diluído entre os {recipeInfo.yieldPots} potes.</p>
        </div>
      </div>
    </div>
  )
}
