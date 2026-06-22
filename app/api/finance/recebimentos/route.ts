import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { encrypt, decrypt, verifyFinanceSessionToken } from "@/lib/crypto-helper"
import { sendFinancialSecurityAlert } from "@/lib/email-service"

export const dynamic = "force-dynamic"

// Helper to authenticate user and check financial session
async function getAuthContext(req: Request) {
  const authHeader = req.headers.get("Authorization")
  const sessionToken = req.headers.get("x-finance-session")
  
  if (!authHeader) {
    return { status: 401, error: "Unauthorized" }
  }

  const token = authHeader.replace("Bearer ", "")
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) {
    return { status: 401, error: "Unauthorized" }
  }

  // Fetch profile via service client for reliability
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

  if (!profile) {
    return { status: 401, error: "Perfil não encontrado" }
  }

  const tenantId = profile.tenant_id || profile.company_id
  if (!tenantId) {
    return { status: 400, error: "Tenant ID não configurado no perfil" }
  }

  // Check Financial Session Token
  if (!sessionToken) {
    return { status: 403, error: "FINANCE_LOCKED", message: "Sessão financeira exigida" }
  }

  const decodedSession = verifyFinanceSessionToken(sessionToken)
  if (!decodedSession || decodedSession.tenantId !== tenantId) {
    return { status: 403, error: "FINANCE_LOCKED", message: "Sessão financeira expirada ou inválida" }
  }

  return { user, profile, tenantId, serviceSupabase }
}

