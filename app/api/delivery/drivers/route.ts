import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const { name, email, phone, whatsapp, cpf, password, vehicle, plate, photo, company_id } = await req.json()

    if (!name || !email || !password || !company_id) {
      return NextResponse.json({ error: 'Faltam campos obrigatórios (nome, email, senha, company_id)' }, { status: 400 })
    }

    // 1. Create the user in Supabase Auth via admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'delivery_driver',
        name,
        phone
      }
    })

    if (authError || !authData.user) {
      console.error('Error creating driver auth:', authError)
      return NextResponse.json({ error: authError?.message || 'Erro ao criar autenticação do entregador' }, { status: 500 })
    }

    const userId = authData.user.id

    // 2. Create the profile in profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email,
        role: 'delivery_driver',
        company_id,
        tenant_id: company_id
      })

    if (profileError) {
      console.error('Error creating driver profile:', profileError)
      // Rollback auth creation if profile fails
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // 3. Create record in delivery_drivers
    const { data: driverData, error: driverError } = await supabaseAdmin
      .from('delivery_drivers')
      .insert({
        id: userId,
        name,
        email,
        phone,
        whatsapp,
        cpf,
        photo,
        vehicle,
        plate,
        status: 'offline',
        company_id,
        tenant_id: company_id
      })
      .select()
      .single()

    if (driverError) {
      console.error('Error inserting delivery driver:', driverError)
      // Rollback auth and profile
      await supabaseAdmin.from('profiles').delete().eq('id', userId)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: driverError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, driver: driverData })
  } catch (error: any) {
    console.error('Driver creation API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const driverId = searchParams.get('id')

    if (!driverId) {
      return NextResponse.json({ error: 'ID do entregador é obrigatório' }, { status: 400 })
    }

    // 1. Delete driver from Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(driverId)
    if (authError) {
      console.error('Error deleting driver auth:', authError)
      // If user not found in auth, we can still proceed to clean tables
    }

    // 2. Delete driver profile (should cascade or be deleted manually)
    await supabaseAdmin.from('profiles').delete().eq('id', driverId)

    // 3. Delete from delivery_drivers
    const { error: driverError } = await supabaseAdmin
      .from('delivery_drivers')
      .delete()
      .eq('id', driverId)

    if (driverError) {
      console.error('Error deleting delivery driver record:', driverError)
      return NextResponse.json({ error: driverError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Driver deletion API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
