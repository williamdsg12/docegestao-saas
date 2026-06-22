"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix default Leaflet icon paths for safety
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
})

interface LiveTrackingMapProps {
  customerAddress: string
  storeAddress: string
  storeLogo?: string
  courierCoords: [number, number] | null
  courierHeading?: number | null
  onDistanceChange?: (distance: number) => void
}

// Helper to calculate distance in km
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Component to dynamically fit the map bounds to all active pins
function MapBoundsController({ 
  store, 
  customer, 
  courier 
}: { 
  store: [number, number] | null
  customer: [number, number] | null
  courier: [number, number] | null 
}) {
  const map = useMap()

  useEffect(() => {
    const points: L.LatLngExpression[] = []
    if (store) points.push(store)
    if (customer) points.push(customer)
    if (courier) points.push(courier)

    if (points.length > 0) {
      const bounds = L.latLngBounds(points)
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
    }
  }, [map, store, customer, courier])

  return null
}

export default function LiveTrackingMap({ 
  customerAddress, 
  storeAddress, 
  storeLogo,
  courierCoords, 
  courierHeading,
  onDistanceChange 
}: LiveTrackingMapProps) {
  const [storeCoords, setStoreCoords] = useState<[number, number] | null>(null)
  const [customerCoords, setCustomerCoords] = useState<[number, number] | null>(null)
  const [geocoding, setGeocoding] = useState(true)

  // 1. Geocode store and customer addresses client-side
  useEffect(() => {
    async function geocode() {
      try {
        setGeocoding(true)
        
        // Geocode customer
        if (customerAddress) {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(customerAddress)}&format=json&limit=1`)
          const data = await res.json()
          if (data && data.length > 0) {
            setCustomerCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)])
          }
        }

        // Geocode store
        if (storeAddress) {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(storeAddress)}&format=json&limit=1`)
          const data = await res.json()
          if (data && data.length > 0) {
            setStoreCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)])
          }
        }
      } catch (err) {
        console.error("Geocoding error:", err)
      } finally {
        setGeocoding(false)
      }
    }
    geocode()
  }, [customerAddress, storeAddress])

  // 2. Trigger distance callback when courier or customer location updates
  useEffect(() => {
    if (courierCoords && customerCoords && onDistanceChange) {
      const dist = getDistance(courierCoords[0], courierCoords[1], customerCoords[0], customerCoords[1])
      onDistanceChange(dist)
    }
  }, [courierCoords, customerCoords, onDistanceChange])

  // Custom HTML-based marker pins for Leaflet
  const storeIcon = typeof window !== "undefined" ? L.divIcon({
    html: storeLogo 
      ? `<div class="w-10 h-10 rounded-full bg-white border-[3px] border-slate-900 overflow-hidden flex items-center justify-center shadow-xl"><img src="${storeLogo}" class="w-full h-full object-cover" /></div>`
      : `<div class="w-10 h-10 rounded-full bg-slate-900 border-[3px] border-white flex items-center justify-center shadow-xl text-xl">🏪</div>`,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  }) : null

  const customerIcon = typeof window !== "undefined" ? L.divIcon({
    html: `<div class="w-10 h-10 rounded-full bg-[#1a56db] border-[3px] border-white flex items-center justify-center shadow-xl text-xl">🏠</div>`,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  }) : null

  const courierIcon = typeof window !== "undefined" ? L.divIcon({
    html: `
      <div class="relative flex items-center justify-center w-12 h-12">
        <div class="absolute w-12 h-12 rounded-full bg-emerald-500 opacity-20 animate-ping"></div>
        <div class="absolute w-10 h-10 rounded-full bg-emerald-500 border-[3px] border-white flex items-center justify-center shadow-xl text-xl transition-transform duration-500" style="transform: rotate(${courierHeading || 0}deg);">
          🏍️
        </div>
      </div>
    `,
    className: "",
    iconSize: [48, 48],
    iconAnchor: [24, 24]
  }) : null

  const initialCenter = courierCoords || customerCoords || storeCoords || [-23.55052, -46.633308] // Default SP

  // Build routing polyline path
  const routePoints: [number, number][] = []
  if (storeCoords) routePoints.push(storeCoords)
  if (courierCoords) routePoints.push(courierCoords)
  if (customerCoords) routePoints.push(customerCoords)

  if (geocoding) {
    return (
      <div className="size-full flex flex-col items-center justify-center bg-slate-50 gap-2">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-[#1a56db] animate-spin" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Carregando mapa...</span>
      </div>
    )
  }

  return (
    <div className="size-full overflow-hidden rounded-[32px] border border-slate-100/50 shadow-inner">
      <MapContainer 
        center={initialCenter} 
        zoom={14} 
        className="size-full" 
        zoomControl={false}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {storeCoords && storeIcon && (
          <Marker position={storeCoords} icon={storeIcon}>
            <Popup>
              <div className="text-xs font-bold p-1">Loja: {storeAddress}</div>
            </Popup>
          </Marker>
        )}

        {customerCoords && customerIcon && (
          <Marker position={customerCoords} icon={customerIcon}>
            <Popup>
              <div className="text-xs font-bold p-1">Entrega: {customerAddress}</div>
            </Popup>
          </Marker>
        )}

        {courierCoords && courierIcon && (
          <Marker position={courierCoords} icon={courierIcon}>
            <Popup>
              <div className="text-xs font-bold p-1">Entregador a caminho</div>
            </Popup>
          </Marker>
        )}

        {/* 🛣️ Route polyline */}
        {routePoints.length >= 2 && (
          <Polyline 
            positions={routePoints} 
            color="#10b981" 
            weight={4} 
            opacity={0.6} 
            dashArray="8, 8" 
          />
        )}

        <MapBoundsController store={storeCoords} customer={customerCoords} courier={courierCoords} />
      </MapContainer>
    </div>
  )
}
