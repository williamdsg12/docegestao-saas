// Force Next.js to recompile this file
import { NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase-admin"

const WA_SERVICE_URL = process.env.WA_SERVICE_URL || "http://localhost:3001"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get("tenantId")

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId obrigatório" }, { status: 400 })
  }

  // 1. Primeiro tenta ler do Supabase (fonte principal)
  const { data: session, error } = await supabase
    .from("whatsapp_sessions")
    .select("status, qr_code, phone_number, updated_at")
    .eq("tenant_id", tenantId)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 = row not found (normal na primeira vez)
    console.error("Erro ao buscar sessão:", error.message)
  }

  // 2. Se tem QR ou está conectado, retorna direto do banco
  if (session?.qr_code || session?.status === "connected") {
    return NextResponse.json({
      status: session.status,
      qr_code: session.qr_code,       // string pura do whatsapp-web.js
      phone_number: session.phone_number,
      source: "database",
    })
  }

  // 3. Fallback: consulta o serviço diretamente
  try {
    const serviceRes = await fetch(
      `${WA_SERVICE_URL}/session/${tenantId}/qr`,
      { signal: AbortSignal.timeout(3000) }
    )
    if (serviceRes.ok) {
      const serviceData = await serviceRes.json()
      return NextResponse.json({
        status: serviceData.status || session?.status || "qr_pending",
        qr_code: serviceData.qr || null,
        source: "service",
      })
    }
  } catch {
    // Serviço indisponível — retorna o que tem no banco
  }

  return NextResponse.json({
    status: session?.status || "disconnected",
    qr_code: null,
    source: "none",
  })
}

export async function POST(req: Request) {
  const { tenantId, action } = await req.json()

  if (!tenantId || !action) {
    return NextResponse.json({ error: "tenantId e action são obrigatórios" }, { status: 400 })
  }

  if (action === "start") {
    // Sinaliza no banco que está iniciando
    await supabase.from("whatsapp_sessions").upsert(
      { tenant_id: tenantId, status: "qr_pending", qr_code: null, updated_at: new Date().toISOString() },
      { onConflict: "tenant_id" }
    )

    // Chama o microserviço whatsapp-web.js
    try {
      const res = await fetch(`${WA_SERVICE_URL}/session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
        signal: AbortSignal.timeout(5000), // não esperar mais de 5s
      })
      const data = await res.json()
      return NextResponse.json(data)
    } catch {
      // Serviço pode estar iniciando — o QR aparece via polling
      return NextResponse.json({ status: "starting" })
    }
  }

  if (action === "disconnect") {
    try {
      await fetch(`${WA_SERVICE_URL}/session/${tenantId}/disconnect`, { method: "POST" })
    } catch { /* ignora erro do serviço */ }

    await supabase.from("whatsapp_sessions").upsert(
      { tenant_id: tenantId, status: "disconnected", qr_code: null, updated_at: new Date().toISOString() },
      { onConflict: "tenant_id" }
    )
    await supabase.from("chatbot_settings")
      .update({ whatsapp_connected: false })
      .eq("tenant_id", tenantId)

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
}
