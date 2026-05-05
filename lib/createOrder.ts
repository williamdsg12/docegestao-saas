import { supabase } from "./supabaseClient"

export async function createOrder(data: any) {
  const {
    tenant_id,
    customer,
    address,
    items,
    payment,
    totals
  } = data

  try {
    // =========================
    // 1. CUSTOMER
    // =========================
    // Usamos upsert para evitar duplicados e manter o ID
    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .upsert({
        tenant_id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email
      }, { onConflict: 'tenant_id, phone' })
      .select()
      .single()

    if (customerError) throw customerError

    // =========================
    // 2. ADDRESS
    // =========================
    const { data: addressData, error: addressError } = await supabase
      .from("addresses")
      .insert({
        tenant_id,
        customer_id: customerData.id,
        street: address.street,
        number: address.number,
        neighborhood: address.neighborhood,
        city: address.city,
        complement: address.complement,
        zip: address.zip
      })
      .select()
      .single()

    if (addressError) throw addressError

    // =========================
    // 3. ORDER
    // =========================
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        tenant_id,
        order_type: data.order_type || 'retirada',
        order_status: "pending",
        customer_id: customerData.id,
        address_id: addressData.id,
        notes: data.notes,

        subtotal: totals.subtotal,
        delivery_fee: totals.delivery_fee,
        total: totals.total,

        payment_method: payment.method,
        payment_status: "pending"
      })
      .select()
      .single()

    if (orderError) throw orderError

    // =========================
    // 4. ITEMS
    // =========================
    const itemsToInsert = items.map((item: any) => ({
      tenant_id,
      order_id: orderData.id,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      variation: item.variation,
      extras: item.extras,
      observation: item.observation
    }))

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsToInsert)

    if (itemsError) throw itemsError

    // =========================
    // 5. PAYMENT
    // =========================
    const { data: paymentData, error: paymentError } = await supabase
      .from("payments")
      .insert({
        tenant_id,
        order_id: orderData.id,
        amount: totals.total,
        method: payment.method,
        status: "pending"
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    // =========================
    // 6. TROCO (SE DINHEIRO)
    // =========================
    if (payment.method === "cash" || payment.method === "dinheiro") {
      const { error: cashError } = await supabase
        .from("payment_cash")
        .insert({
          payment_id: paymentData.id,
          needs_change: payment.needs_change,
          change_for: payment.change_for || null
        })

      if (cashError) throw cashError
    }

    return {
      success: true,
      orderId: orderData.id
    }

  } catch (error: any) {
    console.error("ERRO CREATE ORDER:", error)

    return {
      success: false,
      error: error.message
    }
  }
}
