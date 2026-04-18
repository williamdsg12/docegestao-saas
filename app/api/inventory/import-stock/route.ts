import { NextResponse } from 'next/server'
import { processImportItems } from '@/utils/inventory'

export async function POST(req: Request) {
  try {
    const { items, tenantId, userId, fornecedor } = await req.json()

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Itens inválidos' }, { status: 400 })
    }

    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'Autenticação inválida' }, { status: 401 })
    }

    const result = await processImportItems({
      items,
      tenantId,
      userId,
      fornecedor
    })

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('IMPORT STOCK ERROR:', error)
    return NextResponse.json({ 
      error: 'Erro ao processar importação',
      details: error.message,
      code: error.code,
      hint: error.hint
    }, { status: 500 })
  }
}
