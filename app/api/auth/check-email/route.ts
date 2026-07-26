import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 })
    }

    const searchEmail = email.trim().toLowerCase()

    // 1. Check in profiles
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', searchEmail)
      .maybeSingle()

    if (profile) {
      return NextResponse.json({ exists: true })
    }

    // 2. Check in delivery_drivers
    const { data: driver } = await supabaseAdmin
      .from('delivery_drivers')
      .select('id')
      .eq('email', searchEmail)
      .maybeSingle()

    if (driver) {
      return NextResponse.json({ exists: true })
    }

    // 3. Double check in auth.users by listing users to verify
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
    const foundAuthUser = listData?.users?.find(u => u.email?.toLowerCase() === searchEmail)
    if (foundAuthUser) {
      return NextResponse.json({ exists: true })
    }

    return NextResponse.json({ exists: false })
  } catch (error: any) {
    console.error('Check email API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
