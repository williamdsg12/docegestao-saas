/** API Route for Customers - Refactored */
import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { normalizePhone } from '@/lib/formatters'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')
    const storeId = searchParams.get('storeId') 

    if (!phone) {
      return NextResponse.json(null)
    }

    const normalizedPhone = normalizePhone(phone)
    if (normalizedPhone.length < 10) {
      console.log('Busca cancelada: Telefone normalizado com menos de 10 dígitos:', normalizedPhone)
      return NextResponse.json(null)
    }

    console.log('--- BUSCA DE CLIENTE NO CHECKOUT (API GET) ---')
    console.log('Telefone digitado:', phone)
    console.log('Telefone normalizado:', normalizedPhone)
    console.log('Tabela consultada: customers')
    console.log('Query executada: select * from customers where telefone_normalizado = ? and tenant_id = ?')
    console.log('Parâmetros:', { telefone_normalizado: normalizedPhone, tenant_id: storeId })

    let query = supabase
      .from('customers')
      .select(`
        *,
        addresses (
          *
        ),
        orders (
          id,
          total,
          status:order_status,
          created_at,
          notes
        )
      `)
      .eq('telefone_normalizado', normalizedPhone)
      .is('deleted_at', null)

    if (storeId) {
      query = query.eq('tenant_id', storeId)
    }

    // Sort by created_at DESC to get the most recent registration first
    query = query.order('created_at', { ascending: false })

    // Limit to 2 to check for duplication/inconsistency
    const { data: customers, error } = await query.limit(2)

    if (error) {
      console.error('Erro retornado na busca:', error)
      throw error
    }

    console.log('Resultado retornado (customers):', customers)

    let customer = null
    if (customers && customers.length > 0) {
      const dbCust = customers[0]
      const addresses = dbCust.addresses || []
      // Synthesis fallback for backward compatibility
      if (addresses.length === 0 && (dbCust.address || dbCust.cep)) {
        addresses.push({
          id: 'synthetic-addr',
          zip: dbCust.cep,
          street: dbCust.address,
          number: dbCust.number,
          neighborhood: dbCust.neighborhood,
          city: dbCust.city,
          state: dbCust.state,
          complement: dbCust.complement,
          reference: dbCust.reference_point
        })
      }

      customer = {
        ...dbCust,
        addresses,
        has_duplicate_inconsistency: customers.length > 1
      }
    } else {
      // Fallback to legacy 'clientes' table
      let cliQuery = supabase
        .from('clientes')
        .select('*')
        .eq('telefone_normalizado', normalizedPhone)

      if (storeId) {
        cliQuery = cliQuery.eq('company_id', storeId)
      }

      const { data: legacyClients } = await cliQuery.order('created_at', { ascending: false }).limit(2)
      if (legacyClients && legacyClients.length > 0) {
        customer = {
          id: legacyClients[0].id,
          tenant_id: legacyClients[0].company_id,
          name: legacyClients[0].name,
          phone: legacyClients[0].phone,
          email: legacyClients[0].email || '',
          addresses: [],
          orders: [],
          is_legacy: true,
          has_duplicate_inconsistency: legacyClients.length > 1
        }
      }
    }

    console.log('Cliente encontrado:', customer)
    return NextResponse.json(customer)
  } catch (error: any) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const phone = body.phone
    const tenantId = body.storeId || body.tenantId

    if (!phone || !body.name || !tenantId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone)

    // Check if customer exists to log correctly
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('telefone_normalizado', normalizedPhone)
      .is('deleted_at', null)
      .maybeSingle()

    if (existing) {
      console.log('Atualizando cliente...')
    } else {
      console.log('Criando cliente...')
    }

    const payload = {
      tenant_id: tenantId,
      name: body.name,
      full_name: body.name,
      phone: body.phone,
      telefone_normalizado: normalizedPhone,
      email: body.email || null,
      cpf_cnpj: body.cpf_cnpj || body.cpf || body.taxId || null,
      cep: body.address?.cep || body.address?.zip || body.cep || null,
      address: body.address?.street || (typeof body.address === 'string' ? body.address : null),
      number: body.address?.number || body.number || null,
      neighborhood: body.address?.neighborhood || body.neighborhood || null,
      city: body.address?.city || body.city || null,
      state: body.address?.state || body.state || null,
      complement: body.address?.complement || body.complement || null,
      reference_point: body.address?.reference_point || body.address?.reference || body.reference_point || body.reference || null,
      deleted_at: null,
      updated_at: new Date().toISOString()
    }

    console.log('Telefone original:', phone)
    console.log('Telefone normalizado:', normalizedPhone)
    console.log('Dados enviados:', payload)

    // 1. Create or Find Customer - Save fields directly in public.customers
    const response = await supabase
      .from('customers')
      .upsert(payload, { onConflict: 'tenant_id, telefone_normalizado' })
      .select()
      .single()

    console.log('Resultado do upsert:', response)

    const { data: customer, error: customerError } = response

    if (customerError) {
      console.error('ERRO SQL COMPLETO NO UPSERT DE CLIENTE:', customerError)
      throw customerError
    }

    // 2. Create Address if provided (backward compatibility relation)
    if (body.address && body.address.street) {
      const { error: addressError } = await supabase
        .from('addresses')
        .insert({
          tenant_id: tenantId,
          customer_id: customer.id,
          zip: body.address.cep || body.address.zip || null,
          street: body.address.street,
          number: body.address.number || null,
          neighborhood: body.address.neighborhood || null,
          city: body.address.city || null,
          state: body.address.state || null,
          complement: body.address.complement || null,
          reference: body.address.reference || body.address.reference_point || null
        })

      if (addressError) console.error('Error saving customer address:', addressError)
    }

    // Fetch the fully populated customer (including addresses and orders) to return
    const { data: populatedCustomer } = await supabase
      .from('customers')
      .select(`
        *,
        addresses (
          *
        ),
        orders (
          id,
          total,
          status:order_status,
          created_at,
          notes
        )
      `)
      .eq('id', customer.id)
      .single()

    const finalCustomer = populatedCustomer || customer

    console.log('Cliente salvo com sucesso')
    return NextResponse.json(finalCustomer, { status: 201 })
  } catch (error: any) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
