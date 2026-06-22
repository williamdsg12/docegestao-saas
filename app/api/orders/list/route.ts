import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getServerUser } from '@/lib/supabaseAuth'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tenant_id = searchParams.get('tenant_id')
    
    let effectiveTenantId = tenant_id
    const user = await getServerUser()
    
    if (user) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()
      
      if (profile?.tenant_id) {
        effectiveTenantId = profile.tenant_id
      }
    }

    if (!effectiveTenantId) {
      return NextResponse.json({ error: 'Tenant não identificado' }, { status: 400 })
    }

    const todayStart = startOfDay(new Date()).toISOString()
    const todayEnd = endOfDay(new Date()).toISOString()

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        customers!customer_id(name, phone),
        addresses(street, number, neighborhood, city, zip),
        order_items(*)
      `)
      .eq('tenant_id', effectiveTenantId)
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, orders })

  } catch (error: any) {
    console.error('API Order List Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
