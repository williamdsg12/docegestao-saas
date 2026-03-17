import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * API to group orders by neighborhood radius
 * POST /api/logistics/optimize
 */
export async function POST(req: Request) {
  try {
    const { companyId, radiusKm = 5 } = await req.json()

    if (!companyId) {
      return NextResponse.json({ error: 'Missing companyId' }, { status: 400 })
    }

    // 1. Fetch all pending/confirmed orders that are not yet in delivery
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('pedidos')
      .select('id, endereco_entrega, lat, lng')
      .eq('company_id', companyId)
      .in('status', ['confirmado', 'pronto'])
      .is('entregador_id', null)

    if (ordersError) throw ordersError
    if (!orders || orders.length === 0) {
      return NextResponse.json({ groups: [], message: 'No orders to optimize' })
    }

    // 2. Simple Radius Clustering Logic
    // In a real production app, we would use a more complex algorithm (K-Means, VRPTW)
    // Here we group orders that are within 'radiusKm' of each other
    const groups: any[] = []
    const visited = new Set<string>()

    for (const order of orders) {
      if (visited.has(order.id) || !order.lat || !order.lng) continue

      const currentGroup = [order]
      visited.add(order.id)

      for (const other of orders) {
        if (visited.has(other.id) || !other.lat || !other.lng) continue

        const dist = calculateDistance(
          Number(order.lat), Number(order.lng),
          Number(other.lat), Number(other.lng)
        )

        if (dist <= radiusKm) {
          currentGroup.push(other)
          visited.add(other.id)
        }
      }

      groups.push({
        center: { lat: order.lat, lng: order.lng },
        orders: currentGroup,
        suggestedRadius: radiusKm
      })
    }

    return NextResponse.json({ groups })

  } catch (error: any) {
    console.error("Route Optimization Error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Haversine formula to calculate distance between two points in KM
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c
  return d
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180)
}
