"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Plus, 
  Trash2, 
  Loader2, 
  ChevronRight, 
  ChevronDown, 
  TrendingUp, 
  DollarSign, 
  Calculator,
  Save,
  X,
  PlusCircle,
  BarChart3,
  Edit
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface Ingredient {
  id: string
  nome: string
  custo_unitario: number
  unidade: string
}

interface RecipeIngredient {
  ingrediente_id: string
  quantidade: number
  // Fields for UI only
  nome?: string
  custo_unitario?: number
  unidade?: string
}

interface Recipe {
  id: string
  nome: string
  rendimento: number
  embalagem: number
  mao_obra: number
  margem: number
  margem_minima?: number
  receita_id?: string // for products relation
  product_id?: string // link to products table
  ingredientes?: RecipeIngredient[]
}

export function RecipeManager({ vendasEstimadas = 100 }: { vendasEstimadas?: number }) {
  const { user } = useAuth()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([])
  const [availableProducts, setAvailableProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Form State
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<Recipe>({
    id: "",
    nome: "",
    rendimento: 1,
    embalagem: 0,
    mao_obra: 0,
    margem: 0.5, // 50% default
    margem_minima: 0.3, // 30% default
    product_id: "",
    ingredientes: []
  })

  // Selected Ingredient for adding to recipe
  const [selectedIngId, setSelectedIngId] = useState("")
  const [selectedIngQty, setSelectedIngQty] = useState("")

  useEffect(() => {
    if (user) {
      fetchRecipes()
      fetchIngredients()
      fetchProducts()
    }
  }, [user])

  async function fetchRecipes() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("receitas")
        .select(`
          *,
          receita_ingredientes(
            ingrediente_id,
            quantidade,
            ingredientes(nome, custo_unitario, unidade)
          )
        `)
        .order("created_at", { ascending: false })
      
      if (error) throw error
      
      // Flatten the ingredients data
      const formatted = data?.map(r => ({
        ...r,
        ingredientes: r.receita_ingredientes.map((ri: any) => ({
          ingrediente_id: ri.ingrediente_id,
          quantidade: ri.quantidade,
          nome: ri.ingredientes.nome,
          custo_unitario: ri.ingredientes.custo_unitario,
          unidade: ri.ingredientes.unidade
        }))
      }))
      setRecipes(formatted || [])
    } catch (error: any) {
      toast.error("Erro ao carregar receitas: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchIngredients() {
    const { data } = await supabase.from("ingredientes").select("id, nome, custo_unitario, unidade").order("nome")
    setAvailableIngredients(data || [])
  }

  async function fetchProducts() {
    const { data } = await supabase.from("products").select("id, name").order("name")
    setAvailableProducts(data || [])
  }

  function addIngredientToForm() {
    if (!selectedIngId || !selectedIngQty) return
    
    const ing = availableIngredients.find(i => i.id === selectedIngId)
    if (!ing) return

    const newIng: RecipeIngredient = {
      ingrediente_id: ing.id,
      quantidade: parseFloat(selectedIngQty),
      nome: ing.nome,
      custo_unitario: ing.custo_unitario,
      unidade: ing.unidade
    }

    setFormData(prev => ({
      ...prev,
      ingredientes: [...(prev.ingredientes || []), newIng]
    }))

    setSelectedIngId("")
    setSelectedIngQty("")
  }

  function removeIngredientFromForm(id: string) {
    setFormData(prev => ({
      ...prev,
      ingredientes: prev.ingredientes?.filter(i => i.ingrediente_id !== id)
    }))
  }

  // CALCULATIONS (Real-time)
  const stats = useMemo(() => {
    const custoIngredientes = formData.ingredientes?.reduce((acc, curr) => {
      return acc + (curr.quantidade * (curr.custo_unitario || 0))
    }, 0) || 0

    const rendimento = formData.rendimento || 1
    const custoPorUnidade = custoIngredientes / rendimento
    const embalagem = Number(formData.embalagem) || 0
    const maoObra = Number(formData.mao_obra) || 0
    const custoFinal = custoPorUnidade + embalagem + maoObra
    
    const margem = Number(formData.margem) || 0
    const precoSugerido = margem < 1 ? custoFinal / (1 - margem) : custoFinal * 2
    const lucro = precoSugerido - custoFinal
    
    // Alerta de Margem
    const margemMinima = Number(formData.margem_minima) || 0
    const statusMargem = margem >= margemMinima ? "healthy" : (margem >= margemMinima * 0.7 ? "warning" : "danger")

    return {
      custoIngredientes,
      custoPorUnidade,
      custoFinal,
      precoSugerido,
      lucro,
      margemPerc: margem * 100,
      statusMargem,
      margemMinimaPerc: margemMinima * 100
    }
  }, [formData])

  async function saveRecipe() {
    if (!user) return
    if (!formData.nome) {
      toast.error("Dê um nome à receita")
      return
    }

    try {
      setSaving(true)
      
      // 1. Upsert Recipe
      const { data: recipeData, error: recipeError } = await supabase
        .from("receitas")
        .upsert({
          id: formData.id || undefined,
          user_id: user.id,
          nome: formData.nome,
          rendimento: formData.rendimento,
          embalagem: formData.embalagem,
          mao_obra: formData.mao_obra,
          margem: formData.margem,
          margem_minima: formData.margem_minima
        })
        .select()
        .single()

      if (recipeError) throw recipeError

      // 1.1 Link product to recipe if selected
      if (formData.product_id) {
        await supabase
          .from("products")
          .update({ receita_id: recipeData.id })
          .eq("id", formData.product_id)
      }

      // 2. Clear old ingredients if updating
      if (formData.id) {
        await supabase.from("receita_ingredientes").delete().eq("receita_id", formData.id)
      }

      // 3. Insert new ingredients
      if (formData.ingredientes?.length) {
        const { error: ingError } = await supabase
          .from("receita_ingredientes")
          .insert(formData.ingredientes.map(i => ({
            receita_id: recipeData.id,
            ingrediente_id: i.ingrediente_id,
            quantidade: i.quantidade
          })))
        
        if (ingError) throw ingError
      }

      toast.success("Receita salva com sucesso!")
      setIsCreating(false)
      fetchRecipes()
      setFormData({
        id: "",
        nome: "",
        rendimento: 1,
        embalagem: 0,
        mao_obra: 0,
        margem: 0.5,
        ingredientes: []
      })
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  function startEdit(recipe: Recipe) {
    setFormData(recipe)
    setIsCreating(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function deleteRecipe(id: string) {
    if (!confirm("Excluir esta receita?")) return
    const { error } = await supabase.from("receitas").delete().eq("id", id)
    if (error) toast.error(error.message)
    else {
      toast.success("Receita excluída")
      fetchRecipes()
    }
  }

  return (
    <div className="space-y-6">
      {/* Create/Edit Form - SPLIT SCREEN REDESIGN */}
      {isCreating && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* Left Column: Configuration & Ingredients (col-span-8) */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="border-none shadow-premium rounded-[32px] overflow-hidden bg-white p-8">
              <div className="flex justify-between items-center mb-10">
                <div>
                   <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                     {formData.id ? "Editar Ficha Técnica" : "Nova Ficha Técnica"}
                   </h3>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1 italic">Configure os custos base do seu produto</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsCreating(false)} className="rounded-full hover:bg-rose-50 text-rose-500">
                  <X size={24} />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome do Produto</Label>
                  <Input 
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Bolo de Cenoura com Brigadeiro"
                    className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-black italic uppercase text-sm text-slate-900 placeholder:text-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-blue-500 ml-1 flex items-center gap-2">
                    Vincular ao Cardápio <Badge variant="outline" className="text-[7px] border-blue-400 text-blue-500 font-black">AUTO-UPDATE</Badge>
                  </Label>
                  <Select value={formData.product_id} onValueChange={v => setFormData({ ...formData, product_id: v })}>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-black italic uppercase text-xs text-slate-700">
                      <SelectValue placeholder="Selecione um produto cadastrado..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum vínculo</SelectItem>
                      {availableProducts.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Ingredients Workspace */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="size-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                       <PlusCircle size={20} />
                    </div>
                    <h4 className="text-sm font-black uppercase italic tracking-tighter text-slate-900">Montagem da Receita</h4>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <div className="md:col-span-7">
                       <Select value={selectedIngId} onValueChange={setSelectedIngId}>
                          <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200">
                             <SelectValue placeholder="Escolher ingrediente do estoque..." />
                          </SelectTrigger>
                          <SelectContent>
                             {availableIngredients.map(i => (
                               <SelectItem key={i.id} value={i.id}>{i.nome} ({i.unidade})</SelectItem>
                             ))}
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
                      onClick={addIngredientToForm}
                      disabled={!selectedIngId || !selectedIngQty}
                      className="md:col-span-2 h-12 rounded-xl bg-blue-600 text-white font-black italic uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20"
                    >
                       Add
                    </Button>
                 </div>

                 <div className="space-y-2 mt-6">
                    <AnimatePresence mode="popLayout">
                      {formData.ingredientes?.map((ing) => (
                        <motion.div 
                          key={ing.ingrediente_id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 transition-all group"
                        >
                           <div className="flex items-center gap-4">
                              <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                 <Plus size={16} />
                              </div>
                              <div className="flex flex-col">
                                 <span className="font-black text-xs uppercase italic text-slate-900 leading-none">{ing.nome}</span>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {ing.quantidade} {ing.unidade} • R$ {(ing.quantidade * (ing.custo_unitario || 0)).toFixed(2)}
                                 </span>
                              </div>
                           </div>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             onClick={() => removeIngredientFromForm(ing.ingrediente_id)}
                             className="size-10 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50"
                           >
                             <Trash2 size={18} />
                           </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {formData.ingredientes?.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[32px]">
                         <p className="text-[10px] font-black uppercase text-slate-400 italic">Sua lista de ingredientes está vazia</p>
                      </div>
                    )}
                 </div>
              </div>
            </Card>

            <Card className="border-none shadow-premium rounded-[32px] overflow-hidden bg-white p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Rendimento (un)</Label>
                  <Input 
                    type="number"
                    value={formData.rendimento}
                    onChange={e => setFormData({ ...formData, rendimento: parseFloat(e.target.value) || 0 })}
                    className="h-12 rounded-2xl bg-slate-50 border-slate-100 font-black italic text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Embalagem (R$)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={formData.embalagem}
                    onChange={e => setFormData({ ...formData, embalagem: parseFloat(e.target.value) || 0 })}
                    className="h-12 rounded-2xl bg-slate-50 border-slate-100 font-black italic text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Mão de Obra (R$)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={formData.mao_obra}
                    onChange={e => setFormData({ ...formData, mao_obra: parseFloat(e.target.value) || 0 })}
                    className="h-12 rounded-2xl bg-slate-50 border-slate-100 font-black italic text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Margem Alvo (%)</Label>
                  <div className="relative">
                    <Input 
                      type="number"
                      value={formData.margem * 100}
                      onChange={e => setFormData({ ...formData, margem: (parseFloat(e.target.value) || 0) / 100 })}
                      className="h-12 rounded-2xl bg-slate-50 border-slate-100 font-black italic text-center pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black italic text-slate-400">%</span>
                  </div>
                </div>
            </Card>
          </div>

          {/* Right Column: Sticky Result Dashboard (col-span-4) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
             <Card className="rounded-[40px] border-none bg-[#0F172A] text-white overflow-hidden shadow-2xl relative">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 p-8 text-blue-500 opacity-5 pointer-events-none">
                   <Calculator size={160} />
                </div>
                
                <CardHeader className="p-8 pb-4 relative z-10">
                   <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center">
                         <TrendingUp size={16} />
                      </div>
                      <h3 className="text-lg font-black italic uppercase tracking-tighter">Visão de Lucro</h3>
                   </div>
                </CardHeader>

                <CardContent className="p-8 pt-4 space-y-8 relative z-10">
                   <div className="space-y-4">
                      <div className="flex justify-between items-center group">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Custo Insumos</span>
                         <span className="text-lg font-black italic">R$ {stats.custoIngredientes.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center group">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Custo / Unidade</span>
                         <span className="text-lg font-black italic">R$ {stats.custoPorUnidade.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-white/5">
                         <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 italic">Custo Prod. Final</span>
                         <span className="text-2xl font-black italic text-blue-400">R$ {stats.custoFinal.toFixed(2)}</span>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="p-6 rounded-[32px] bg-gradient-to-br from-blue-600 to-blue-800 shadow-xl text-center relative overflow-hidden group">
                         <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-blue-100/70 block mb-2">Preço de Venda Sugerido</span>
                         <div className="text-4xl font-black italic tracking-tighter leading-none text-white">
                            R$ {stats.precoSugerido.toFixed(2)}
                         </div>
                         <div className="mt-4 flex items-center justify-center gap-2">
                           <Badge className={cn(
                             "border-none font-black text-[9px] uppercase px-3 h-5",
                             stats.statusMargem === 'danger' ? "bg-rose-500" : stats.statusMargem === 'warning' ? "bg-amber-500" : "bg-emerald-500"
                           )}>
                             {stats.margemPerc.toFixed(0)}% de MARGEM
                           </Badge>
                         </div>
                      </div>

                      <div className={cn(
                        "p-5 rounded-3xl border transition-all duration-500",
                        stats.statusMargem === 'danger' ? "bg-rose-500/10 border-rose-500/20" : 
                        stats.statusMargem === 'warning' ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20"
                      )}>
                         <div className="flex justify-between items-center mb-1">
                            <span className={cn(
                              "text-[10px] font-black uppercase italic tracking-widest",
                              stats.statusMargem === 'danger' ? "text-rose-400" : 
                              stats.statusMargem === 'warning' ? "text-amber-400" : "text-emerald-400"
                            )}>Lucro Líquido por Unidade</span>
                         </div>
                         <h4 className={cn(
                           "text-2xl font-black italic tracking-tighter",
                           stats.statusMargem === 'danger' ? "text-rose-400" : 
                           stats.statusMargem === 'warning' ? "text-amber-400" : "text-emerald-400"
                         )}>R$ {stats.lucro.toFixed(2)}</h4>
                         
                         {stats.statusMargem === 'danger' && (
                           <p className="text-[8px] font-bold text-rose-500 uppercase mt-2 animate-pulse leading-tight">
                             ⚠️ Sua margem está abaixo do limite mínimo ({stats.margemMinimaPerc}%). Revise os custos ou aumente o preço.
                           </p>
                         )}
                      </div>
                   </div>

                   <div className="p-6 bg-white/5 rounded-[32px] border border-white/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 text-white/5 pointer-events-none">
                         <BarChart3 size={60} />
                      </div>
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 italic">Projeção Mensal ({vendasEstimadas} un)</p>
                      <div className="flex flex-col gap-1">
                         <h4 className="text-3xl font-black italic tracking-tighter text-white">R$ {(stats.lucro * vendasEstimadas).toFixed(2)}</h4>
                         <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Lucro Estimado 30 Dias</span>
                      </div>
                   </div>
                </CardContent>
             </Card>

             <Button 
               onClick={saveRecipe} 
               disabled={saving}
               className="w-full h-16 rounded-[28px] bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] group"
             >
                {saving ? (
                   <Loader2 className="animate-spin" />
                ) : (
                   <>
                     <Save className="group-hover:rotate-12 transition-transform" size={24} />
                     <span className="text-lg font-black uppercase italic tracking-tighter">Salvar Ficha Técnica</span>
                   </>
                )}
             </Button>
          </div>
        </motion.div>
      )}

      {/* Recipes List Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-[var(--text-primary)]">Suas Receitas</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Gerencie sua produção e preços de venda</p>
        </div>
        {!isCreating && (
          <Button 
            onClick={() => setIsCreating(true)}
            className="rounded-2xl h-12 px-8 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-black uppercase italic tracking-widest shadow-lg shadow-pink-500/20"
          >
            <Plus className="mr-2" /> Nova Receita
          </Button>
        )}
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <div className="col-span-full flex justify-center py-20">
              <Loader2 className="animate-spin text-[var(--primary)] size-12" />
           </div>
        ) : recipes.length === 0 ? (
           <div className="col-span-full text-center py-20 bg-[var(--bg-card)] rounded-[40px] border-2 border-dashed border-[var(--border)]">
              <p className="text-[var(--text-secondary)] font-black uppercase italic text-sm">Você ainda não tem receitas cadastradas</p>
              <Button variant="link" onClick={() => setIsCreating(true)} className="text-[var(--primary)] font-black uppercase text-xs mt-2">Começar agora</Button>
           </div>
        ) : (
          recipes.map(recipe => (
            <Card key={recipe.id} className="border-none shadow-xl bg-[var(--bg-card)] rounded-[32px] overflow-hidden group hover:scale-[1.02] transition-all hover:shadow-2xl">
               <CardHeader className="p-6 pb-2">
                  <div className="flex justify-between items-start">
                     <div className="size-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] mb-3">
                        <TrendingUp size={24} />
                     </div>
                     <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(recipe)} className="rounded-full hover:bg-indigo-500/10 text-indigo-500">
                           <Edit className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteRecipe(recipe.id)} className="rounded-full hover:bg-rose-500/10 text-rose-500">
                           <Trash2 className="size-4" />
                        </Button>
                     </div>
                  </div>
                  <CardTitle className="text-xl font-black italic uppercase tracking-tighter text-[var(--text-primary)] truncate">
                    {recipe.nome}
                  </CardTitle>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Rendimento: {recipe.rendimento} un</p>
               </CardHeader>
               <CardContent className="p-6">
                  <div className="space-y-2 mt-2">
                     <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-[var(--text-secondary)] uppercase tracking-widest text-[9px]">Preço Sugerido</span>
                        <span className="font-black italic text-[var(--text-primary)]">
                           R$ {(
                             (recipe.ingredientes!.reduce((acc, curr) => acc + (curr.quantidade * (curr.custo_unitario || 0)), 0) / recipe.rendimento + 
                             recipe.embalagem + recipe.mao_obra) / (1 - recipe.margem)
                           ).toFixed(2)}
                        </span>
                     </div>
                     <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-[var(--text-secondary)] uppercase tracking-widest text-[9px]">Margem Lucro</span>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[9px] uppercase">{(recipe.margem * 100).toFixed(0)}%</Badge>
                     </div>
                     <div className="flex justify-between items-center text-xs pt-2 border-t border-[var(--border)] mt-2">
                        <span className="font-bold text-indigo-500 uppercase tracking-widest text-[9px]">Lucro Est. ({vendasEstimadas}/mês)</span>
                        <span className="font-black italic text-indigo-600">
                           R$ {(
                             (( (recipe.ingredientes!.reduce((acc, curr) => acc + (curr.quantidade * (curr.custo_unitario || 0)), 0) / recipe.rendimento + 
                             recipe.embalagem + recipe.mao_obra) / (1 - recipe.margem) ) - 
                             (recipe.ingredientes!.reduce((acc, curr) => acc + (curr.quantidade * (curr.custo_unitario || 0)), 0) / recipe.rendimento + 
                             recipe.embalagem + recipe.mao_obra)) * vendasEstimadas
                           ).toFixed(2)}
                        </span>
                     </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-6 rounded-2xl border-[var(--border)] text-[var(--text-secondary)] font-black uppercase text-[10px] italic h-10 group-hover:bg-[var(--primary)] group-hover:text-white group-hover:border-none transition-all"
                    onClick={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
                  >
                    Ver detalhes {expandedId === recipe.id ? <ChevronDown className="ml-2 size-4" /> : <ChevronRight className="ml-2 size-4" />}
                  </Button>

                  {expandedId === recipe.id && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-2 animate-in slide-in-from-top-2 duration-300">
                       <p className="text-[9px] font-black uppercase text-[var(--text-secondary)] mb-2">Ingredientes ({recipe.ingredientes?.length})</p>
                       {recipe.ingredientes?.map((ing, i) => (
                         <div key={i} className="flex justify-between text-[10px]">
                            <span className="font-bold text-[var(--text-primary)]">{ing.nome}</span>
                            <span className="text-[var(--text-secondary)]">{ing.quantidade}{ing.unidade}</span>
                         </div>
                       ))}
                    </div>
                  )}
               </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

