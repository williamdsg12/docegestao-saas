"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { 
  Plus, 
  TrendingUp, 
  FileText,
  Milk,
  Zap,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IngredientManager } from "@/components/pricing/IngredientManager"
import { RecipeManager } from "@/components/pricing/RecipeManager"
import { FinancialSettings } from "@/components/pricing/FinancialSettings"
import { PricingWizard } from "@/components/pricing/PricingWizard"
import { FeatureGuard } from "@/components/dashboard/FeatureGuard"

function PrecificacaoContent() {
  const searchParams = useSearchParams()
  const wizardParam = searchParams.get("wizard")
  const [isWizardOpen, setIsWizardOpen] = useState(false)

  useEffect(() => {
    if (wizardParam === "true") {
      setIsWizardOpen(true)
    }
  }, [wizardParam])

  return (
    <FeatureGuard feature="precificacao" planRequired="pro">
      <div className="container mx-auto py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
              Precificação <span className="text-blue-600">Master</span>
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2 italic">
              Dashboard de engenharia financeira e lucro real
            </p>
          </motion.div>

          <Button 
            onClick={() => setIsWizardOpen(true)}
            className="rounded-2xl h-14 px-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black uppercase italic tracking-widest text-[10px] shadow-xl shadow-purple-500/20 group animate-in slide-in-from-right duration-500"
          >
            <Zap className="mr-2 group-hover:animate-pulse" size={18} /> Iniciar Mago de Precificação
          </Button>
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
              <TabsTrigger 
                value="financeiro" 
                className="rounded-[14px] px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-premium transition-all font-black uppercase italic text-[10px] tracking-widest gap-2"
              >
                <TrendingUp size={14} /> Custos Operacionais
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="financeiro">
            <FinancialSettings />
          </TabsContent>

          <TabsContent value="fichas">
            <RecipeManager />
          </TabsContent>

          <TabsContent value="insumos">
            <IngredientManager />
          </TabsContent>
        </Tabs>
      </div>

      <PricingWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
    </FeatureGuard>
  )
}

export default function PrecificacaoInteligentePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
           <div className="size-12 bg-slate-200 rounded-2xl" />
           <div className="h-4 w-32 bg-slate-200 rounded-full" />
        </div>
      </div>
    }>
      <PrecificacaoContent />
    </Suspense>
  )
}
