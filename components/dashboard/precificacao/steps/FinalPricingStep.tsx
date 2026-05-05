"use client"

import { motion } from "framer-motion"
import { TrendingUp, Package, Tag, DollarSign, ArrowRight, Share2, Download, MessageCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FinalPricingStepProps {
  overheads: {
    packaging: number
    label: number
    spoon: number
  }
  recipeInfo: {
    markup: number
    yieldPots: number
  }
  totals: {
    costPerPot: number
    suggestedPrice: number
    profitPerUnit: number
    totalProfit: number
  }
  onUpdateOverheads: (ov: any) => void
  onUpdateInfo: (info: any) => void
}

export function FinalPricingStep({ overheads, recipeInfo, totals, onUpdateOverheads, onUpdateInfo }: FinalPricingStepProps) {
  
  const isProfitLow = (totals.profitPerUnit / totals.suggestedPrice) < 0.3
  const isPriceHigh = totals.suggestedPrice > 18.00 // Average market cap for pot cake in BR

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in zoom-in-95 duration-500">
      {/* Configuration Column */}
      <div className="lg:col-span-5 space-y-10">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
             <div className="size-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                <Package size={20} />
             </div>
             <div>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-tight">Preço Ideal de <span className="text-[#FF2F81]">Venda</span></h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 italic">Margem aplicada e custos de produção inclusos</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { id: 'packaging', label: 'Pote / Embalagem', icon: <Package className="size-4" />, value: overheads.packaging },
              { id: 'label', label: 'Etiqueta / Lacre', icon: <Label className="size-4" />, value: overheads.label },
              { id: 'spoon', label: 'Colher / Guardanapo', icon: <ArrowRight className="size-4" />, value: overheads.spoon },
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
                    className="w-20 h-12 bg-slate-50 border-none rounded-xl text-right font-black italic text-lg text-slate-800 focus:ring-2 focus:ring-[#FF2F81]/20"
                    value={item.value || ""}
                    onChange={e => onUpdateOverheads({ ...overheads, [item.id]: Number(e.target.value) })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-[#FF2F81] text-white flex items-center justify-center shadow-lg shadow-pink-200">
                   <TrendingUp size={20} />
                </div>
                <div>
                   <h3 className="font-black uppercase italic tracking-tight text-xl text-slate-800">Margem de Lucro</h3>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ajuste seu markup desejado</p>
                </div>
             </div>
             <div className="text-right">
                <span className="text-3xl font-black italic text-[#FF2F81] tracking-tighter">{recipeInfo.markup}%</span>
             </div>
          </div>

          <div className="px-4 py-8 bg-white rounded-[40px] border border-slate-100 shadow-sm">
            <Slider 
              value={[recipeInfo.markup]} 
              min={20} 
              max={300} 
              step={5} 
              onValueChange={([val]) => onUpdateInfo({ ...recipeInfo, markup: val })}
              className="py-4"
            />
            <div className="flex justify-between mt-4 text-[9px] font-black uppercase tracking-widest text-slate-300">
               <span>Iniciante (20%)</span>
               <span>Ideal (100%)</span>
               <span>Premium (300%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Impact Card Column */}
      <div className="lg:col-span-7">
        <div className="bg-white rounded-[50px] border-4 border-slate-900 overflow-hidden shadow-2xl h-full flex flex-col">
          <div className="p-10 bg-slate-900 text-white relative">
             <div className="absolute top-0 right-0 size-64 bg-[#FF2F81] rounded-full blur-[100px] opacity-30" />
             <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-center">
                   <span className="bg-[#FF2F81] text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">Resultado Final</span>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{recipeInfo.yieldPots} Potes de {recipeInfo.gramsPerPot}g</span>
                </div>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-tight pb-1">Preço Ideal de <span className="text-[#FF2F81]">Venda</span></h2>
             </div>
          </div>

          <div className="flex-1 p-10 space-y-12">
             <div className="grid grid-cols-2 gap-10">
                <div className="space-y-1">
                   <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 leading-tight">Custo Total / Pote</p>
                   <p className="text-4xl font-black italic text-slate-900 tracking-tighter leading-tight py-1">R$ {(totals.costPerPot || 0).toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[11px] font-black uppercase tracking-widest text-[#FF2F81] italic leading-tight">Venda Sugerida</p>
                   <p className="text-5xl font-black italic text-slate-900 tracking-tighter shadow-pink-500/10 leading-tight py-1">R$ {(totals.suggestedPrice || 0).toFixed(2)}</p>
                </div>
             </div>

             <div className="bg-slate-50 rounded-[40px] p-10 grid grid-cols-2 gap-10 border border-slate-100">
                <div className="space-y-1 border-r border-slate-200">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lucro / Unidade</p>
                   <p className="text-3xl font-black italic text-emerald-500 tracking-tighter">+ R$ {(totals.profitPerUnit || 0).toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lucro no Lote ({recipeInfo.yieldPots} un)</p>
                   <p className="text-3xl font-black italic text-emerald-600 tracking-tighter">R$ {(totals.totalProfit || 0).toFixed(2)}</p>
                </div>
             </div>

             {/* Smart Alerts */}
             <div className="space-y-4">
                {isProfitLow && (
                  <div className="flex items-center gap-4 p-5 bg-amber-50 border border-amber-100 rounded-3xl text-amber-800">
                     <AlertTriangle className="size-6 shrink-0" />
                     <p className="text-[10px] font-black uppercase tracking-widest leading-snug">Seu lucro está muito baixo para o esforço manual. Considere aumentar o markup.</p>
                  </div>
                )}
                {isPriceHigh && (
                  <div className="flex items-center gap-4 p-5 bg-pink-50 border border-pink-100 rounded-3xl text-[#FF2F81]">
                     <AlertTriangle className="size-6 shrink-0" />
                     <p className="text-[10px] font-black uppercase tracking-widest leading-snug">Valor acima da média regional (R$ 18,00). Foco em diferenciação ou reduza custos.</p>
                  </div>
                )}
             </div>

             {/* Actions */}
             <div className="grid grid-cols-3 gap-4 pt-4">
                <Button variant="outline" className="h-16 rounded-2xl border-slate-100 font-black uppercase text-[9px] tracking-widest gap-2">
                   <Download size={14} /> PDF
                </Button>
                <Button variant="outline" className="h-16 rounded-2xl border-slate-100 font-black uppercase text-[9px] tracking-widest gap-2">
                   <Share2 size={14} /> Link
                </Button>
                <Button className="h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[9px] tracking-widest gap-2">
                   <MessageCircle size={14} /> WhatsApp
                </Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
