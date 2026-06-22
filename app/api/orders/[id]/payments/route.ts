import { NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase-admin"

interface PaymentItem {
  method: string;
  amount: number;
  change_for?: number;
  needs_change?: boolean;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    if (!orderId) {
      return NextResponse.json({ error: "ID do pedido não fornecido" }, { status: 400 })
    }

    const body = await request.json()
    const { payments = [], finalize = false } = body as { payments: PaymentItem[]; finalize: boolean }

    // 1. Fetch current order to get tenant_id and total
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*, total, tenant_id, status, order_status")
      .eq("id", orderId)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    const orderTotal = Number(order.total || 0)
    const tenantId = order.tenant_id

    // 2. Delete existing payment_cash rows associated with payments of this order to prevent FK violations
    // First, find the payments
    const { data: existingPayments, error: findPaymentsErr } = await supabase
      .from("payments")
      .select("id")
      .eq("order_id", orderId)

    if (findPaymentsErr) throw findPaymentsErr

    if (existingPayments && existingPayments.length > 0) {
      const paymentIds = existingPayments.map(p => p.id)
      const { error: deleteCashErr } = await supabase
        .from("payment_cash")
        .delete()
        .in("payment_id", paymentIds)
      
      if (deleteCashErr) throw deleteCashErr
    }

    // 3. Delete existing payments for this order
    const { error: deletePaymentsErr } = await supabase
      .from("payments")
      .delete()
      .eq("order_id", orderId)

    if (deletePaymentsErr) throw deletePaymentsErr

    // 4. Insert new payments and cash details
    let totalPaid = 0
    for (const item of payments) {
      const amount = Number(item.amount || 0)
      if (amount <= 0) continue

      totalPaid += amount

      const { data: insertedPayment, error: insertPaymentErr } = await supabase
        .from("payments")
        .insert({
          tenant_id: tenantId,
          order_id: orderId,
          amount: amount,
          method: item.method,
          payment_method: item.method,
          status: "paid",
          payment_status: "paid"
        })
        .select()
        .single()

      if (insertPaymentErr) throw insertPaymentErr

      if ((item.method === "dinheiro" || item.method === "money") && insertedPayment) {
        const { error: insertCashErr } = await supabase
          .from("payment_cash")
          .insert({
            payment_id: insertedPayment.id,
            needs_change: !!item.needs_change,
            change_for: Number(item.change_for || 0)
          })

        if (insertCashErr) throw insertCashErr
      }
    }

    // 5. Calculate new payment status
    let paymentStatus = "pending"
    if (totalPaid >= orderTotal) {
      paymentStatus = "paid"
    } else if (totalPaid > 0) {
      paymentStatus = "parcial"
    }

    // 6. Prepare order status updates
    const orderUpdates: any = {
      payment_status: paymentStatus
    }

    if (finalize) {
      orderUpdates.order_status = "finalizado"
      orderUpdates.status = "finalizado"
    }

    const { error: updateOrderErr } = await supabase
      .from("orders")
      .update(orderUpdates)
      .eq("id", orderId)

    if (updateOrderErr) throw updateOrderErr

    // Also trigger WhatsApp notifications for status changes if finalized
    if (finalize) {
      try {
        await fetch(`${new URL(request.url).origin}/api/chatbot/notify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, status: "finalizado" })
        })
      } catch (notifyErr) {
        console.error("⚠️ [API PAYMENTS] Error sending WhatsApp notification:", notifyErr)
      }
    }

    return NextResponse.json({
      success: true,
      total_paid: totalPaid,
      payment_status: paymentStatus,
      order_status: finalize ? "finalizado" : (order.order_status || order.status)
    })

  } catch (error: any) {
    console.error("❌ [API POST PAYMENTS] Error:", error)
    return NextResponse.json({ error: error.message || "Erro ao registrar pagamentos" }, { status: 500 })
  }
}
