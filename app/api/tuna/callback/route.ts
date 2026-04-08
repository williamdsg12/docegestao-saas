import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getServerUser } from "@/lib/supabaseAuth"

export async function GET(req: Request) {
  const { ensureHttps } = await import('@/lib/stripe-helpers');
  const appUrl = ensureHttps(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
  
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get("code")
    const tenantId = searchParams.get("state") // State contains tenant_id

    if (!code || !tenantId) {
      console.error("[TUNA_CALLBACK_MISSING_PARAMS]", { code: !!code, tenantId: !!tenantId })
      return NextResponse.redirect(`${appUrl}/dashboard/financeiro/pagamentos?error=missing_params`)
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Double check authentication (Optional but recommended)
    const user = await getServerUser()
    if (!user) {
      return NextResponse.redirect(`${appUrl}/login?error=unauthorized`)
    }

    // 2. Exchange Code for Tokens with Tuna
    // IMPORTANT: In a real scenario, use the actual Tuna Auth production endpoint
    const tokenRes = await fetch("https://api.tuna.com.br/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        client_id: process.env.TUNA_CLIENT_ID,
        client_secret: process.env.TUNA_CLIENT_SECRET,
        redirect_uri: process.env.TUNA_REDIRECT_URI
      })
    })

    const data = await tokenRes.json()

    if (!tokenRes.ok) {
      console.error("[TUNA_TOKEN_ERROR]", data)
      // For development, if we don't have real keys, we might want to simulate success?
      // No, let's keep it real but handle the error gracefully.
      return NextResponse.redirect(`${appUrl}/dashboard/financeiro/pagamentos?error=token_failed`)
    }

    // 3. Upsert into tuna_accounts table
    // Column names matched with migrations and TunaSettings.tsx
    const { error: dbError } = await supabase.from("tuna_accounts").upsert({
      tenant_id: tenantId,
      tuna_account_id: data.account_id,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      connected: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'tenant_id' })

    if (dbError) {
      console.error("[TUNA_DB_ERROR]", dbError)
      throw dbError
    }

    return NextResponse.redirect(`${appUrl}/dashboard/financeiro/pagamentos?success=tuna_connected`)

  } catch (error: any) {
    console.error("[TUNA_CALLBACK_INTERNAL_ERROR]", error)
    return NextResponse.redirect(`${appUrl}/dashboard/financeiro/pagamentos?error=internal_error`)
  }
}
