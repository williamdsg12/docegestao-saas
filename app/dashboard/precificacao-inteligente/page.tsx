"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Milk, 
  Scale, 
  ShoppingBag, 
  TrendingUp, 
  Save,
  Wand2,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useSmartPricing } from "@/hooks/useSmartPricing"

// Steps
import { IngredientStep } from "@/components/dashboard/precificacao/steps/IngredientStep"
import { RecipeStep } from "@/components/dashboard/precificacao/steps/RecipeStep"
import { PotCakeStep } from "@/components/dashboard/precificacao/steps/PotCakeStep"
import { FinalPricingStep } from "@/components/dashboard/precificacao/steps/FinalPricingStep"
import { AIChatAssistant } from "@/components/dashboard/precificacao/ai/AIChatAssistant"
import { AddIngredientModal } from "@/components/dashboard/precificacao/modals/AddIngredientModal"

export default function PrecificacaoInteligentePage() {
  const { 
    step, setStep, 
    ingredients, isLoadingIngredients, 
    selectedIngredients, setSelectedIngredients,
    recipeInfo, setRecipeInfo,
    overheads, setOverheads,
    totals,
    saveIngredient,
    saveRecipe,
    isSavingRecipe
  } = useSmartPricing()

  const [showAddIngredient, setShowAddIngredient] = useState(false)

  const steps = [
    { id: 1, name: "Ingredientes", icon: <Milk size={18} /> },
    { id: 2, name: "Receita", icon: <Scale size={18} /> },
    { id: 3, name: "Bolo de Pote", icon: <ShoppingBag size={18} /> },
    { id: 4, name: "Preço Final", icon: <TrendingUp size={18} /> },
  ]

  const progress = (step / steps.length) * 100

  const handleSave = async () => {
    try {
      await saveRecipe()
    } catch (err) {
      // toast is handled in hook
    }
  }

  return (
    <div className="min-h-screen bg-[#FDF8F9] pb-20 font-sans">
      {/* Header Premium */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="size-14 rounded-[24px] bg-slate-900 flex items-center justify-center shadow-2xl shrink-0">
               <Sparkles className="text-[#FF2F81] size-7" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                Precificação <span className="text-[#FF2F81]">Inteligente</span>
              </h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Descubra o preço certo para lucrar de verdade</p>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-10">
             {step > 1 && (
               <div className="relative group">
                  <input 
                    placeholder="Dê um nome para sua receita..."
                    className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-black uppercase italic tracking-tight text-slate-800 placeholder:text-slate-200 focus:ring-4 focus:ring-pink-50 transition-all"
                    value={recipeInfo.name}
                    onChange={e => setRecipeInfo({ ...recipeInfo, name: e.target.value })}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-pink-400 bg-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">Nome da Receita</div>
               </div>
             )}
          </div>

          <div className="hidden xl:flex items-center gap-3 mr-10">
             {steps.map((s, i) => (
               <div key={s.id} className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${step === s.id ? 'bg-[#FF2F81] text-white shadow-lg shadow-pink-100' : 'text-slate-400 font-bold'}`}>
                     {s.icon}
                     <span className="text-[9px] font-black uppercase tracking-widest">{s.name}</span>
                  </div>
                  {i < steps.length - 1 && <ChevronRight className="size-3 text-slate-200" />}
               </div>
             ))}
          </div>

          <Button 
            onClick={handleSave}
            disabled={isSavingRecipe || step === 1}
            className="h-14 px-8 rounded-2xl bg-slate-900 text-white font-black uppercase italic text-[10px] tracking-widest hover:bg-[#FF2F81] transition-all shadow-xl shadow-slate-200"
          >
             {isSavingRecipe ? "Salvando..." : <><Save className="mr-2 size-4" /> Salvar Projeto</>}
          </Button>
        </div>
        <Progress value={progress} className="h-1 bg-slate-100 rounded-none transition-all" />
      </div>

      {/* Content Area */}
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === 1 && (
              <IngredientStep 
                ingredients={ingredients} 
                isLoading={isLoadingIngredients} 
                onAddClick={() => setShowAddIngredient(true)} 
              />
            )}
            {step === 2 && (
              <RecipeStep 
                allIngredients={ingredients} 
                selectedItems={selectedIngredients} 
                onUpdateItems={setSelectedIngredients} 
              />
            )}
            {step === 3 && (
              <PotCakeStep 
                recipeInfo={recipeInfo} 
                overheads={overheads} 
                onUpdateInfo={setRecipeInfo} 
                onUpdateOverheads={setOverheads} 
              />
            )}
            {step === 4 && (
              <FinalPricingStep 
                overheads={overheads} 
                recipeInfo={recipeInfo} 
                totals={totals}
                onUpdateOverheads={setOverheads}
                onUpdateInfo={setRecipeInfo}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer Navigation */}
        <div className="fixed bottom-0 left-0 right-0 p-8 flex justify-center pointer-events-none z-50">
           <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[32px] border border-white/20 shadow-2xl flex items-center gap-4 pointer-events-auto">
              <Button 
                variant="ghost" 
                disabled={step === 1} 
                onClick={() => setStep(step - 1)}
                className="h-16 px-10 rounded-[24px] text-slate-400 font-black uppercase italic tracking-widest text-[11px]"
              >
                <ChevronLeft className="mr-2" /> Voltar
              </Button>

              {step < 4 ? (
                <Button 
                  onClick={() => setStep(step + 1)}
                  className="h-16 px-16 rounded-[24px] bg-slate-900 text-white font-black uppercase italic tracking-widest text-[11px] hover:bg-[#FF2F81] transition-all"
                >
                  Continuar <ChevronRight className="ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSave}
                  disabled={isSavingRecipe}
                  className="h-16 px-16 rounded-[24px] bg-[#FF2F81] text-white font-black uppercase italic tracking-widest text-[11px] hover:bg-[#e02970] transition-all shadow-xl shadow-pink-200"
                >
                  {isSavingRecipe ? "Salvando..." : "Finalizar Precificação"}
                </Button>
              )}
           </div>
        </div>
      </div>

      {/* AI Assistant */}
      <AIChatAssistant onProcess={(data) => {
        setRecipeInfo(prev => ({ ...prev, ...data }))
        setStep(2) // Jump to recipe
      }} />

      {/* Modals */}
      <AddIngredientModal 
        isOpen={showAddIngredient} 
        onClose={() => setShowAddIngredient(false)} 
        onSave={saveIngredient} 
      />

    </div>
  )
}
