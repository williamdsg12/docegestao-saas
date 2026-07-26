import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { address } = await req.json()

    if (!address) {
      return NextResponse.json({ error: 'Endereço é obrigatório' }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || 
                   process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || 
                   process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 
                   ""

    let lat: number | null = null
    let lng: number | null = null
    let formattedAddress = address
    let accuracy = 'approximate'
    let apiUsed = ''

    if (apiKey) {
      // 1. Try Google Maps Geocoding API
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
        const res = await fetch(url)
        const data = await res.json()

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const result = data.results[0]
          lat = result.geometry.location.lat
          lng = result.geometry.location.lng
          formattedAddress = result.formatted_address
          accuracy = result.geometry.location_type || 'google_geocoded'
          apiUsed = 'google'
        } else {
          console.warn("Google Geocoding failed, status:", data.status)
        }
      } catch (err) {
        console.error("Error calling Google Geocoding API:", err)
      }
    }

    // 2. Fallback to OpenStreetMap Nominatim if Google didn't return results
    if (lat === null || lng === null) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'DoceGestaoGeocodingSystem/1.0'
          }
        })
        const data = await res.json()

        if (data && data.length > 0) {
          lat = parseFloat(data[0].lat)
          lng = parseFloat(data[0].lon)
          formattedAddress = data[0].display_name
          accuracy = 'nominatim_geocoded'
          apiUsed = 'nominatim'
        }
      } catch (err) {
        console.error("Error calling Nominatim Geocoding API:", err)
      }
    }

    if (lat === null || lng === null) {
      return NextResponse.json({ success: false, error: 'Não foi possível geocodificar o endereço' }, { status: 400 })
    }

    // Monitoramento / Logs
    console.log(`[GEOCODING LOG] API: ${apiUsed} | Endereço: ${address} | Lat: ${lat} | Lng: ${lng} | Accuracy: ${accuracy}`)

    return NextResponse.json({
      success: true,
      latitude: lat,
      longitude: lng,
      formatted_address: formattedAddress,
      location_accuracy: accuracy,
      api_used: apiUsed
    })
  } catch (error: any) {
    console.error('Geocode route error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
