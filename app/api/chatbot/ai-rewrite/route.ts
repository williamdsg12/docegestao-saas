import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

export async function POST(req: Request) {
  try {
    const { text, type, companyName } = await req.json()
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key não configurada no servidor.' }, { status: 500 })
    }

    const prompt = `
Você é um especialista em marketing e atendimento ao cliente focado em restaurantes/negócios locais.
O cliente (empresa "${companyName || 'Nossa Empresa'}") deseja ajustar uma mensagem do chatbot automático do WhatsApp dele.

O tipo da mensagem é: ${type}
Mensagem atual/rascunho:
"${text}"

Reescreva esta mensagem para que ela fique mais profissional, empática e converta melhor.
- Mantenha um tom natural de WhatsApp (pode usar emojis adequados, mas sem exagerar).
- ATENÇÃO: Mantenha as variáveis dinâmicas exatas que existem no texto original (ex: {client.name}, {company.name}, {menu.link}). Não altere o formato delas. Você pode mudar a posição, mas garanta que elas façam sentido no novo texto.
- A resposta final deve conter APENAS a nova mensagem, sem aspas, sem introdução ou conclusão, pronta para uso no sistema.
    `

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })

    const rewritten = response.choices[0].message.content?.trim() || text

    return NextResponse.json({ result: rewritten })
  } catch (err: any) {
    console.error('Erro ao reescrever mensagem com IA:', err)
    return NextResponse.json({ error: 'Erro ao gerar mensagem com IA' }, { status: 500 })
  }
}
