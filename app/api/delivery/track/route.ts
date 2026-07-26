import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const { orderId, deliveryPersonId, latitude, longitude, speed, heading, isMocked } = await req.json()

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

    // Append to driver_locations for history & audit
    if (deliveryPersonId) {
      const { error: locErr } = await supabaseAdmin
        .from('driver_locations')
        .insert({
          driver_id: deliveryPersonId,
          latitude: Number(latitude),
          longitude: Number(longitude),
          speed: speed !== undefined && speed !== null ? Number(speed) : null,
          heading: heading !== undefined && heading !== null ? Number(heading) : null,
          is_mocked: isMocked === true
        })
      if (locErr) {
        console.error('Error logging to driver_locations:', locErr)
      }
    }

    // Calculate dynamic ETA and remaining distance via OSRM or Haversine fallback
    try {
      const driverLat = Number(latitude)
      const driverLng = Number(longitude)

      const { data: orderData, error: orderErr } = await supabaseAdmin
        .from('orders')
        .select('latitude, longitude, payment_method, payment_status, delivery_type')
        .eq('id', orderId)
        .single()

      if (orderErr) {
        console.error('Error fetching order coordinates:', orderErr)
      } else if (orderData && orderData.latitude && orderData.longitude) {
        const destLat = Number(orderData.latitude)
        const destLng = Number(orderData.longitude)
        
        let distanceKm = 0
        let durationMin = 0
        let success = false

        try {
          const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${driverLng},${driverLat};${destLng},${destLat}?overview=false`
          const osrmRes = await fetch(osrmUrl)
          if (osrmRes.ok) {
            const osrmData = await osrmRes.json()
            if (osrmData.routes && osrmData.routes.length > 0) {
              const route = osrmData.routes[0]
              distanceKm = route.distance / 1000
              durationMin = route.duration / 60
              success = true
            }
          }
        } catch (err) {
          console.error('OSRM API routing failed, falling back to Haversine:', err)
        }

        if (!success || distanceKm === 0) {
          // Haversine fallback
          const R = 6371
          const dLat = (destLat - driverLat) * Math.PI / 180
          const dLon = (destLng - driverLng) * Math.PI / 180
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(driverLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2)
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
          distanceKm = R * c
          durationMin = (distanceKm / 30) * 60 // 30 km/h avg speed
        }

        // Round and save
        const roundedDistance = Number(distanceKm.toFixed(2))
        const roundedDuration = Math.ceil(durationMin)

        await supabaseAdmin
          .from('orders')
          .update({
            remaining_distance_km: roundedDistance,
            remaining_duration_min: roundedDuration
          })
          .eq('id', orderId)

        await supabaseAdmin
          .from('delivery_tracking')
          .update({
            remaining_distance_km: roundedDistance,
            remaining_duration_min: roundedDuration
          })
          .eq('order_id', orderId)

        // Insert into delivery_audit_logs
        await supabaseAdmin
          .from('delivery_audit_logs')
          .insert({
            pedido_id: orderId,
            timezone: 'America/Sao_Paulo',
            latitude: driverLat,
            longitude: driverLng,
            payment_method: orderData.payment_method || 'DINHEIRO',
            payment_status: orderData.payment_status || 'PENDENTE',
            delivery_type: orderData.delivery_type || 'DELIVERY',
            driver_id: deliveryPersonId || null,
            distance: roundedDistance,
            eta: roundedDuration
          })
      }
    } catch (err) {
      console.error('Failed calculating dynamic route metrics:', err)
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Delivery tracking API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
