import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getServerUser } from '@/lib/supabaseAuth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      tenant_id,
      items,
      payment_method
    } = body

    console.log('📦 [API/Order] Incoming payload:', JSON.stringify(body, null, 2))

    // 1. Backend Security: Identificação do Tenant (Cardápio Público ou Painel)
    let effectiveTenantId = body.tenant_id || body.company_id
    
    // Se vier UUID zerado ou inválido, rejeitar para evitar pedidos órfãos
    if (!effectiveTenantId || effectiveTenantId === '00000000-0000-0000-0000-000000000000') {
      console.error('❌ [API/Order] tenant_id inválido ou zerado:', effectiveTenantId)
      return NextResponse.json({ 
        error: 'ID da loja não identificado. Tente novamente.' 
      }, { status: 400 })
    }

    // Opcional: Validar se há usuário logado para pedidos internos (ex: mesa pelo painel)
    // Mas para o cardápio público, o id do corpo da requisição é soberano.

    console.log('🎯 [API/Order] Effective Tenant ID:', effectiveTenantId)

    if (!effectiveTenantId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Dados incompletos ou Tenant não identificado' }, { status: 400 })
    }

    // 1. Inserir o pedido com status 'pending' (padrão profissional v5)
    // Evita erro de CHECK constraint (status deve ser pending, accepted, etc)
    const initialStatus = 'novo'
    const rawType = body.order_type || body.tipo_pedido || 'retirada'
    const normalizedType = (rawType === 'entrega' || rawType === 'delivery') ? 'delivery' : 
                         (rawType === 'retirada' || rawType === 'balcao') ? 'balcao' : 'salao'

      const rpcParams = {
        p_tenant_id: effectiveTenantId,
        p_customer: {
          name: body.customer?.name || body.name,
          phone: body.customer?.phone || body.phone,
          email: body.customer?.email || body.email
        },
        p_address: {
          street: body.address?.street || body.delivery_address || body.address,
          number: body.address?.number || body.delivery_number || body.number,
          neighborhood: body.address?.neighborhood || body.delivery_neighborhood || body.neighborhood,
          city: body.address?.city || body.delivery_city || body.city,
          complement: body.address?.complement || body.delivery_complement || body.complement,
          zip: body.address?.zip || body.cep
        },
        p_order: {
          total: body.valor_total || body.total,
          status: initialStatus,
          order_status: initialStatus,
          order_type: normalizedType,
          notes: body.notes || body.observacoes,
          delivery_fee: body.taxa_entrega || body.delivery_fee || 0,
          discount: body.discount || body.desconto || 0
        },
      p_items: items.map((item: any) => ({
        product_id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        variation: item.variation,
        extras: item.extras,
        observation: item.observation || item.observacao
      })),
      p_payment: {
        amount: body.valor_total || body.total,
        method: payment_method,
        status: initialStatus,
        needs_change: body.precisa_troco || body.needs_change,
        change_for: body.valor_pago || body.change_for
      }
    }

    console.log('🚀 [API/Order] Calling RPC create_complete_order with params:', JSON.stringify(rpcParams, null, 2))

    // 2. Call Transactional RPC
    const { data: result, error: rpcError } = await supabaseAdmin
      .rpc('create_complete_order', rpcParams)

    if (rpcError) {
      console.error('❌ [API/Order] RPC Error calling create_complete_order:', rpcError)
      throw new Error(`Erro ao criar pedido (RPC): ${rpcError.message}`)
    }

    console.log('✅ [API/Order] RPC result:', JSON.stringify(result, null, 2))

    if (!result.success) {
      console.error('❌ [API/Order] Transactional Error in create_complete_order:', result.error, result.detail)
      throw new Error(`Erro transacional ao processar pedido: ${result.error}`)
    }

    return NextResponse.json({ 
      success: true, 
      orderId: result.order_id,
      status: initialStatus 
    })

  } catch (error: any) {
    console.error('API Order Create Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
