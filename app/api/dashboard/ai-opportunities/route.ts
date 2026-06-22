import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { faturamento, pedidosCount, ticketMedio, clientesAtivos, topProducts = [] } = body

    // 1. If OpenAI Key is present and configured, try calling OpenAI
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("your_openai")) {
      try {
        const topProductsStr = topProducts.length > 0 
          ? topProducts.map((p: any) => `${p.name} (${p.sales} vendas)`).join(", ") 
          : "Nenhum produto vendido ainda"

        const systemPrompt = `Você é um consultor estratégico de negócios especializado em confeitarias, docerias e padarias no modelo SaaS.
Sua tarefa é analisar os dados reais de vendas do estabelecimento e sugerir EXATAMENTE 3 oportunidades de melhoria de faturamento ou eficiência operacional.

MÉTRICAS DO PERÍODO SELECIONADO:
- Faturamento Total: R$ ${faturamento.toFixed(2)}
- Quantidade de Pedidos: ${pedidosCount}
- Ticket Médio: R$ ${ticketMedio.toFixed(2)}
- Clientes Únicos Ativos: ${clientesAtivos}
- Produtos mais vendidos: ${topProductsStr}

Instruções para a resposta:
1. Retorne EXATAMENTE 3 oportunidades.
2. Cada oportunidade deve conter:
   - "title": Título curto, direto e profissional, em letras maiúsculas (ex: "CRIAR COMBOS DE SOBREMESA", "PROGRAMA DE FIDELIDADE VIP").
   - "description": Explicação detalhada da ação prática a ser tomada, como implementá-la e o impacto esperado nas receitas.
   - "impact": Nível de impacto nas vendas, devendo ser "alto", "medio" ou "baixo".
   - "type": Categoria da sugestão, devendo ser "upsell", "promotion" ou "recovery".
3. Retorne APENAS um JSON puro no formato de uma lista de objetos, sem formatações markdown (sem blocos de código \`\`\`json, sem textos antes ou depois).`

        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo", // Cost-effective and fast for structured data
          messages: [
            { role: "system", content: "You are a database response helper that outputs only valid raw JSON." },
            { role: "user", content: systemPrompt }
          ],
          temperature: 0.7,
        })

        const content = completion.choices[0]?.message?.content?.trim() || ""
        
        // Strip out any markdown wrapper formatting if AI ignored system instructions
        const cleanJson = content
          .replace(/^```json/i, "")
          .replace(/^```/, "")
          .replace(/```$/, "")
          .trim()

        const parsed = JSON.parse(cleanJson)
        if (Array.isArray(parsed) && parsed.length === 3) {
          return NextResponse.json(parsed)
        }
      } catch (aiError) {
        console.error("OpenAI call failed, falling back to rule-based engine:", aiError)
      }
    }

    // 2. High-fidelity Rule-Based Fallback Engine
    // Generates highly tailored recommendations based on the actual business metrics
    const fallbackOpportunities = []

    // Opportunity 1: ticketMedio analysis
    if (ticketMedio < 60) {
      fallbackOpportunities.push({
        title: "CRIAR COMBOS DO BRUNCH E SOBREMESAS",
        description: `Seu ticket médio de R$ ${ticketMedio.toFixed(2)} está abaixo do benchmark (R$ 80). Experimente criar combos do tipo "Café + Fatia de Bolo" ou "Doce do Dia + Bebida" com 10% de desconto para incentivar compras casadas e elevar o ticket.`,
        impact: "alto",
        type: "promotion"
      })
    } else {
      fallbackOpportunities.push({
        title: "LANÇAR SOBREMESAS FAMILIARES PREMIUM",
        description: `Seu ticket médio de R$ ${ticketMedio.toFixed(2)} está excelente! Aproveite este poder de compra para lançar opções de maior valor, como tortas inteiras ou caixas de bombons gourmet para presente, focando em datas especiais.`,
        impact: "medio",
        type: "upsell"
      })
    }

    // Opportunity 2: clientesAtivos and loyalty
    if (clientesAtivos < 20) {
      fallbackOpportunities.push({
        title: "CAMPANHA DE CAPTAÇÃO DE LEADS NO INSTAGRAM",
        description: `Com apenas ${clientesAtivos} clientes ativos no período, o foco principal deve ser aquisição. Divulgue o link inteligente do cardápio digital na bio do Instagram e ofereça um cupom de 10% de desconto na primeira compra para capturar contatos.`,
        impact: "alto",
        type: "promotion"
      })
    } else {
      fallbackOpportunities.push({
        title: "PROGRAMA DE INDICAÇÃO E FIDELIDADE VIP",
        description: `Você tem uma base saudável de ${clientesAtivos} clientes ativos. Crie um sistema de pontuação ("Ganhe 1 ponto a cada R$ 10") e ofereça um doce grátis ao atingir 100 pontos para aumentar a recorrência e o LTV.`,
        impact: "alto",
        type: "upsell"
      })
    }

    // Opportunity 3: topProducts and recovery
    if (topProducts.length > 0) {
      const bestProduct = topProducts[0].name
      fallbackOpportunities.push({
        title: `CROSS-SELLING COM ${bestProduct.toUpperCase()}`,
        description: `Seu produto estrela é o "${bestProduct}". Promova o cross-selling oferecendo adicionais como "calda extra" ou "embalagem especial de presente" no momento do checkout pelo cardápio digital, elevando a margem de lucro em até 20%.`,
        impact: "medio",
        type: "upsell"
      })
    } else {
      fallbackOpportunities.push({
        title: "ATIVAR RECUPERAÇÃO DE CARRINHOS NO WHATSAPP",
        description: "Configure e ative os lembretes automáticos de carrinho abandonado após 30 minutos nas configurações do seu chatbot. Isso pode reaver até 25% dos pedidos iniciados e não concluídos.",
        impact: "alto",
        type: "recovery"
      })
    }

    return NextResponse.json(fallbackOpportunities)

  } catch (error: any) {
    console.error("Critical error in ai-opportunities api route:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
