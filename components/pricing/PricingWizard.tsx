"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Calculator, 
  Milk, 
  TrendingUp, 
  Save,
  Clock,
  Package,
  X,
  PlusCircle,
  HelpCircle,
  DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const steps = [
  { id: 1, title: "Base", desc: "Nome e Insumos", icon: Milk },
  { id: 2, title: "Produção", desc: "Rendimento e Tempo", icon: Clock },
  { id: 3, title: "Margem", desc: "Lucro e Canais", icon: TrendingUp },
]

export function PricingWizard({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [availableIngredients, setAvailableIngredients] = useState<any[]>([])
  const [financialSettings, setFinancialSettings] = useState<any>(null)

  // Form State
  const [formData, setFormData] = useState({
    nome: "",
    rendimento: 1,
    embalagem: 0,
    tempo_preparo_min: 30,
    margem: 0.5,
    ingredientes: [] as any[]
  })

  // Selected Ingredient for adding
  const [selectedIngId, setSelectedIngId] = useState("")
  const [selectedIngQty, setSelectedIngQty] = useState("")

  useEffect(() => {
    if (user && isOpen) {
      fetchIngredients()
      fetchFinancialSettings()
    }
  }, [user, isOpen])

  async function fetchIngredients() {
    const { data, error } = await supabase.from("ingredientes").select("*").order("nome")
    if (error) console.error("Erro ao buscar ingredientes no Wizard:", error)
    console.log("Ingredientes carregados no Wizard:", data?.length)
    setAvailableIngredients(data || [])
  }

  async function fetchFinancialSettings() {
    const { data } = await supabase.from("financial_settings").select("*").eq("user_id", user?.id).maybeSingle()
    if (data) setFinancialSettings(data)
  }

  function addIngredient() {
    if (!selectedIngId || !selectedIngQty) return
    const ing = availableIngredients.find(i => i.id === selectedIngId)
    if (!ing) return

    setFormData(prev => ({
      ...prev,
      ingredientes: [...prev.ingredientes, { 
        id: ing.id, 
        nome: ing.nome, 
        quantidade: parseFloat(selectedIngQty), 
        unidade: ing.unidade,
        custo_unitario: ing.custo_unitario 
      }]
    }))
    setSelectedIngId("")
    setSelectedIngQty("")
  }

  // Calculations
  const stats = useMemo(() => {
    const custoIngredientes = formData.ingredientes.reduce((acc, curr) => acc + (curr.quantidade * curr.custo_unitario), 0)
    const rendimento = formData.rendimento || 1
    const custoPorUnidade = custoIngredientes / rendimento
    
    const totalHours = (financialSettings?.dias_trabalhados_semana * 4) * financialSettings?.horas_trabalhadas_dia
    const hourlyRate = totalHours > 0 ? (Number(financialSettings?.salario_alvo) + Number(financialSettings?.custo_fixo_total)) / totalHours : 0
    const maoObra = ((formData.tempo_preparo_min || 0) / 60) * hourlyRate / rendimento
    
    const custoFinal = custoPorUnidade + maoObra + (Number(formData.embalagem) || 0)
    const precoDireto = custoFinal / (1 - formData.margem)
    const precoIfood = precoDireto / (1 - (financialSettings?.taxa_ifood || 0.27))
    const precoRevenda = precoDireto / (1 - (financialSettings?.taxa_revenda || 0.20))

    return { custoFinal, precoDireto, precoIfood, precoRevenda, lucro: precoDireto - custoFinal }
  }, [formData, financialSettings])

  async function handleSave() {
    if (!formData.nome) return toast.error("Dê um nome ao produto")
    try {
      setLoading(true)
      const { data: recipeData, error: recipeError } = await supabase
        .from("receitas")
        .insert([{
          user_id: user?.id,
          nome: formData.nome,
          rendimento: formData.rendimento,
          embalagem: formData.embalagem,
          margem: formData.margem,
          tempo_preparo_min: formData.tempo_preparo_min
        }])
        .select().single()

      if (recipeError) throw recipeError

      const ingPayload = formData.ingredientes.map(i => ({
        receita_id: recipeData.id,
        ingrediente_id: i.id,
        quantidade: i.quantidade
      }))

      const { error: ingError } = await supabase.from("receita_ingredientes").insert(ingPayload)
      if (ingError) throw ingError

      toast.success("Produto precificado e salvo com sucesso!")
      onClose()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]"
      >
        {/* Header with Steps */}
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Mago de Precificação</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1 italic">Transforme receitas em lucro real em 3 passos</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white text-slate-400">
              <X size={24} />
            </Button>
          </div>

          <div className="flex justify-between items-center px-10 relative">
            <div className="absolute top-1/2 left-20 right-20 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
            {steps.map((step) => (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                <div className={cn(
                  "size-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                  currentStep >= step.id ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20" : "bg-white text-slate-300 border border-slate-200"
                )}>
                  {currentStep > step.id ? <Check size={20} /> : <step.icon size={20} />}
                </div>
                <div className="text-center">
                   <p className={cn("text-[9px] font-black uppercase tracking-widest", currentStep >= step.id ? "text-blue-600" : "text-slate-300")}>{step.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-10">
          <AnimatePresence mode="wait">
             {currentStep === 1 && (
               <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome do Produto</Label>
                    <Input 
                      value={formData.nome}
                      onChange={e => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Brownie de Nutella"
                      className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-extrabold italic text-lg"
                    />
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center gap-2 mb-4">
                       <PlusCircle className="text-blue-500" size={18} />
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 italic">Adicionar Ingredientes</h4>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="md:col-span-7">
                           <Select value={selectedIngId} onValueChange={setSelectedIngId}>
                              <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 italic font-bold">
                                 <SelectValue placeholder="Escolher ingrediente..." />
                              </SelectTrigger>
                              <SelectContent className="z-[100]">
                                 {availableIngredients.length === 0 ? (
                                   <div className="p-4 text-center text-[10px] font-black uppercase text-slate-400 italic">
                                      Nenhum ingrediente encontrado...
                                   </div>
                                 ) : (
                                   availableIngredients.map(i => (
                                     <SelectItem key={i.id} value={i.id} className="font-bold italic uppercase text-[10px]">
                                       {i.nome} ({i.unidade})
                                     </SelectItem>
                                   ))
                                 )}
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="md:col-span-3">
                           <Input 
                             type="number"
                             placeholder="Qtd."
                             value={selectedIngQty}
                             onChange={e => setSelectedIngQty(e.target.value)}
                             className="h-12 rounded-xl text-center bg-white border-slate-200 font-black italic"
                           />
                        </div>
                        <Button 
                          onClick={addIngredient}
                          disabled={!selectedIngId || !selectedIngQty}
                          className={cn(
                            "md:col-span-2 h-12 rounded-xl font-black italic uppercase tracking-widest text-[10px] transition-all duration-300",
                            selectedIngId && selectedIngQty 
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/40 scale-105" 
                              : "bg-slate-100 text-slate-400"
                          )}
                        >
                          Adicionar
                        </Button>
                     </div>

                     <div className="space-y-2 mt-4 max-h-[200px] overflow-y-auto">
                        {formData.ingredientes.map((ing, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                             <span className="font-bold text-[11px] uppercase italic text-slate-700">{ing.nome}</span>
                             <span className="text-[10px] font-black text-blue-500">{ing.quantidade} {ing.unidade}</span>
                          </div>
                        ))}
                     </div>
                  </div>
               </motion.div>
             )}

             {currentStep === 2 && (
               <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Rendimento da Receita (un)</Label>
                        <Input 
                          type="number"
                          value={formData.rendimento}
                          onChange={e => setFormData({ ...formData, rendimento: parseFloat(e.target.value) || 1 })}
                          className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-extrabold italic text-center text-xl"
                        />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Tempo de Preparo (minutos)</Label>
                        <Input 
                          type="number"
                          value={formData.tempo_preparo_min}
                          onChange={e => setFormData({ ...formData, tempo_preparo_min: parseFloat(e.target.value) || 0 })}
                          className="h-14 rounded-2xl bg-blue-50 border-blue-100 font-extrabold italic text-center text-xl text-blue-600"
                        />
                     </div>
                  </div>

                  <div className="p-8 bg-slate-900 rounded-[32px] text-white flex items-center justify-between">
                     <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Custo Estimado de Mão de Obra</p>
                        <h3 className="text-3xl font-black italic tracking-tighter text-emerald-400">R$ {(((formData.tempo_preparo_min / 60) * ((financialSettings?.salario_alvo + financialSettings?.custo_fixo_total) / ((financialSettings?.dias_trabalhados_semana * 4) * financialSettings?.horas_trabalhadas_dia)))).toFixed(2)}</h3>
                     </div>
                     <Clock className="text-slate-700" size={48} />
                  </div>
               </motion.div>
             )}

             {currentStep === 3 && (
               <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="space-y-4">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Margem de Lucro Desejada ({formData.margem * 100}%)</Label>
                     <div className="flex gap-4">
                        {[0.3, 0.4, 0.5, 0.6, 0.7].map(m => (
                          <Button 
                            key={m}
                            variant={formData.margem === m ? "default" : "outline"}
                            onClick={() => setFormData({ ...formData, margem: m })}
                            className="flex-1 rounded-xl h-12 font-black italic"
                          >
                            {m * 100}%
                          </Button>
                        ))}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <Card className="rounded-3xl border-slate-100 bg-emerald-50/30 p-6 flex flex-col items-center text-center">
                        <p className="text-[9px] font-black uppercase text-emerald-600 mb-2">Venda Direta</p>
                        <h4 className="text-2xl font-black italic tracking-tighter text-slate-900">R$ {stats.precoDireto.toFixed(2)}</h4>
                     </Card>
                     <Card className="rounded-3xl border-blue-100 bg-blue-50/30 p-6 flex flex-col items-center text-center">
                        <p className="text-[9px] font-black uppercase text-blue-600 mb-2">Preço iFood</p>
                        <h4 className="text-2xl font-black italic tracking-tighter text-slate-900">R$ {stats.precoIfood.toFixed(2)}</h4>
                     </Card>
                     <Card className="rounded-3xl border-amber-100 bg-amber-50/30 p-6 flex flex-col items-center text-center">
                        <p className="text-[9px] font-black uppercase text-amber-600 mb-2">Preço Revenda</p>
                        <h4 className="text-2xl font-black italic tracking-tighter text-slate-900">R$ {stats.precoRevenda.toFixed(2)}</h4>
                     </Card>
                  </div>
               </motion.div>
             )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="p-8 border-t border-slate-100 flex justify-between bg-white">
          <Button 
            variant="ghost" 
            onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1}
            className="rounded-2xl h-12 px-6 font-black uppercase italic tracking-widest text-[10px]"
          >
            <ChevronLeft className="mr-2" size={16} /> Voltar
          </Button>

          {currentStep < 3 ? (
            <Button 
              onClick={() => setCurrentStep(currentStep + 1)}
              className="rounded-2xl h-12 px-10 bg-blue-600 text-white font-black uppercase italic tracking-widest text-[10px] shadow-lg shadow-blue-500/20"
            >
              Próximo Passo <ChevronRight className="ml-2" size={16} />
            </Button>
          ) : (
            <Button 
              onClick={handleSave}
              disabled={loading}
              className="rounded-2xl h-12 px-12 bg-emerald-600 text-white font-black uppercase italic tracking-widest text-[10px] shadow-lg shadow-emerald-500/20"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save className="mr-2" size={16} />}
              Finalizar e Salvar
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
