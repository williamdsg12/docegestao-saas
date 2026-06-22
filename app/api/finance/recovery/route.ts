import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { hashPassword } from "@/lib/crypto-helper"
import { sendFinancialPasswordResetCode, sendFinancialSecurityAlert } from "@/lib/email-service"

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

// 1. POST: Generate and send recovery code
export async function POST(req: Request) {
  try {
    const context = await getAuthContext(req)
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { user, profile, tenantId, serviceSupabase } = context

    if (!profile.email) {
      return NextResponse.json({ error: "Este perfil não possui um e-mail cadastrado para redefinição" }, { status: 400 })
    }

    // Verify password exists
    const { data: fp } = await serviceSupabase
      .from("financial_passwords")
      .select("id")
      .eq("tenant_id", tenantId)
      .maybeSingle()

    if (!fp) {
      return NextResponse.json({ error: "Senha financeira não cadastrada" }, { status: 400 })
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes

    // Save recovery details
    const { error: updateError } = await serviceSupabase
      .from("financial_passwords")
      .update({
        recovery_code: code,
        recovery_expires_at: expiresAt
      })
      .eq("tenant_id", tenantId)

    if (updateError) {
      console.error("Error setting recovery code:", updateError)
      return NextResponse.json({ error: "Erro ao gerar código de segurança" }, { status: 500 })
    }

    // Send Email
    await sendFinancialPasswordResetCode(profile.email, code)

    // Audit Log
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1"
    await serviceSupabase
      .from("financial_audit_logs")
      .insert({
        tenant_id: tenantId,
        user_id: user.id,
        action: "Solicitação de recuperação de senha financeira",
        ip_address: ip
      })

    return NextResponse.json({
      success: true,
      message: `Código de redefinição enviado para o e-mail ${profile.email.replace(/(.{3})(.*)(@.*)/, "$1***$3")}`
    })
  } catch (error: any) {
    console.error("POST financial recovery error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// 2. PUT: Validate code and reset password
export async function PUT(req: Request) {
  try {
    const context = await getAuthContext(req)
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { user, profile, tenantId, serviceSupabase } = context
    const { code, newPassword, confirmPassword } = await req.json()

    if (!code || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "As senhas não coincidem" }, { status: 400 })
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

    // Fetch recovery
    const { data: fp, error: fetchError } = await serviceSupabase
      .from("financial_passwords")
      .select("*")
      .eq("tenant_id", tenantId)
      .single()

    if (fetchError || !fp) {
      return NextResponse.json({ error: "Configuração de senha não encontrada" }, { status: 404 })
    }

    if (!fp.recovery_code) {
      return NextResponse.json({ error: "Nenhum código de recuperação foi gerado" }, { status: 400 })
    }

    // Check code
    if (fp.recovery_code.trim() !== code.trim()) {
      return NextResponse.json({ error: "Código de segurança incorreto" }, { status: 400 })
    }

    // Check expiration
    if (Date.now() > new Date(fp.recovery_expires_at).getTime()) {
      return NextResponse.json({ error: "Código de segurança expirado. Solicite outro." }, { status: 400 })
    }

    // Hash and update
    const passwordHash = await hashPassword(newPassword)
    const { error: resetError } = await serviceSupabase
      .from("financial_passwords")
      .update({
        password_hash: passwordHash,
        recovery_code: null,
        recovery_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq("tenant_id", tenantId)

    if (resetError) {
      console.error("Error resetting password:", resetError)
      return NextResponse.json({ error: "Erro ao resetar senha financeira" }, { status: 500 })
    }

    // Audit Log
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1"
    await serviceSupabase
      .from("financial_audit_logs")
      .insert({
        tenant_id: tenantId,
        user_id: user.id,
        action: "Redefinição de senha financeira via código",
        ip_address: ip
      })

    // System Notification
    await serviceSupabase
      .from("notifications")
      .insert({
        user_id: user.id,
        company_id: tenantId,
        type: "security",
        title: "🔐 Senha Financeira Redefinida",
        message: "Sua senha financeira foi alterada com sucesso através de redefinição por código.",
        read: false
      })

    // Email Alert
    if (profile.email) {
      try {
        await sendFinancialSecurityAlert(profile.email, "Redefinição de Senha Financeira", ip)
      } catch (mailErr) {
        console.error("Alert email failed:", mailErr)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("PUT financial recovery error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
