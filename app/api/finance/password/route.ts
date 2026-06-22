import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { hashPassword, comparePassword, generateFinanceSessionToken } from "@/lib/crypto-helper"
import { sendFinancialSecurityAlert } from "@/lib/email-service"

export const dynamic = "force-dynamic"

// Helper to authenticate user and return profile details
async function getAuthContext(req: Request) {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) return null

  const token = authHeader.replace("Bearer ", "")
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return null

  // Fetch profile via service client to ensure we get tenant_id reliably
  const { createClient } = await import("@supabase/supabase-js")
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await serviceSupabase
    .from("profiles")
    .select("tenant_id, email, company_id")
    .eq("id", user.id)
    .single()

  if (!profile) return null

  const tenantId = profile.tenant_id || profile.company_id
  if (!tenantId) return null

  return { user, profile, tenantId, serviceSupabase }
}

// 1. GET: Check if financial password exists
export async function GET(req: Request) {
  try {
    const context = await getAuthContext(req)
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tenantId, serviceSupabase } = context

    const { data: fp, error } = await serviceSupabase
      .from("financial_passwords")
      .select("id")
      .eq("tenant_id", tenantId)
      .maybeSingle()

    if (error) {
      console.error("Error checking financial password:", error)
      return NextResponse.json({ error: "Erro ao consultar banco de dados" }, { status: 500 })
    }

    return NextResponse.json({ exists: !!fp })
  } catch (error: any) {
    console.error("GET financial password error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// 2. POST: Create financial password
export async function POST(req: Request) {
  try {
    const context = await getAuthContext(req)
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { user, profile, tenantId, serviceSupabase } = context
    const { password, confirmPassword } = await req.json()

    // Validation
    if (!password || !confirmPassword) {
      return NextResponse.json({ error: "Senha e confirmação são obrigatórias" }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "As senhas não coincidem" }, { status: 400 })
    }

    // Rules: Min 8, 1 uppercase, 1 lowercase, 1 number
    if (password.length < 8) {
      return NextResponse.json({ error: "A senha deve ter no mínimo 8 caracteres" }, { status: 400 })
    }
    if (!/[A-Z]/.test(password)) {
      return NextResponse.json({ error: "A senha deve conter pelo menos uma letra maiúscula" }, { status: 400 })
    }
    if (!/[a-z]/.test(password)) {
      return NextResponse.json({ error: "A senha deve conter pelo menos uma letra minúscula" }, { status: 400 })
    }
    if (!/[0-9]/.test(password)) {
      return NextResponse.json({ error: "A senha deve conter pelo menos um número" }, { status: 400 })
    }

    // Check if already exists
    const { data: existing } = await serviceSupabase
      .from("financial_passwords")
      .select("id")
      .eq("tenant_id", tenantId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "Senha financeira já cadastrada para este estabelecimento" }, { status: 400 })
    }

    // Hash and Save
    const passwordHash = await hashPassword(password)
    const { error: insertError } = await serviceSupabase
      .from("financial_passwords")
      .insert({
        tenant_id: tenantId,
        password_hash: passwordHash
      })

    if (insertError) {
      console.error("Error inserting financial password:", insertError)
      return NextResponse.json({ error: "Erro ao cadastrar senha financeira" }, { status: 500 })
    }

    // Audit Log
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1"
    await serviceSupabase
      .from("financial_audit_logs")
      .insert({
        tenant_id: tenantId,
        user_id: user.id,
        action: "Criação de senha financeira",
        ip_address: ip
      })

    // System Notification
    await serviceSupabase
      .from("notifications")
      .insert({
        user_id: user.id,
        company_id: tenantId,
        type: "security",
        title: "🔐 Senha Financeira Criada",
        message: "Uma nova senha financeira exclusiva foi cadastrada por segurança.",
        read: false
      })

    // Email Alert
    if (profile.email) {
      try {
        await sendFinancialSecurityAlert(profile.email, "Criação de Senha Financeira", ip)
      } catch (mailErr) {
        console.error("Alert email failed:", mailErr)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("POST financial password error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// 3. PUT: Change financial password (using old password)
export async function PUT(req: Request) {
  try {
    const context = await getAuthContext(req)
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { user, profile, tenantId, serviceSupabase } = context
    const { oldPassword, newPassword, confirmPassword } = await req.json()

    if (!oldPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "A nova senha e a confirmação não coincidem" }, { status: 400 })
    }

    // Validate rules
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "A nova senha deve ter no mínimo 8 caracteres" }, { status: 400 })
    }
    if (!/[A-Z]/.test(newPassword)) {
      return NextResponse.json({ error: "A nova senha deve conter pelo menos uma letra maiúscula" }, { status: 400 })
    }
    if (!/[a-z]/.test(newPassword)) {
      return NextResponse.json({ error: "A nova senha deve conter pelo menos uma letra minúscula" }, { status: 400 })
    }
    if (!/[0-9]/.test(newPassword)) {
      return NextResponse.json({ error: "A nova senha deve conter pelo menos um número" }, { status: 400 })
    }

    // Fetch existing
    const { data: fp, error: fetchError } = await serviceSupabase
      .from("financial_passwords")
      .select("*")
      .eq("tenant_id", tenantId)
      .single()

    if (fetchError || !fp) {
      return NextResponse.json({ error: "Senha financeira não cadastrada" }, { status: 404 })
    }

    // Compare
    const matches = await comparePassword(oldPassword, fp.password_hash)
    if (!matches) {
      return NextResponse.json({ error: "Senha financeira atual incorreta" }, { status: 400 })
    }

    // Hash and Update
    const passwordHash = await hashPassword(newPassword)
    const { error: updateError } = await serviceSupabase
      .from("financial_passwords")
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq("tenant_id", tenantId)

    if (updateError) {
      console.error("Error updating password:", updateError)
      return NextResponse.json({ error: "Erro ao atualizar senha financeira" }, { status: 500 })
    }

    // Audit Log
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1"
    await serviceSupabase
      .from("financial_audit_logs")
      .insert({
        tenant_id: tenantId,
        user_id: user.id,
        action: "Alteração de senha financeira",
        ip_address: ip
      })

    // System Notification
    await serviceSupabase
      .from("notifications")
      .insert({
        user_id: user.id,
        company_id: tenantId,
        type: "security",
        title: "🔐 Senha Financeira Alterada",
        message: "Sua senha financeira exclusiva foi atualizada com sucesso.",
        read: false
      })

    // Email Alert
    if (profile.email) {
      try {
        await sendFinancialSecurityAlert(profile.email, "Alteração de Senha Financeira", ip)
      } catch (mailErr) {
        console.error("Alert email failed:", mailErr)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("PUT financial password error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// 4. PATCH: Authenticate password and generate a temporary session token
export async function PATCH(req: Request) {
  try {
    const context = await getAuthContext(req)
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { user, tenantId, serviceSupabase } = context
    const { password, durationMinutes } = await req.json()

    if (!password) {
      return NextResponse.json({ error: "Senha financeira é obrigatória" }, { status: 400 })
    }

    const sessionDuration = durationMinutes === 30 ? 30 : 15 // Only allow 15 or 30

    // Fetch hash
    const { data: fp, error } = await serviceSupabase
      .from("financial_passwords")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle()

    if (error || !fp) {
      return NextResponse.json({ error: "Senha financeira não configurada" }, { status: 404 })
    }

    // Compare
    const matches = await comparePassword(password, fp.password_hash)
    if (!matches) {
      return NextResponse.json({ error: "Senha financeira incorreta" }, { status: 400 })
    }

    // Update last access
    await serviceSupabase
      .from("financial_passwords")
      .update({ last_access_at: new Date().toISOString() })
      .eq("id", fp.id)

    // Generate token
    const token = generateFinanceSessionToken(tenantId, sessionDuration)

    return NextResponse.json({
      success: true,
      token,
      expiresAt: Date.now() + sessionDuration * 60 * 1000
    })
  } catch (error: any) {
    console.error("PATCH financial password error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
