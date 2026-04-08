"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { IngredientManager } from "@/components/pricing/IngredientManager"
import { RecipeManager } from "@/components/pricing/RecipeManager"
import { motion } from "framer-motion"
import { Calculator, ShoppingBag, Package, TrendingUp, DollarSign } from "lucide-react"

export default function PricingPage() {
  const [vendasEstimadas, setVendasEstimadas] = useState(100)

  return (
    <div className="container mx-auto py-8 space-y-8 min-h-screen">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-stretch gap-6 bg-slate-900 p-8 md:p-12 rounded-[40px] shadow-2xl relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-12 text-white/5 group-hover:scale-110 transition-transform duration-700">
           <Calculator size={200} />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center">
          <Badge className="w-fit mb-4 bg-indigo-500 text-white border-none font-black text-[10px] uppercase tracking-tighter italic">iFood PRO Style</Badge>
          <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none mb-4">
            Gestão de <br className="hidden md:block" /> Lucratividade
          </h1>
          <div className="flex gap-4">
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Status Geral</span>
                <span className="text-emerald-500 font-black italic uppercase text-sm flex items-center gap-1">🟢 Operação Saudável</span>
             </div>
             <div className="w-px h-10 bg-slate-800" />
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Dica do Dia</span>
                <span className="text-white font-black italic uppercase text-xs">Otimize insumos para margem +15%</span>
             </div>
          </div>
        </div>

        <div className="relative z-10 w-full md:w-[350px]">
           <Card className="bg-white/5 backdrop-blur-2xl border-white/10 text-white rounded-[32px] p-8 shadow-2xl border-t border-l border-white/20">
              <div className="flex items-center gap-3 mb-6">
                 <div className="size-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/40">
                    <TrendingUp size={24} />
                 </div>
                 <div>
                    <h3 className="font-black uppercase italic tracking-tighter text-lg leading-none">Simulador PRO</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Projeção de resultados</p>
                 </div>
              </div>
              
              <div className="space-y-6">
                 <div className="space-y-3">
                    <div className="flex justify-between items-center">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meta de Vendas / Mês</Label>
                       <span className="text-xs font-black italic text-indigo-400">{vendasEstimadas} un</span>
                    </div>
                    <Input 
                      type="range" 
                      min="1" 
                      max="1000"
                      step="10"
                      value={vendasEstimadas} 
                      onChange={(e) => setVendasEstimadas(parseInt(e.target.value) || 0)}
                      className="accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div>
                       <p className="text-[8px] font-black uppercase text-slate-500">Volume Total</p>
                       <p className="text-xl font-black italic text-white">{vendasEstimadas} <span className="text-[10px]">itens</span></p>
                    </div>
                    <div>
                       <p className="text-[8px] font-black uppercase text-slate-500">Período</p>
                       <p className="text-xl font-black italic text-white">30 <span className="text-[10px]">dias</span></p>
                    </div>
                 </div>
              </div>
           </Card>
        </div>
      </motion.div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="receitas" className="space-y-8">
        <TabsList className="bg-[var(--bg-card)] p-1.5 rounded-[24px] h-16 border border-[var(--border)] shadow-sm">
          <TabsTrigger 
            value="receitas" 
            className="rounded-[20px] px-8 h-full data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white font-black uppercase italic tracking-widest text-xs transition-all"
          >
            <Package className="mr-2 size-4" /> Fichas Técnicas
          </TabsTrigger>
          <TabsTrigger 
            value="ingredientes" 
            className="rounded-[20px] px-8 h-full data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white font-black uppercase italic tracking-widest text-xs transition-all"
          >
            <ShoppingBag className="mr-2 size-4" /> Insumos / Ingredientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ingredientes" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <IngredientManager />
        </TabsContent>

        <TabsContent value="receitas" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <RecipeManager vendasEstimadas={vendasEstimadas} />
        </TabsContent>
      </Tabs>

      {/* Footer Info / Tip */}
      <Card className="border-none bg-indigo-600/5 rounded-3xl p-6 border border-indigo-500/10 mt-10">
         <div className="flex gap-4 items-center">
            <div className="size-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
               <Calculator size={24} />
            </div>
            <div>
               <h4 className="text-sm font-black uppercase italic text-indigo-900 dark:text-indigo-100">Dica de Lucratividade</h4>
               <p className="text-[10px] font-bold text-indigo-700/70 dark:text-indigo-300/70 uppercase">
                  Mantenha seus custos de ingredientes (Food Cost) entre 25% a 35% do preço final para garantir uma operação saudável.
               </p>
            </div>
         </div>
      </Card>
    </div>
  )
}
