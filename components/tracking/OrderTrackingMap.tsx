"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Dynamically require leaflet-routing-machine on client side
if (typeof window !== "undefined") {
  require("leaflet-routing-machine")
}

// Fix default Leaflet icon paths for safety
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
})

interface OrderTrackingMapProps {
  customerAddress: string
  storeAddress: string
  storeLogo?: string
  storeLatLng?: [number, number] | null
  customerLatLng?: [number, number] | null
  courierCoords: [number, number] | null
  courierHeading?: number | null
  onDistanceChange?: (distance: number) => void
  isDelivered?: boolean
}

// Helper to calculate straight-line distance in km
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

// Leaflet Routing Machine component wrapper
function RoutingMachine({ 
  waypoints 
}: { 
  waypoints: [number, number][] 
}) {
  const map = useMap()

  useEffect(() => {
    if (!map || waypoints.length < 2) return

    const Routing = (L as any).Routing
    if (!Routing) return

    try {
      const routingControl = Routing.control({
        waypoints: waypoints.map(p => L.latLng(p[0], p[1])),
        router: Routing.osrmv1({
          serviceUrl: "https://router.project-osrm.org/route/v1"
        }),
        lineOptions: {
          styles: [{ color: "#2563eb", weight: 6, opacity: 0.85 }] // Beautiful solid blue line
        },
        show: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: false,
        createMarker: () => null
      }).addTo(map)

      return () => {
        try {
          map.removeControl(routingControl)
        } catch (e) {
          // Ignore
        }
      }
    } catch (err) {
      console.error("Routing error:", err)
    }
  }, [map, waypoints])

  return null
}

// Bounds and centering controller
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
    if (!customer) return

    if (courier) {
      const points: L.LatLngExpression[] = []
      if (store) points.push(store)
      points.push(customer)
      points.push(courier)
      
      const bounds = L.latLngBounds(points)
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 })
    } else {
      map.setView(customer, 17)
    }
  }, [map, store, customer, courier])

  return null
}

export default function OrderTrackingMap({ 
  customerAddress, 
  storeAddress, 
  storeLogo,
  storeLatLng,
  customerLatLng,
  courierCoords, 
  courierHeading,
  onDistanceChange,
  isDelivered
}: OrderTrackingMapProps) {
  const [storeCoords, setStoreCoords] = useState<[number, number] | null>(storeLatLng || null)
  const [customerCoords, setCustomerCoords] = useState<[number, number] | null>(customerLatLng || null)
  const [animatedCourierCoords, setAnimatedCourierCoords] = useState<[number, number] | null>(null)
  const [geocoding, setGeocoding] = useState(true)

  // 1. Coordinates are loaded directly from parameters to prevent global fallback issues
  useEffect(() => {
    setStoreCoords(storeLatLng || null)
    setCustomerCoords(customerLatLng || null)
    setGeocoding(false)
  }, [storeLatLng, customerLatLng])

  // 2. Perform smooth sliding coordinate transitions using requestAnimationFrame
  useEffect(() => {
    if (!courierCoords) {
      setAnimatedCourierCoords(null)
      return
    }

    if (!animatedCourierCoords) {
      setAnimatedCourierCoords(courierCoords)
      return
    }

    const startCoords = [...animatedCourierCoords] as [number, number]
    const endCoords = [...courierCoords] as [number, number]
    const duration = 1000 // 1s sliding duration
    const startTime = performance.now()
    let animationFrameId: number

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      const lat = startCoords[0] + (endCoords[0] - startCoords[0]) * progress
      const lng = startCoords[1] + (endCoords[1] - startCoords[1]) * progress

      setAnimatedCourierCoords([lat, lng])

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate)
      }
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrameId)
  }, [courierCoords])

  // 3. Compute and fire distance callback
  useEffect(() => {
    const activeCourier = animatedCourierCoords || courierCoords
    if (activeCourier && customerCoords && onDistanceChange) {
      const dist = getDistance(activeCourier[0], activeCourier[1], customerCoords[0], customerCoords[1])
      onDistanceChange(dist)
    }
  }, [animatedCourierCoords, courierCoords, customerCoords, onDistanceChange])

  // Custom marker icons
  const storeIcon = typeof window !== "undefined" ? L.divIcon({
    html: storeLogo 
      ? `<div class="w-11 h-11 rounded-full bg-white border-[3px] border-slate-900 overflow-hidden flex items-center justify-center shadow-xl"><img src="${storeLogo}" class="w-full h-full object-cover" /></div>`
      : `<div class="w-11 h-11 rounded-full bg-slate-900 border-[3px] border-white flex items-center justify-center shadow-xl text-xl">🏪</div>`,
    className: "",
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  }) : null

  const customerIcon = typeof window !== "undefined" ? L.divIcon({
    html: `<div class="w-11 h-11 rounded-full bg-red-500 border-[3px] border-white flex items-center justify-center shadow-xl text-2xl text-white">🏠</div>`,
    className: "",
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  }) : null

  const courierIcon = typeof window !== "undefined" ? L.divIcon({
    html: `
      <div class="relative flex items-center justify-center w-14 h-14">
        <div class="absolute w-14 h-14 rounded-full bg-emerald-500 opacity-25 animate-ping"></div>
        <div class="absolute w-11 h-11 rounded-full bg-emerald-500 border-[3px] border-white flex items-center justify-center shadow-xl text-2xl transition-transform duration-300" style="transform: rotate(${courierHeading || 0}deg);">
          🚴
        </div>
      </div>
    `,
    className: "",
    iconSize: [56, 56],
    iconAnchor: [28, 28]
  }) : null

  const initialCenter = courierCoords || customerCoords || storeCoords || [-23.55052, -46.633308]

  // Construct active waypoints list
  const waypoints: [number, number][] = []
  if (storeCoords) waypoints.push(storeCoords)
  if (animatedCourierCoords || courierCoords) waypoints.push(animatedCourierCoords || courierCoords!)
  if (customerCoords) waypoints.push(customerCoords)

  if (geocoding) {
    return (
      <div className="size-full flex flex-col items-center justify-center bg-slate-50 gap-2">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-[#1a56db] animate-spin" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Carregando mapa...</span>
      </div>
    )
  }

  return (
    <div className="size-full overflow-hidden shadow-inner">
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
              <div className="text-xs font-bold p-1">🏪 Loja</div>
            </Popup>
          </Marker>
        )}

        {customerCoords && customerIcon && (
          <Marker position={customerCoords} icon={customerIcon}>
            <Popup>
              <div className="text-xs font-bold p-1">🏠 Cliente</div>
            </Popup>
          </Marker>
        )}

        {!isDelivered && (animatedCourierCoords || courierCoords) && courierIcon && (
          <Marker position={animatedCourierCoords || courierCoords!} icon={courierIcon}>
            <Popup>
              <div className="text-xs font-bold p-1">🚴 Entregador</div>
            </Popup>
          </Marker>
        )}

        {/* 🛣️ Routing Line */}
        {waypoints.length >= 2 && <RoutingMachine waypoints={waypoints} />}

        <MapBoundsController 
          store={storeCoords} 
          customer={customerCoords} 
          courier={isDelivered ? null : (animatedCourierCoords || courierCoords)} 
        />
      </MapContainer>
    </div>
  )
}
