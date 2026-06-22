import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { tenantId, phone, message } = await req.json()

    if (!tenantId || !phone || !message) {
      return NextResponse.json({ error: 'Faltam parâmetros' }, { status: 400 })
    }

    const WA_SERVICE_URL = process.env.WA_SERVICE_URL || 'http://localhost:3001'

    // Assumimos que o whatsapp-service pode ter uma rota /message/send
    // Precisamos garantir que isso existe no whatsapp-service/index.ts
    const response = await fetch(`${WA_SERVICE_URL}/message/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, phone, message })
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao enviar mensagem para whatsapp-service:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
