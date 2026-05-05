"use client"

import { useState, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export interface Ingredient {
  id: string
  nome: string
  categoria: string
  marca?: string
  unidade_compra: string
  quantidade_embalagem: number
  valor_pago: number
  custo_unitario: number
}

export interface RecipeItem {
  ingredientId: string
  quantity: number
  name: string
  unit: string
  cost: number
}

export function useSmartPricing() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // --- Step State ---
  const [step, setStep] = useState(1)

  // --- Calculation State ---
  const [selectedIngredients, setSelectedIngredients] = useState<RecipeItem[]>([])
  const [recipeInfo, setRecipeInfo] = useState({
    name: "",
    category: "Bolos de Pote",
    yieldPots: 12,
    gramsPerPot: 220,
    markup: 100, // %
  })

  const [overheads, setOverheads] = useState({
    gas: 0.50,
    energy: 0.30,
    labor: 2.00,
    packaging: 1.20,
    label: 0.20,
    spoon: 0.15,
  })

  // --- Queries ---
  const { data: ingredients = [], isLoading: isLoadingIngredients } = useQuery({
    queryKey: ["ingredients", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ingredientes")
        .select("*")
        .eq("user_id", user?.id)
        .order("nome", { ascending: true })

      if (error) throw error
      return data as Ingredient[]
    },
    enabled: !!user,
  })

  // --- Calculations ---
  const totals = useMemo(() => {
    const costIngredients = selectedIngredients.reduce((acc, item) => acc + (item.cost * item.quantity), 0)
    const costFixed = overheads.gas + overheads.energy + overheads.labor
    const costPackaging = overheads.packaging + overheads.label + overheads.spoon
    
    const totalRecipeCost = costIngredients + costFixed
    const costPerPot = (totalRecipeCost / (recipeInfo.yieldPots || 1)) + costPackaging
    
    const suggestedPrice = costPerPot * (1 + (recipeInfo.markup / 100))
    const profitPerUnit = suggestedPrice - costPerPot
    const totalProfit = profitPerUnit * recipeInfo.yieldPots

    return {
      costIngredients,
      totalRecipeCost,
      costPerPot,
      suggestedPrice,
      profitPerUnit,
      totalProfit
    }
  }, [selectedIngredients, overheads, recipeInfo])

  // --- Mutations ---
  const saveIngredient = useMutation({
    mutationFn: async (ingredient: Omit<Ingredient, "id" | "custo_unitario">) => {
      if (!user?.id) throw new Error("Usuário não autenticado")

      const custo_unitario = (ingredient.valor_pago || 0) / (ingredient.quantidade_embalagem || 1)
      
      // Attempt 1: All columns (V2 Schema)
      const payloadV2 = {
        ...ingredient,
        user_id: user.id,
        custo_unitario,
        unidade: ingredient.unidade_compra || 'un',
        preco_total: ingredient.valor_pago || 0,
        quantidade_total: ingredient.quantidade_embalagem || 0
      }

      console.log("Tentando salvar ingrediente (V2):", payloadV2)
      const { data, error } = await supabase
        .from("ingredientes")
        .insert([payloadV2])
        .select()

      if (error) {
        // If error is "column does not exist", try V1 schema fallback
        if (error.message.includes("column") && error.message.includes("not found")) {
          console.warn("Schema V2 não detectado, tentando fallback V1...")
          const payloadV1 = {
            user_id: user.id,
            nome: ingredient.nome,
            unidade: ingredient.unidade_compra || 'un',
            preco_total: ingredient.valor_pago || 0,
            quantidade_total: ingredient.quantidade_embalagem || 0,
            custo_unitario
          }
          const { data: d1, error: e1 } = await supabase
            .from("ingredientes")
            .insert([payloadV1])
            .select()
          
          if (e1) throw e1
          return d1[0]
        }
        throw error
      }
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] })
      toast.success("Ingrediente salvo com sucesso!")
    },
    onError: (err: any) => {
      console.error("Erro completo ao salvar ingrediente:", err)
      toast.error(`Erro ao salvar: ${err.message || 'Verifique sua conexão'}`)
    }
  })

  const saveRecipe = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado")
      if (!recipeInfo.name) throw new Error("Dê um nome para a sua receita")
      if (selectedIngredients.length === 0) throw new Error("Adicione pelo menos um ingrediente")

      // 1. Create Recipe
      const payloadRecipeV2 = {
        user_id: user.id,
        nome: recipeInfo.name,
        rendimento: recipeInfo.yieldPots,
        embalagem: overheads.packaging,
        mao_obra: overheads.labor,
        margem: recipeInfo.markup / 100,
        categoria: recipeInfo.category,
        rendimento_potes: recipeInfo.yieldPots,
        gramas_por_pote: recipeInfo.gramsPerPot,
        custo_fixo_gas: overheads.gas,
        custo_fixo_energia: overheads.energy,
        markup: recipeInfo.markup
      }

      console.log("Tentando salvar receita (V2):", payloadRecipeV2)
      let { data: recipe, error: recipeError } = await supabase
        .from("receitas")
        .insert([payloadRecipeV2])
        .select()
        .single()

      if (recipeError) {
        if (recipeError.message.includes("column") && recipeError.message.includes("not found")) {
          console.warn("Schema V2 não detectado em receitas, tentando fallback V1...")
          const payloadRecipeV1 = {
            user_id: user.id,
            nome: recipeInfo.name,
            rendimento: recipeInfo.yieldPots,
            embalagem: overheads.packaging,
            mao_obra: overheads.labor,
            margem: recipeInfo.markup / 100
          }
          const { data: d1, error: e1 } = await supabase
            .from("receitas")
            .insert([payloadRecipeV1])
            .select()
            .single()
          
          if (e1) throw e1
          recipe = d1
        } else {
          throw recipeError
        }
      }

      // 2. Create Recipe Items
      const items = selectedIngredients.map(item => ({
        receita_id: recipe.id,
        ingrediente_id: item.ingredientId,
        quantidade: item.quantity
      }))

      const { error: itemsError } = await supabase
        .from("receita_ingredientes")
        .insert(items)

      if (itemsError) throw itemsError

      return recipe
    },
    onSuccess: () => {
      toast.success("Receita salva com sucesso!")
      setStep(1)
    },
    onError: (err: any) => {
      console.error("Erro completo ao salvar receita:", err)
      toast.error(`Erro ao salvar receita: ${err.message}`)
    }
  })

  return {
    step,
    setStep,
    ingredients,
    isLoadingIngredients,
    selectedIngredients,
    setSelectedIngredients,
    recipeInfo,
    setRecipeInfo,
    overheads,
    setOverheads,
    totals,
    saveIngredient: saveIngredient.mutateAsync,
    saveRecipe: saveRecipe.mutateAsync,
    isSavingRecipe: saveRecipe.isPending
  }
}
