import { NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase-admin"

function sanitizePhone(raw: string): string {
  return raw.replace(/\D/g, "")
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { tenantId, phone, clientName, cartLink } = body

    if (!tenantId || !phone || !cartLink) {
      return NextResponse.json({ error: "Parâmetros insuficientes" }, { status: 400 })
    }

    const cleanPhone = sanitizePhone(phone)

    let normPhone = cleanPhone
    if ((normPhone.length === 12 || normPhone.length === 13) && normPhone.startsWith('55')) {
      normPhone = normPhone.slice(2)
    }

    // Busca o cliente cadastrado para obter o client_id correspondente
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("telefone_normalizado", normPhone)
      .is("deleted_at", null)
      .maybeSingle()

    const clientId = customer?.id || null

    // Verifica se já existe um carrinho pendente para esse número neste tenant
    const { data: existingCart } = await supabase
      .from("abandoned_carts")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("phone", cleanPhone)
      .eq("status", "pending")
      .maybeSingle()

    if (existingCart) {
      // Atualiza data de atividade e reseta o estágio de recuperação para 0 para recomeçar o timer
      const { error: updateErr } = await supabase
        .from("abandoned_carts")
        .update({
          client_name: clientName,
          cart_link: cartLink,
          client_id: clientId,
          last_activity: new Date().toISOString(),
          recovery_stage: 0, // Reseta estágio de recuperação
          created_at: new Date().toISOString()
        })
        .eq("id", existingCart.id)

      if (updateErr) throw updateErr
      return NextResponse.json({ ok: true, id: existingCart.id, action: "updated" })
    }

    // Cria novo registro pendente
    const { data: newCart, error: insertErr } = await supabase
      .from("abandoned_carts")
      .insert({
        tenant_id: tenantId,
        phone: cleanPhone,
        client_name: clientName,
        cart_link: cartLink,
        client_id: clientId,
        status: "pending",
        last_activity: new Date().toISOString(),
        recovery_stage: 0
      })
      .select("id")
      .single()

    if (insertErr) throw insertErr

    return NextResponse.json({ ok: true, id: newCart.id, action: "created" })

  } catch (err: any) {
    console.error("[Abandoned Cart POST Error]:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE/PUT: Marca como recuperado quando a compra é finalizada
export async function PUT(req: Request) {
  try {
    const { tenantId, phone } = await req.json()

    if (!tenantId || !phone) {
      return NextResponse.json({ error: "Parâmetros insuficientes" }, { status: 400 })
    }

    const cleanPhone = sanitizePhone(phone)

    const { error } = await supabase
      .from("abandoned_carts")
      .update({
        status: "recovered",
        recovered_at: new Date().toISOString()
      })
      .eq("tenant_id", tenantId)
      .eq("phone", cleanPhone)
      .eq("status", "pending")

    if (error) throw error

    return NextResponse.json({ ok: true, message: "Carrinho marcado como recuperado com sucesso" })
  } catch (err: any) {
    console.error("[Abandoned Cart PUT Error]:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
