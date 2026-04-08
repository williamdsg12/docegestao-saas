"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Calculator, 
  Plus, 
  Search, 
  TrendingUp, 
  Package, 
  Trash2, 
  ChevronRight,
  PlusCircle,
  FileText,
  Milk
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IngredientManager } from "@/components/pricing/IngredientManager"
import { RecipeManager } from "@/components/pricing/RecipeManager"
import { FeatureGuard } from "@/components/dashboard/FeatureGuard"

export default function PrecificacaoInteligentePage() {
  return (
    <FeatureGuard feature="precificacao" planRequired="pro">
      <div className="container mx-auto py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
              Precificação <span className="text-blue-600">Inteligente</span>
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2 italic">
              Transforme custos em lucro com análise em tempo real
            </p>
          </motion.div>
        </div>

        <Tabs defaultValue="fichas" className="space-y-8">
          <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm p-1.5 rounded-[20px] border border-slate-100 w-fit mx-auto md:mx-0">
            <TabsList className="bg-transparent border-none gap-2 h-auto p-0">
              <TabsTrigger 
                value="fichas" 
                className="rounded-[14px] px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-premium transition-all font-black uppercase italic text-[10px] tracking-widest gap-2"
              >
                <FileText size={14} /> Fichas Técnicas
              </TabsTrigger>
              <TabsTrigger 
                value="insumos" 
                className="rounded-[14px] px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-premium transition-all font-black uppercase italic text-[10px] tracking-widest gap-2"
              >
                <Milk size={14} /> Cadastro de Insumos
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="fichas">
            <RecipeManager />
          </TabsContent>

          <TabsContent value="insumos">
            <IngredientManager />
          </TabsContent>
        </Tabs>
      </div>
    </FeatureGuard>
  )
}
