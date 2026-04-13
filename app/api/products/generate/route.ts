import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt não fornecido' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Chave da API da OpenAI não configurada.' },
        { status: 500 }
      );
    }

    const systemPrompt = `Você é um assistente criativo para confeiteiras.
Sua missão é gerar os detalhes de um produto de confeitaria baseado em uma ideia curta do usuário.

Seja criativo nos nomes e descrições, mantendo um tom doce e apetitoso.
Sugira preços baseados em valores médios de mercado no Brasil para doces artesanais premium.

Retorne APENAS um JSON puro no seguinte formato:
{
  "name": "Nome Criativo do Produto",
  "description": "Descrição detalhada e vendedora",
  "price": 25.90,
  "category": "Bolos | Doces | Combos | Tortas | Outros",
  "preparation_time": 60,
  "variations": [
    { "name": "Pequeno", "price_adjustment": -5 },
    { "name": "Médio", "price_adjustment": 0 },
    { "name": "Grande", "price_adjustment": 10 }
  ],
  "extras": [
    { "name": "Embalagem para Presente", "price": 5 }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `A ideia do produto é: ${prompt}` }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const gptContent = response.choices[0].message.content?.trim() || '';
    
    // Remove potential markdown code blocks
    let jsonString = gptContent;
    if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    }

    try {
      const productData = JSON.parse(jsonString);
      return NextResponse.json(productData);
    } catch (e) {
      console.error("Erro ao parsear JSON da IA:", gptContent);
      return NextResponse.json({ error: 'Erro ao formatar resposta da IA' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Erro na geração de produto com IA:', error);
    return NextResponse.json({ error: 'Erro interno no processamento' }, { status: 500 });
  }
}
