import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        const { recipe, userId } = await req.json()

        console.log(">>> [Salvar] Iniciando processo para usuário:", userId)

        if (!recipe || !userId) {
            console.error(">>> [Salvar] Erro: Dados incompletos.")
            return NextResponse.json({ success: false, error: "Dados incompletos" }, { status: 400 })
        }

        const supabase = supabaseAdmin

        // 1. Inserir Receita
        console.log(">>> [Salvar] Inserindo receita:", recipe.nome)
        const { data: recipeData, error: recipeError } = await supabase
            .from("receitas")
            .insert({
                user_id: userId,
                nome: recipe.nome || "Receita Importada",
                rendimento: parseInt(recipe.rendimento) || 1,
                modo_preparo: recipe.modo_preparo || ""
            })
            .select()
            .single()

        if (recipeError) {
            console.error(">>> [Salvar] Erro Supabase (receitas):", recipeError)
            return NextResponse.json({
                success: false,
                error: "Erro ao criar receita no banco.",
                details: recipeError.message,
                hint: recipeError.hint
            }, { status: 400 })
        }

        if (!recipeData) throw new Error("Falha ao recuperar dados da receita salva.")

        // 2. Processar Ingredientes (Mestre, Receita x Ingrediente e Lista de Compras)
        console.log(">>> [Salvar] Processando ingredientes:", recipe.ingredientes?.length)

        for (const ing of recipe.ingredientes || []) {
            try {
                const qtd = parseFloat(ing.quantidade) || 0

                // A. Tentar encontrar ou criar ingrediente na lista mestre
                let { data: ingredientData, error: ingLookupError } = await supabase
                    .from("ingredientes")
                    .select("id")
                    .eq("user_id", userId)
                    .eq("nome", ing.nome)
                    .maybeSingle()

                if (!ingredientData) {
                    console.log(">>> [Salvar] Criando novo ingrediente mestre:", ing.nome)
                    const { data: newIng, error: ingCreateError } = await supabase
                        .from("ingredientes")
                        .insert({
                            user_id: userId,
                            nome: ing.nome,
                            unidade_padrao: ing.unidade || "unidade"
                        })
                        .select()
                        .single()

                    if (ingCreateError) {
                        console.error(`>>> [Salvar] Erro ao criar ingrediente mestre ${ing.nome}:`, ingCreateError)
                        continue
                    }
                    ingredientData = newIng
                }

                if (ingredientData) {
                    // B. Vincular à Receita (Ficha Técnica)
                    await supabase
                        .from("receita_ingredientes")
                        .insert({
                            receita_id: recipeData.id,
                            ingrediente_id: ingredientData.id,
                            quantidade: qtd,
                            unidade: ing.unidade || "unidade"
                        })

                    // C. Adicionar automaticamente à Lista de Compras
                    console.log(">>> [Salvar] Adicionando à lista de compras:", ing.nome)
                    await supabase
                        .from("lista_compras")
                        .insert({
                            user_id: userId,
                            receita_id: recipeData.id,
                            ingrediente_id: ingredientData.id,
                            quantidade_necessaria: qtd,
                            comprado: false
                        })
                }
            } catch (err) {
                console.error(`>>> [Salvar] Falha ao processar ingrediente ${ing.nome}:`, err)
            }
        }

        console.log(">>> [Salvar] Fluxo completo com sucesso!")
        return NextResponse.json({ success: true, recipeId: recipeData.id })

    } catch (error: any) {
        console.error(">>> [Salvar] Erro Crítico:", error)
        return NextResponse.json({
            success: false,
            error: error.message || "Erro inesperado ao salvar",
            details: error.toString()
        }, { status: 500 })
    }
}
