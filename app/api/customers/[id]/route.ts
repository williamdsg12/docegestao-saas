/** API Route for Customer Detail - Refactored */
import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updates: any = {}
    if (body.name !== undefined) {
      updates.name = body.name
      updates.full_name = body.name
    }
    if (body.full_name !== undefined) updates.full_name = body.full_name
    if (body.email !== undefined) updates.email = body.email
    if (body.phone !== undefined) updates.phone = body.phone.replace(/\D/g, '')
    if (body.cpf_cnpj !== undefined) updates.cpf_cnpj = body.cpf_cnpj
    if (body.is_vip !== undefined) updates.is_vip = body.is_vip
    if (body.birthday !== undefined) updates.birthday = body.birthday

    if (body.newAddress) {
      const { error: addressError } = await supabase
        .from('addresses')
        .insert({
          customer_id: id,
          tenant_id: body.tenantId,
          zip: body.newAddress.cep || body.newAddress.zip,
          street: body.newAddress.street,
          number: body.newAddress.number,
          neighborhood: body.newAddress.neighborhood,
          city: body.newAddress.city,
          state: body.newAddress.state,
          complement: body.newAddress.complement || null,
          reference: body.newAddress.reference || body.newAddress.reference_point || null
        })

      if (addressError) throw addressError

      // Sync address fields to the customer record as well
      updates.cep = body.newAddress.cep || body.newAddress.zip
      updates.address = body.newAddress.street
      updates.number = body.newAddress.number
      updates.neighborhood = body.newAddress.neighborhood
      updates.city = body.newAddress.city
      updates.state = body.newAddress.state
      updates.complement = body.newAddress.complement || null
      updates.reference_point = body.newAddress.reference || body.newAddress.reference_point || null
    } else {
      // Direct address updates
      if (body.cep !== undefined) updates.cep = body.cep
      if (body.address !== undefined) updates.address = body.address
      if (body.number !== undefined) updates.number = body.number
      if (body.neighborhood !== undefined) updates.neighborhood = body.neighborhood
      if (body.city !== undefined) updates.city = body.city
      if (body.state !== undefined) updates.state = body.state
      if (body.complement !== undefined) updates.complement = body.complement
      if (body.reference_point !== undefined) updates.reference_point = body.reference_point
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString()
      const { error: updateError } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)

      if (updateError) throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await supabase
      .from('customers')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
