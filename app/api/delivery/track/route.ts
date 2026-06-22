import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const { orderId, deliveryPersonId, latitude, longitude, speed, heading } = await req.json()

    if (!orderId || !latitude || !longitude) {
      return NextResponse.json({ error: 'Missing required fields (orderId, latitude, longitude)' }, { status: 400 })
    }

    // Upsert the tracking location for the active order with dynamic fallback
    const upsertPayload: any = {
      latitude: Number(latitude),
      longitude: Number(longitude),
      updated_at: new Date().toISOString()
    }

    let { data, error } = await supabaseAdmin
      .from('delivery_tracking')
      .upsert({
        ...upsertPayload,
        order_id: orderId,
        pedido_id: orderId,
        delivery_person_id: deliveryPersonId || null,
        entregador_id: deliveryPersonId || null,
        speed: speed !== undefined && speed !== null ? Number(speed) : null,
        velocidade: speed !== undefined && speed !== null ? Number(speed) : null,
        heading: heading !== undefined && heading !== null ? Number(heading) : null,
        direcao: heading !== undefined && heading !== null ? Number(heading) : null
      }, { onConflict: 'order_id' })
      .select()
      .single()

    if (error) {
      console.log('⚠️ Full upsert failed, trying with English columns only:', error.message);
      const fallbackResult = await supabaseAdmin
        .from('delivery_tracking')
        .upsert({
          ...upsertPayload,
          order_id: orderId,
          delivery_person_id: deliveryPersonId || null,
          speed: speed !== undefined && speed !== null ? Number(speed) : null,
          heading: heading !== undefined && heading !== null ? Number(heading) : null
        }, { onConflict: 'order_id' })
        .select()
        .single()
      data = fallbackResult.data
      error = fallbackResult.error
    }

    if (error) {
      console.error('Error upserting delivery tracking:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Delivery tracking API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
