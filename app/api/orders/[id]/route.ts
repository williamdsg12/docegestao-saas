import { NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase-admin"

/**
 * Função de normalização robusta para garantir compatibilidade entre 
 * o banco de dados e o frontend (OrderDetailsPanel).
 */
export function normalizeOrder(raw: any) {
  // Suporta tanto objeto aninhado (JOIN) quanto colunas flat (sem JOIN)
  const rawCustomer = raw.customers || {}
  const customer = {
    name: rawCustomer.name || rawCustomer.full_name || rawCustomer.nome || raw.customer_name || raw.nome_cliente || 'Cliente',
    phone: rawCustomer.phone || rawCustomer.whatsapp || raw.customer_phone || raw.telefone || raw.whatsapp || '',
    email: rawCustomer.email || raw.customer_email || null,
    cpf: rawCustomer.cpf || raw.customer_cpf || null,
  }

  const items = (raw.order_items || raw.items || []).map((item: any) => ({
    id: item.id,
    name: item.products?.name || item.product_name || item.name || item.nome || 'Produto',
    quantity: Number(item.quantity || item.quantidade || 1),
    unit_price: Number(item.unit_price || item.price || item.preco_unitario || 0),
    total_price: Number(item.total_price || item.subtotal || 0) || (Number(item.unit_price || item.price || 0) * Number(item.quantity || 1)),
    variation: item.product_variations
      ? { name: item.product_variations.name || item.product_variations }
      : item.variation ? (typeof item.variation === 'string' ? { name: item.variation } : item.variation) : null,
    extras: item.extras || item.adicionais || [],
    observation: item.notes || item.observacao || item.observation || null,
  }))

  // Recalcula subtotal somando os itens (Bug do R$ 0,00)
  const calculatedSubtotal = items.reduce((sum: number, item: any) => sum + item.total_price, 0)

  // Detecta tipo de entrega de múltiplos formatos possíveis
  const rawType = (raw.order_type || raw.tipo_pedido || raw.delivery?.type || raw.tipo || 'balcao').toLowerCase()
  const deliveryType = rawType === 'entrega' || rawType === 'delivery' ? 'delivery'
    : rawType === 'pickup' || rawType === 'retirada' ? 'retirada'
    : rawType === 'mesa' || rawType === 'mesas' ? 'mesas'
    : rawType 

  const delivery = {
    type: deliveryType,
    address: raw.addresses?.street || raw.delivery_address || raw.endereco || raw.delivery?.address || raw.customer_address || null,
    number: raw.addresses?.number || raw.delivery_number || raw.numero || raw.delivery?.number || null,
    neighborhood: raw.addresses?.neighborhood || raw.delivery_neighborhood || raw.bairro || raw.delivery?.neighborhood || null,
    city: raw.addresses?.city || raw.delivery_city || raw.cidade || raw.delivery?.city || null,
    reference: raw.addresses?.reference || raw.delivery_reference || raw.ponto_referencia || raw.delivery?.reference || raw.address_reference || null,
    fee: Number(raw.delivery_fee || raw.taxa_entrega || raw.delivery?.fee || 0),
  }

  // Detecta método de pagamento de múltiplos formatos
  const paymentMethod = raw.payment_method
    || raw.metodo_pagamento
    || raw.forma_pagamento
    || raw.payments?.[0]?.method
    || raw.payment?.method
    || null

  const paymentStatus = raw.payment_status
    || raw.status_pagamento
    || raw.payments?.[0]?.status
    || raw.payment?.status
    || 'pending'

  const cash = raw.payments?.[0]?.payment_cash?.[0] || raw.payment_cash?.[0]

  const payment = {
    method: paymentMethod,
    status: paymentStatus,
    changeFor: raw.change_for || raw.troco_para || cash?.change_for || raw.payment?.changeFor || null,
  }

  return {
    // IDs e código
    id: raw.id,
    tenant_id: raw.tenant_id || raw.company_id || null,
    code: raw.code || raw.codigo || `#${String(raw.id).slice(-4).toUpperCase()}`,

    // Datas — garante snake_case E camelCase para compatibilidade
    created_at: raw.created_at,
    createdAt: raw.created_at,
    accepted_at: raw.accepted_at,
    acceptedAt: raw.accepted_at,

    // Status
    status: raw.order_status || raw.status || 'novo',

    // Cliente (objeto aninhado que o painel espera)
    customer,

    // Itens (array que o painel espera em order.items)
    items,

    // Entrega (objeto aninhado que o painel espera)
    delivery,

    // Pagamento (objeto aninhado que o painel espera)
    payment,
    payment_status: paymentStatus,

    // Valores financeiros
    subtotal: calculatedSubtotal || Number(raw.subtotal || 0),
    total: Number(raw.total || 0),
    discount: Number(raw.discount || raw.desconto || 0),
    delivery_fee: delivery.fee,

    // Extras
    notes: raw.notes || raw.observacoes || raw.observation || null,
    merchant_name: raw.merchant_name || raw.company_name || null,
    customer_cpf: customer.cpf || raw.customer_cpf || null,
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 })
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers!customer_id(*),
        addresses!address_id(*),
        order_items(*),
        payments(
            *,
            payment_cash(*)
        )
      `)
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })

    const { data: entrega } = await supabase
      .from('entregas')
      .select('status')
      .eq('pedido_id', id)
      .maybeSingle()

    const normalized = normalizeOrder(order)
    if (normalized.status === 'pronto' && entrega?.status) {
      normalized.status = entrega.status
    }

    return NextResponse.json(normalized)


  } catch (error: any) {
    console.error("❌ [API GET ORDER] Error:", error)
    return NextResponse.json({ error: error.message || "Erro ao buscar detalhes do pedido" }, { status: 500 })
  }
}
