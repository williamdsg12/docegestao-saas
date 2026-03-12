import { NextResponse } from "next/server"
import OpenAI from "openai"

export const dynamic = 'force-dynamic'

// Inicializa a OpenAI (requer OPENAI_API_KEY no .env)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
})

export async function POST(req: Request) {
    try {
        const { type, content } = await req.json()

        if (!content) {
            return NextResponse.json({ success: false, error: "Conteúdo vazio" }, { status: 400 })
        }

        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your_openai_api_key_here") {
            return NextResponse.json({
                success: false,
                error: "Configuração incompleta",
                details: "A variável OPENAI_API_KEY não foi configurada no arquivo .env."
            }, { status: 500 })
        }

        let prompt = ""
        if (type === "link") {
            prompt = `Extraia as informações desta receita a partir do link: ${content}. 
            Retorne APENAS um JSON no seguinte formato:
            {
              "nome": "string",
              "rendimento": number,
              "modo_preparo": "string",
              "ingredientes": [
                { "nome": "string", "quantidade": number, "unidade": "string" }
              ]
            }`
        } else {
            prompt = `Extraia e estruture a seguinte receita em JSON:
            "${content}"
            Retorne APENAS um JSON no seguinte formato:
            {
              "nome": "string",
              "rendimento": number,
              "modo_preparo": "string",
              "ingredientes": [
                { "nome": "string", "quantidade": number, "unidade": "string" }
              ]
            }`
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o", // Ou gpt-3.5-turbo conforme preferência do usuário
            messages: [
                { role: "system", content: "Você é um assistente especializado em confeitaria que retorna dados sempre em JSON puro." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        })

        const responseText = completion.choices[0].message.content
        if (!responseText) throw new Error("A IA não retornou conteúdo.")

        console.log("OpenAI Response:", responseText)

        let rawData: any = {}
        try {
            rawData = JSON.parse(responseText)
        } catch (e) {
            console.error("Erro ao parsear JSON da OpenAI:", e, "Texto bruto:", responseText)
            throw new Error("A IA retornou um formato inválido. Tente novamente.")
        }

        const recipeData = rawData.recipe || rawData.receita || rawData
        const normalizedRecipe = {
            nome: recipeData.nome || recipeData.name || "Receita Importada",
            rendimento: parseFloat(recipeData.rendimento || recipeData.yield || 1) || 1,
            modo_preparo: recipeData.modo_preparo || recipeData.instructions || "Modo de preparo extraído pela IA.",
            ingredientes: (recipeData.ingredientes || recipeData.ingredients || []).map((ing: any) => ({
                nome: ing.nome || ing.name || "Ingrediente",
                quantidade: parseFloat(ing.quantidade || ing.quantity || 0) || 0,
                unidade: ing.unidade || ing.unit || "unidade"
            }))
        }

        return NextResponse.json({
            success: true,
            recipe: normalizedRecipe
        })

    } catch (error: any) {
        console.error("Erro na importação local com OpenAI:", error)
        return NextResponse.json({
            success: false,
            error: `Erro na extração com IA (OpenAI): ${error.message || "Falha desconhecida"}`,
            details: error.toString()
        }, { status: 500 })
    }
}
