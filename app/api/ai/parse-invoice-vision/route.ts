import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  try {
    const { image } = await req.json() // Expecting base64 image

    if (!image) {
      return NextResponse.json({ error: 'Nenhuma imagem fornecida' }, { status: 400 })
    }

    console.log('1. Analyzing invoice image via AI (gpt-4o-mini)...');
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é um assistente especialista em leitura de notas fiscais e cupons fiscais para controle de estoque.
          Sua tarefa é extrair os itens da nota para um formato estruturado.
          Retorne APENAS um objeto JSON válido.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extraia os itens desta nota fiscal para uma lista estruturada.
              
              Retorne o JSON neste formato:
              {
                "items": [
                  {
                    "item": "Nome do produto",
                    "codigo": "SKU ou Código",
                    "descricao": "Descrição se disponível",
                    "quantidade": 1.0,
                    "unidade": "un|kg|g|l|ml",
                    "valor_unitario": 0.0,
                    "valor_total": 0.0
                  }
                ],
                "fornecedor": "Nome do Fornecedor/Estabelecimento",
                "data": "AAAA-MM-DD",
                "total": 0.0
              }
              
              Regras:
              - Normalize a unidade para: kg, g, l, ml, un.
              - Se o valor unitário não estiver claro, calcule: valor_total / quantidade.
              - Se não houver código, use string vazia.
              - Se o texto estiver ilegível, ignore o item.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${image}`
              }
            }
          ]
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
    console.error('AI VISION PARSE ERROR:', error)
    return NextResponse.json({ 
      error: 'Erro ao analisar a imagem com IA',
      details: error.message 
    }, { status: 500 })
  }
}
