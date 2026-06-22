import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getServerUser } from '@/lib/supabaseAuth'

export async function PUT(request: Request) {
  try {
    const user = await getServerUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { company_id, ...settings } = body

    if (!company_id) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('digital_menu_settings')
      .upsert({
        ...settings,
        company_id,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, updatedDesign: data })
  } catch (error: any) {
    console.error('Error saving design:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
