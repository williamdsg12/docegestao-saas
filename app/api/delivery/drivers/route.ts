import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const { name, email, phone, whatsapp, cpf, password, vehicle, plate, photo, company_id } = await req.json()

    if (!name || !email || !password || !company_id) {
      return NextResponse.json({ error: 'Faltam campos obrigatórios (nome, email, senha, company_id)' }, { status: 400 })
    }

    const searchEmail = email.trim().toLowerCase()

    // 1. Check if driver already exists in delivery_drivers
    const { data: existingDriver } = await supabaseAdmin
      .from('delivery_drivers')
      .select('id')
      .eq('email', searchEmail)
      .maybeSingle()

    if (existingDriver) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado no sistema.' }, { status: 400 })
    }

    // 2. Check if profile already exists in profiles table
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', searchEmail)
      .maybeSingle()

    let userId = existingProfile?.id
    let isNewUser = !existingProfile

    if (!userId) {
      // Try to create the user in Supabase Auth via admin client
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

      if (authError) {
        console.error('Error creating driver auth:', authError)
        const msg = authError.message || ''
        if (msg.includes('already been registered') || msg.includes('already registered') || msg.includes('exists')) {
          // Find existing user in auth to associate
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
          const foundAuthUser = listData?.users?.find(u => u.email?.toLowerCase() === searchEmail)
          if (foundAuthUser) {
            userId = foundAuthUser.id
            isNewUser = false
            // Create missing profile
            await supabaseAdmin.from('profiles').insert({
              id: userId,
              email: searchEmail,
              role: 'delivery_driver',
              company_id,
              tenant_id: company_id
            })
          } else {
            return NextResponse.json({ error: 'Este e-mail já está cadastrado no sistema.' }, { status: 400 })
          }
        } else {
          return NextResponse.json({ error: authError.message || 'Erro ao criar autenticação do entregador' }, { status: 500 })
        }
      } else if (authData?.user) {
        userId = authData.user.id
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Erro ao identificar ou criar o ID do usuário.' }, { status: 500 })
    }

    if (isNewUser) {
      // Create the profile in profiles table
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email: searchEmail,
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
    }

    // 3. Create record in delivery_drivers
    const { data: driverData, error: driverError } = await supabaseAdmin
      .from('delivery_drivers')
      .insert({
        id: userId,
        name,
        email: searchEmail,
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
      // Rollback auth and profile only if it's a completely new user
      if (isNewUser) {
        await supabaseAdmin.from('profiles').delete().eq('id', userId)
        await supabaseAdmin.auth.admin.deleteUser(userId)
      }
      const driverMsg = driverError.message || ''
      if (driverMsg.includes('unique') || driverMsg.includes('key') || driverMsg.includes('duplicate')) {
        return NextResponse.json({ error: 'Este e-mail já está cadastrado no sistema.' }, { status: 400 })
      }
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
