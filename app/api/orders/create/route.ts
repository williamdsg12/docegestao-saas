import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      tenant_id,
      customer_id,
      valor_total,
      taxa_entrega = 0,
      desconto = 0,
      payment_method,
      notes,
      precisa_troco = false,
      valor_pago = 0,
      troco = 0,
      items // Array of { id, quantity, price }
    } = body

    const tenantIdResolved = tenant_id || body.company_id

    if (!tenantIdResolved || !items || items.length === 0) {
      return NextResponse.json({ error: 'Dados incompletos (Faltando dados da Loja/Tenant)' }, { status: 400 })
    }

    // 1. Inserir o pedido com status 'pending' ou 'novo'
    const isOnlinePayment = ['pix_online', 'credit_card_online'].includes(payment_method)
    const initialStatus = isOnlinePayment ? 'pendente_pagamento' : 'novo'

    const { data: pedido, error: pedidoError } = await supabaseAdmin
      .from('orders')
      .insert({
        tenant_id: tenantIdResolved,
        customer_id: customer_id || body.cliente_id,
        status: initialStatus,
        total: valor_total,
        delivery_fee: taxa_entrega,
        discount: desconto,
        payment_method,
        notes,
        precisa_troco,
        valor_pago,
        troco,
        order_type: body.order_type || body.tipo_pedido || 'retirada',
        address_id: body.address_id,
        cliente_id: body.cliente_id || customer_id
      })
      .select()
      .single()

    if (pedidoError) throw pedidoError

    // 2. Inserir itens do pedido
    const itensParaInserir = items.map((item: any) => ({
      order_id: pedido.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
      variation: item.variation,
      extras: item.extras,
      observation: item.observation
    }))

    const { error: itensError } = await supabaseAdmin
      .from('order_items')
      .insert(itensParaInserir)

    if (itensError) {
      console.error('Erro ao inserir itens, mas pedido foi criado:', itensError)
    }

    return NextResponse.json({ 
      success: true, 
      orderId: pedido.id,
      status: pedido.status 
    })

  } catch (error: any) {
    console.error('API Order Create Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
