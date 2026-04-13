import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { product, mode } = await req.json();

    if (!product) {
      return NextResponse.json({ error: 'Dados do produto não fornecidos' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Chave da API não configurada.' }, { status: 500 });
    }

    const categories = ["Bolos", "Doces", "Combos", "Bebidas", "Outros"];

    let systemPrompt = "";
    let userPrompt = "";

    if (mode === "category_only") {
      systemPrompt = `Você é um assistente de organização de cardápio. Classifique o produto em uma destas categorias: ${categories.join(", ")}. Responda APENAS o JSON no formato: {"category": "Nome da Categoria"}`;
      userPrompt = `Produto: ${product.name}\nDescrição: ${product.description}`;
    } else {
      systemPrompt = `Você é um Especialista em Vendas para Confeitaria. Transforme este produto em uma Máquina de Vendas.
      RETORNE APENAS JSON:
      {
        "name": "Nome Premium",
        "description": "Copy Emocional",
        "category": "Escolha entre: ${categories.join(", ")}",
        "price_suggestion": { "min": 0, "max": 0, "ideal": 0 },
        "score": 0,
        "image_analysis": { "score": 0, "critique": "", "improvement_plan": "", "prompt": "" },
        "analysis": "Porque melhorei",
        "marketing": { "whatsapp_text": "", "instagram_caption": "" }
      }`;
      userPrompt = `Nome: ${product.name}\nDescrição: ${product.description}\nPreço: ${product.price}\nURL: ${product.image_url}`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
    });

    const gptContent = response.choices[0].message.content?.trim() || '';
    let jsonString = gptContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');

    try {
      const optimizedData = JSON.parse(jsonString);
      if (mode !== "category_only") {
        optimizedData.improved_image_url = product.image_url;
      }
      return NextResponse.json(optimizedData);
    } catch (e) {
      return NextResponse.json({ error: 'Erro ao processar JSON da IA' }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
