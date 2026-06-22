import { NextResponse } from 'next/server'
const WA = process.env.WA_SERVICE_URL || 'http://localhost:3001'

export async function POST(req: Request) {
  const { tenantId } = await req.json()
  try {
    const res = await fetch(`${WA}/sales-recovery/${tenantId}`, { method: 'POST' })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
  }
}