// 1. GET: Fetch all receivables and security configuration
export async function GET(req: Request) {
  try {
    const context = await getAuthContext(req)
    if ("error" in context) {
      if (context.error === "FINANCE_LOCKED") {
        return NextResponse.json({ error: context.error, message: context.message }, { status: 403 })
      }
      return NextResponse.json({ error: context.error }, { status: context.status as number })
    }

    const { tenantId, serviceSupabase } = context

    // Fetch PIX accounts
    const { data: pixAccounts } = await serviceSupabase
      .from("pix_accounts")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })

    // Fetch bank accounts
    const { data: bankAccounts } = await serviceSupabase
      .from("bank_accounts")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })

    // Fetch card settings
    let { data: cardSettings } = await serviceSupabase
      .from("card_payment_settings")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle()

    // If none exists, create default card settings object
    if (!cardSettings) {
      cardSettings = {
        accept_credit: true,
        accept_debit: true,
        max_installments: 12,
        installment_interest: 0,
        min_installment_value: 5.0,
        accepted_brands: ["visa", "mastercard", "elo", "hipercard", "amex"]
      }
    }

    // Fetch payment gateways
    const { data: rawGateways } = await serviceSupabase
      .from("gateway_accounts")
      .select("*")
      .eq("tenant_id", tenantId)

    // Mask secret keys before sending to client
    const gateways = (rawGateways || []).map((gw: any) => ({
      ...gw,
      secret_key: gw.secret_key ? "••••••••" : ""
    }))

    // Fetch audit logs
    const { data: auditLogs } = await serviceSupabase
      .from("financial_audit_logs")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(50)

    return NextResponse.json({
      pixAccounts: pixAccounts || [],
      bankAccounts: bankAccounts || [],
      cardSettings,
      gateways,
      auditLogs: auditLogs || []
    })
  } catch (error: any) {
    console.error("GET receivables error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// 2. POST: Insert or Update specific config blocks
export async function POST(req: Request) {
  try {
    const context = await getAuthContext(req)
    if ("error" in context) {
      if (context.error === "FINANCE_LOCKED") {
        return NextResponse.json({ error: context.error, message: context.message }, { status: 403 })
      }
      return NextResponse.json({ error: context.error }, { status: context.status as number })
    }

    const { user, profile, tenantId, serviceSupabase } = context
    const { type, data } = await req.json()

    if (!type || !data) {
      return NextResponse.json({ error: "Dados incompletos para gravação" }, { status: 400 })
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1"
    let auditAction = ""

    if (type === "pix") {
      const { id, receiver_name, document, pix_type, pix_key, bank_name, is_active } = data
      
      if (!receiver_name || !document || !pix_type || !pix_key || !bank_name) {
        return NextResponse.json({ error: "Dados obrigatórios do PIX ausentes" }, { status: 400 })
      }

      if (id) {
        // Update
        const { error } = await serviceSupabase
          .from("pix_accounts")
          .update({ receiver_name, document, pix_type, pix_key, bank_name, is_active, updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("tenant_id", tenantId)

        if (error) throw error
        auditAction = `Atualização da chave PIX (${pix_key})`
      } else {
        // Insert
        const { error } = await serviceSupabase
          .from("pix_accounts")
          .insert({ tenant_id: tenantId, receiver_name, document, pix_type, pix_key, bank_name, is_active })

        if (error) throw error
        auditAction = `Cadastro de nova chave PIX (${pix_key})`
      }

    } else if (type === "bank") {
      const { id, bank_name, agency, account_number, account_type, holder_name, holder_document, ispb, is_default } = data

      if (!bank_name || !agency || !account_number || !account_type || !holder_name || !holder_document) {
        return NextResponse.json({ error: "Dados bancários obrigatórios ausentes" }, { status: 400 })
      }

      // If this account is default, reset others first
      if (is_default) {
        await serviceSupabase
          .from("bank_accounts")
          .update({ is_default: false })
          .eq("tenant_id", tenantId)
      }

      if (id) {
        // Update
        const { error } = await serviceSupabase
          .from("bank_accounts")
          .update({ bank_name, agency, account_number, account_type, holder_name, holder_document, ispb, is_default, updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("tenant_id", tenantId)

        if (error) throw error
        auditAction = `Atualização de conta bancária (${bank_name} - Ag: ${agency} / CC: ${account_number})`
      } else {
        // Insert
        const { error } = await serviceSupabase
          .from("bank_accounts")
          .insert({ tenant_id: tenantId, bank_name, agency, account_number, account_type, holder_name, holder_document, ispb, is_default })

        if (error) throw error
        auditAction = `Cadastro de nova conta bancária (${bank_name} - Ag: ${agency} / CC: ${account_number})`
      }

    } else if (type === "card") {
      const { accept_credit, accept_debit, max_installments, installment_interest, min_installment_value, accepted_brands } = data

      const { error } = await serviceSupabase
        .from("card_payment_settings")
        .upsert({
          tenant_id: tenantId,
          accept_credit,
          accept_debit,
          max_installments,
          installment_interest,
          min_installment_value,
          accepted_brands,
          updated_at: new Date().toISOString()
        }, { onConflict: "tenant_id" })

      if (error) throw error
      auditAction = "Alteração de juros/bandeiras das configurações de Cartão"

    } else if (type === "gateway") {
      const { gateway_name, public_key, secret_key, webhook_url, is_active, environment } = data

      if (!gateway_name) {
        return NextResponse.json({ error: "Nome do gateway é obrigatório" }, { status: 400 })
      }

      // Check if gateway config already exists
      const { data: existing } = await serviceSupabase
        .from("gateway_accounts")
        .select("secret_key")
        .eq("tenant_id", tenantId)
        .eq("gateway_name", gateway_name)
        .maybeSingle()

      let finalSecret = existing?.secret_key || ""

      if (secret_key && secret_key !== "••••••••") {
        // Encrypt the new secret key
        finalSecret = encrypt(secret_key)
      }

      const { error } = await serviceSupabase
        .from("gateway_accounts")
        .upsert({
          tenant_id: tenantId,
          gateway_name,
          public_key,
          secret_key: finalSecret,
          webhook_url,
          is_active,
          environment,
          updated_at: new Date().toISOString()
        }, { onConflict: "tenant_id,gateway_name" })

      if (error) throw error
      auditAction = `Alteração do gateway de pagamento (${gateway_name})`

    } else {
      return NextResponse.json({ error: "Tipo de operação desconhecida" }, { status: 400 })
    }

    // Save Audit Log
    await serviceSupabase
      .from("financial_audit_logs")
      .insert({
        tenant_id: tenantId,
        user_id: user.id,
        action: auditAction,
        ip_address: ip
      })

    // System Notification
    await serviceSupabase
      .from("notifications")
      .insert({
        user_id: user.id,
        company_id: tenantId,
        type: "security",
        title: "⚠️ Alteração Financeira Realizada",
        message: `${auditAction}.`,
        read: false
      })

    // Email Alert
    if (profile.email) {
      try {
        await sendFinancialSecurityAlert(profile.email, auditAction, ip)
      } catch (mailErr) {
        console.error("Alert email failed:", mailErr)
      }
    }

    return NextResponse.json({ success: true, action: auditAction })
  } catch (error: any) {
    console.error("POST receivables update error:", error)
    return NextResponse.json({ error: error.message || "Erro ao processar gravação" }, { status: 500 })
  }
}
