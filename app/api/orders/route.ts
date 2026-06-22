import { NextResponse } from "next/server"
import { createOrder } from "@/lib/createOrder"
import { getServerUser } from "@/lib/supabaseAuth"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Identifica o tenant real se houver sessão
    let effectiveTenantId = body.tenant_id
    const user = await getServerUser()
    
    if (user) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()
      
      if (profile?.tenant_id && profile.tenant_id !== '00000000-0000-0000-0000-000000000000') {
        effectiveTenantId = profile.tenant_id
      }
    }

    const data = {
      ...body,
      tenant_id: effectiveTenantId
    }

    // Verify if cash register is open
    const { data: openRegister, error: registerErr } = await supabaseAdmin
      .from('cash_registers')
      .select('id')
      .eq('company_id', effectiveTenantId)
      .eq('status', 'open')
      .limit(1)
      .maybeSingle()

    if (registerErr || !openRegister) {
      return NextResponse.json({ 
        error: 'O caixa deste estabelecimento está FECHADO. Não é possível registrar pedidos no momento.' 
      }, { status: 400 })
    }

    const result = await createOrder(data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error("API ERROR:", error)

    return NextResponse.json(
      { error: "Erro interno ao processar pedido" },
      { status: 500 }
    )
  }
}
