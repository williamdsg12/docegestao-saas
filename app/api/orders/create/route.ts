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

    // Verify if cash register is open
    const { data: openRegister, error: registerErr } = await supabaseAdmin
      .from('cash_registers')
      .select('id')
      .eq('company_id', effectiveTenantId)
      .eq('status', 'open')
      .limit(1)
      .maybeSingle()

    if (registerErr || !openRegister) {
      return NextResponse.json({ 
        error: 'O caixa deste estabelecimento está FECHADO. Não é possível receber novos pedidos no momento.' 
      }, { status: 400 })
    }

    // 1. Inserir o pedido com status 'novo'
    const initialStatus = 'novo'
    const rawType = body.deliveryType || body.delivery_type || body.order_type || body.tipo_pedido || 'retirada'
    let normalizedType = 'delivery'
    if (['retirada', 'pickup'].includes(rawType)) normalizedType = 'retirada'
    else if (['mesa', 'salao', 'local', 'balcao', 'balcão'].includes(rawType)) normalizedType = 'balcao'
    else if (['entrega', 'delivery'].includes(rawType)) normalizedType = 'delivery'

    let customerName = body.customerName || body.customer?.name || body.name || 'Cliente'
    let customerPhone = body.customerPhone || body.customer?.phone || body.phone || '00000000000'
    let customerEmail = body.customerEmail || body.customer?.email || body.email || ''

    const cleanPhone = customerPhone.replace(/\D/g, '')
    console.log('Buscando cliente:', cleanPhone)

    let existingCust = null
    if (cleanPhone) {
      try {
        const { data } = await supabaseAdmin
          .from('customers')
          .select('*')
          .eq('tenant_id', effectiveTenantId)
          .eq('phone', cleanPhone)
          .maybeSingle()
        existingCust = data
      } catch (e) {
        console.error('Error fetching from customers:', e)
      }
    }

    if (!existingCust && cleanPhone) {
      try {
        const { data: legacy } = await supabaseAdmin
          .from('clientes')
          .select('*')
          .eq('company_id', effectiveTenantId)
          .eq('phone', cleanPhone)
          .maybeSingle()
        if (legacy) {
          existingCust = {
            id: legacy.id,
            name: legacy.name,
            phone: legacy.phone,
            email: legacy.email || '',
            is_legacy: true
          }
        }
      } catch (e) {
        console.error('Error fetching from legacy clientes:', e)
      }
    }

    console.log('Cliente encontrado:', existingCust)

    if (existingCust) {
      console.log('Atualizando cliente...')
    } else {
      console.log('Criando cliente...')
    }

    if (customerName === 'Cliente' && existingCust && existingCust.name) {
      customerName = existingCust.name
      if (existingCust.email && !customerEmail) customerEmail = existingCust.email
    }

    const rpcParams = {
      p_tenant_id: effectiveTenantId,
      p_customer: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        cpf_cnpj: body.customerCpf || body.customer_cpf || body.cpf || body.taxId || null
      },
      p_address: {
        street: body.addressStreet || body.address?.street || body.delivery_address || (typeof body.address === 'string' ? body.address : ''),
        number: body.addressNumber || body.address?.number || body.delivery_number || body.number || '',
        neighborhood: body.addressNeighborhood || body.address?.neighborhood || body.delivery_neighborhood || body.neighborhood || '',
        city: body.addressCity || body.address?.city || body.delivery_city || body.city || '',
        complement: body.addressComplement || body.address?.complement || body.delivery_complement || body.complement || '',
        zip: body.addressCep || body.address?.zip || body.cep || body.zip || '',
        reference_point: body.addressReference || body.address?.reference || body.reference || ''
      },
      p_order: {
        total: body.total || body.valor_total,
        status: initialStatus,
        order_status: initialStatus,
        order_type: normalizedType,
        notes: body.notes || body.observacoes,
        delivery_fee: body.deliveryFee || body.taxa_entrega || 0,
        discount: body.discount || body.desconto || 0,
        latitude: body.latitude || body.address?.lat || null,
        longitude: body.longitude || body.address?.lng || null
      },
      p_items: items.map((item: any) => ({
        product_id: item.productId || item.product_id || item.id,
        name: item.productName || item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice || item.unit_price || item.price,
        variation: item.variations || item.variation,
        extras: item.extras,
        observation: item.observation || item.observacao || item.notes
      })),
      p_payment: {
        amount: body.total || body.valor_total,
        method: body.paymentMethod || payment_method || 'dinheiro',
        status: initialStatus,
        needs_change: body.precisa_troco || body.needs_change || !!body.changeFor,
        change_for: body.changeFor || body.valor_pago || body.change_for
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

    console.log('Cliente salvo com sucesso')
    console.log('Pedido vinculado ao cliente:', result.customer_id)

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
