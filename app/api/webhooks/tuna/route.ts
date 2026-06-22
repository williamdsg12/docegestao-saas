import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("Tuna Webhook received:", JSON.stringify(payload, null, 2));

    const { PartnerReference, Status } = payload;

    if (!PartnerReference) {
      return NextResponse.json({ error: "Missing PartnerReference" }, { status: 400 });
    }

    // Map Tuna status to our system status
    // Tuna Statuses: 1: New, 2: Pending, 3: Approved, 4: Cancelled, 5: Refused, 6: Refunded, etc.
    let systemStatus = "pendente_pagamento";
    let isPaid = false;

    switch (Status) {
      case 3: // Approved
        systemStatus = "novo"; // Pedido aprovado vai para fila de produção/novos
        isPaid = true;
        break;
      case 4: // Cancelled
      case 5: // Refused
        systemStatus = "cancelado";
        break;
      case 6: // Refunded
        systemStatus = "reembolsado";
        break;
    }

    // 1. Update Payment Status
    const { data: payment, error: pError } = await supabase
      .from("payments")
      .update({ 
        status: isPaid ? "approved" : (systemStatus === "cancelado" ? "cancelled" : "pending"),
        provider_data: payload
      })
      .eq("order_id", PartnerReference)
      .select()
      .single();

    if (pError) {
      console.error("Error updating payment via webhook:", pError);
    }

    // 2. Update Order Status
    if (systemStatus !== "pendente_pagamento") {
      const updateData: any = {
        order_status: systemStatus
      };
      if (isPaid) {
        updateData.payment_status = "paid";
        updateData.paid = true;
        updateData.payment_confirmed_at = new Date().toISOString();
      }
      
      const { error: oError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", PartnerReference);

      if (oError) {
        console.error("Error updating order via webhook:", oError);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
