import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request) {
  try {
    const { company_id, table_number, type } = await req.json()

    if (!company_id || !table_number) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('restaurant_table_calls')
      .insert({
        company_id,
        table_number: String(table_number),
        type: type || 'call',
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating table call:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error("API ERROR:", error)
    return NextResponse.json(
      { error: "Erro interno ao processar chamada" },
      { status: 500 }
    )
  }
}
