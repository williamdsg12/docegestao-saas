import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Nenhum texto fornecido' }, { status: 400 })
    }

    console.log('1. Analyzing shopping text via AI (gpt-4o-mini)...');
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é um assistente especialista em confeitaria e organização de compras.
          Sua tarefa é extrair itens de uma lista de compras de um texto bagunçado.
          Retorne APENAS um objeto JSON válido.`
        },
        {
          role: "user",
          content: `Extraia os itens deste texto para uma lista de compras estruturada:
          
          Texto: "${text}"
          
          Retorne o JSON neste formato (Campos Obrigatórios):
          {
            "items": [
              {
                "item": "Nome do produto/item",
                "codigo": "Código ou SKU",
                "descricao": "Descrição detalhada",
                "quantidade": 1.5,
                "unidade": "un|g|kg|ml|l",
                "valor_unitario": 10.00,
                "valor_total": 15.00,
                "fornecedor": "Nome do fornecedor se houver"
              }
            ]
          }
          
          Regras:
          - PRIORIDADE MÁXIMA: Extrair precisamente 'item', 'codigo', 'descricao', 'quantidade', 'unidade', 'valor_unitario' e 'valor_total'.
          - Se não houver código, use vazio "".
          - Se não houver descrição, use vazio "".
          - Se não houver quantidade, use 1.
          - Se não houver unidade, use 'un'.
          - Normalize unidades para: kg, g, l, ml, un.
          - IMPORTANTE: Se o texto for uma tabela (como o print), extraia todas as colunas respectivamente.`
        }
      ],
      response_format: { type: "json_object" }
    })

    const parsedContent = JSON.parse(response.choices[0].message.content || '{"items": []}')
    console.log('2. Parse success. Items found:', parsedContent.items?.length);

    return NextResponse.json({
        success: true,
        data: parsedContent
    })

  } catch (error: any) {
    console.error('AI TEXT PARSE ERROR:', error)
    return NextResponse.json({ 
      error: 'Erro ao analisar o texto com IA',
      details: error.message 
    }, { status: 500 })
  }
}
