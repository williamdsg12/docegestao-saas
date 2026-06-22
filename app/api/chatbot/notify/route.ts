import { NextResponse } from 'next/server'

const WA_SERVICE = process.env.WA_SERVICE_URL || 'http://localhost:3001'

export async function POST(req: Request) {
  try {
    const { tenantId, phone, type, orderData } = await req.json()
    
    if (!phone || !tenantId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const res = await fetch(`${WA_SERVICE}/message/notify`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, phone, type, orderData })
    })
    
    if (!res.ok) {
       throw new Error('Falha ao notificar via serviço WA')
    }
    
    return NextResponse.json(await res.json())
  } catch (error: any) {
    console.error('Chatbot notify API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
