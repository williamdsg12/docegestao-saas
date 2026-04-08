"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle } from "@react-google-maps/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Map as MapIcon, 
  Truck, 
  User, 
  Clock, 
  Navigation, 
  Filter, 
  Search,
  AlertCircle,
  MapPin,
  RefreshCcw,
  Zap
} from "lucide-react"
import { useBusiness } from "@/hooks/useBusiness"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { differenceInMinutes } from "date-fns"

const mapContainerStyle = {
  width: "100%",
  height: "100%"
}

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
]

export default function LogisticaPage() {
  const { business, profile } = useBusiness()
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ""
  })

  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [couriers, setCouriers] = useState<any[]>([])
  const [activeDeliveries, setActiveDeliveries] = useState<any[]>([])
  const [selectedMarker, setSelectedMarker] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')

  const center = useMemo(() => ({
    lat: business?.address_lat || -23.5505, // Default to SP if not set
    lng: business?.address_lng || -46.6333
  }), [business])

  const fetchLogisticsData = useCallback(async () => {
    if (!profile?.company_id) return

    // Fetch couriers and their last locations from the unified schema
    const { data: couriersData } = await supabase
      .from('entregadores')
      .select('*, entregador_localizacao(*)')
      .eq('company_id', profile.company_id)
    
    setCouriers(couriersData || [])

    // Fetch active deliveries (saiu_entrega)
    const { data: ordersData } = await supabase
      .from('pedidos')
      .select('*, clientes(nome)')
      .eq('company_id', profile.company_id)
      .eq('status', 'saiu_entrega')
    
    setActiveDeliveries(ordersData || [])
  }, [profile])

  const atualizarMapa = useCallback((newLocation: any) => {
    setCouriers(prev => prev.map(courier => {
      // The location payload has entregador_id
      if (courier.id === newLocation.entregador_id) {
        return {
          ...courier,
          entregador_localizacao: [newLocation]
        }
      }
      return courier
    }))
  }, [])

  useEffect(() => {
    fetchLogisticsData()
    const interval = setInterval(fetchLogisticsData, 30000) // Fallback fetch every 30s
    
    // Configurar Realtime para atualizações imediatas de localização
    const channel = supabase
      .channel("localizacao")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "entregador_localizacao"
      }, (payload: any) => {
        atualizarMapa(payload.new)
      })
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [fetchLogisticsData, atualizarMapa])

  const onSelectMarker = (marker: any, type: 'courier' | 'delivery') => {
    setSelectedMarker({ ...marker, markerType: type })
  }

  const getMarkerColor = (createdAt: string) => {
    const age = differenceInMinutes(new Date(), new Date(createdAt))
    if (age > 45) return "red"
    if (age > 30) return "yellow"
    return "green"
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col overflow-hidden">
      {/* Logistics Header */}
      <div className="p-4 md:p-6 border-b border-white/5 flex flex-col md:flex-row items-center justify-between bg-slate-900/50 backdrop-blur-xl relative z-20 shadow-2xl gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="size-10 md:size-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20 animate-pulse">
            <Zap className="size-5 md:size-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase italic">
              Fleet <span className="text-pink-500">Command</span>
            </h1>
            <p className="text-[8px] md:text-[10px] uppercase font-bold tracking-[0.3em] text-slate-500 italic">LOGISTICS INTELLIGENCE V4</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="hidden sm:flex items-center gap-4 md:gap-6 px-4 md:px-8 py-2 md:py-3 bg-white/5 rounded-xl md:rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="size-1.5 md:size-2 bg-emerald-500 rounded-full animate-ping" />
              <div className="flex flex-col">
                <span className="text-[8px] md:text-[10px] font-black uppercase text-slate-500 leading-none mb-1">Status</span>
                <span className="text-[10px] md:text-xs font-black text-emerald-500 uppercase">{couriers.filter(c => c.status === 'disponivel').length} ONLINE</span>
              </div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[8px] md:text-[10px] font-black uppercase text-slate-500 leading-none mb-1">Transit</span>
              <span className="text-[10px] md:text-xs font-black text-white uppercase">{activeDeliveries.length} ACTIVE</span>
            </div>
          </div>
          
          <Button onClick={fetchLogisticsData} variant="outline" className="rounded-xl border-white/10 bg-white/5 text-white/70 hover:bg-white/10 h-10 md:h-12 w-10 md:w-12 p-0">
            <RefreshCcw className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Map View */}
        <div className="flex-1 relative bg-slate-950">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={14}
              onLoad={map => setMap(map)}
              options={{ 
                styles: darkMapStyles,
                disableDefaultUI: true,
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false
              }}
            >
              {/* Restaurant Center */}
              <Marker 
                position={center}
                icon={{
                  url: business?.logo_url || "https://cdn-icons-png.flaticon.com/512/3170/3170733.png",
                  scaledSize: new google.maps.Size(40, 40)
                }}
              />
              {business?.delivery_radius && (
                <Circle 
                  center={center} 
                  radius={business.delivery_radius * 1000} 
                  options={{ fillOpacity: 0.1, fillColor: "#ec4899", strokeColor: "#ec4899", strokeWeight: 1 }}
                />
              )}

              {/* Courier Markers */}
              {couriers.map(courier => {
                const loc = courier.entregador_localizacao?.[0]
                if (!loc) return null
                return (
                  <Marker 
                    key={courier.id}
                    position={{ lat: Number(loc.latitude), lng: Number(loc.longitude) }}
                    onClick={() => onSelectMarker(courier, 'courier')}
                    icon={{
                      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                      fillColor: courier.status === 'disponivel' ? "#10b981" : "#ec4899",
                      fillOpacity: 1,
                      strokeColor: "#ffffff",
                      strokeWeight: 2,
                      scale: 6
                    }}
                  />
                )
              })}

              {/* Info Window */}
              {selectedMarker && (
                <InfoWindow
                  position={{ 
                    lat: selectedMarker.markerType === 'courier' ? Number(selectedMarker.entregador_localizacao?.[0]?.latitude) : Number(selectedMarker.lat), 
                    lng: selectedMarker.markerType === 'courier' ? Number(selectedMarker.entregador_localizacao?.[0]?.longitude) : Number(selectedMarker.lng) 
                  }}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div className="p-3 text-slate-900 bg-white rounded-xl">
                    <h3 className="font-black uppercase text-xs mb-1">{selectedMarker.nome || selectedMarker.clientes?.nome}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">
                      {selectedMarker.markerType === 'courier' ? `Veículo: ${selectedMarker.veiculo?.tipo || 'Moto'}` : `Pedido #${selectedMarker.id.slice(0, 5)}`}
                    </p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="flex flex-col items-center gap-4">
                <RefreshCcw className="size-12 text-pink-500 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Initializing Digital Command Map...</p>
              </div>
            </div>
          )}
          
          {/* Map Controls */}
          <div className="absolute top-4 md:top-8 left-4 md:left-8 flex flex-col gap-4 z-10">
            <div className="bg-slate-950/80 backdrop-blur-md p-2 rounded-xl md:rounded-2xl border border-white/10 flex flex-col gap-2 shadow-2xl">
              <Button onClick={() => setViewMode('map')} className={cn("size-10 md:size-12 rounded-lg md:rounded-xl transition-all", viewMode === 'map' ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20" : "bg-transparent text-slate-500")}>
                <MapIcon className="size-4 md:size-5" />
              </Button>
              <Button onClick={() => setViewMode('list')} className={cn("size-10 md:size-12 rounded-lg md:rounded-xl transition-all", viewMode === 'list' ? "bg-pink-500 text-white" : "bg-transparent text-slate-500")}>
                <Filter className="size-4 md:size-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar Panel */}
        <div className="w-full lg:w-[480px] bg-slate-900 lg:border-l border-white/5 flex flex-col overflow-hidden relative z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] h-[300px] lg:h-auto">
          <div className="p-4 md:p-8 pb-4">
            <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-pink-500 mb-4 md:mb-6 flex items-center gap-2 italic">
              <Truck className="size-4" /> Live Manifest
            </h3>
            
            <div className="relative mb-4 md:mb-8">
              <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <input 
                placeholder="PROCURAR ENTREGAS..." 
                className="w-full h-12 md:h-14 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl pl-12 md:pl-14 pr-4 md:pr-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-pink-500 transition-all placeholder:text-slate-600 focus:bg-white/[0.07]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-0 space-y-4 md:space-y-6 scrollbar-hide">
            {activeDeliveries.length > 0 ? activeDeliveries.map((delivery) => (
              <Card key={delivery.id} className="bg-white/[0.03] border-white/5 rounded-[32px] md:rounded-[40px] overflow-hidden group hover:bg-white/10 transition-all duration-500 border-none hover:shadow-2xl hover:-translate-y-1">
                <CardContent className="p-6 md:p-8">
                  <div className="flex justify-between items-start mb-6 md:mb-8">
                    <div className="space-y-1 md:space-y-2">
                      <Badge className={cn(
                        "border-none font-black text-[8px] md:text-[9px] uppercase tracking-widest px-3 md:px-4 py-1 md:py-1.5 rounded-full",
                        getMarkerColor(delivery.created_at) === 'red' ? "bg-rose-500/10 text-rose-500" :
                        getMarkerColor(delivery.created_at) === 'yellow' ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
                      )}>
                        {differenceInMinutes(new Date(), new Date(delivery.created_at))} MIN EM ROTA
                      </Badge>
                      <h4 className="text-lg md:text-xl font-black uppercase italic tracking-tighter truncate max-w-[200px] md:max-w-[250px]">
                        {delivery.clientes?.nome || "Cliente"}
                      </h4>
                    </div>
                    <div className="size-10 md:size-12 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center border border-white/10">
                       <MapPin className="size-4 md:size-5 text-pink-500" />
                    </div>
                  </div>

                  <div className="p-4 md:p-6 bg-slate-900/80 rounded-2xl md:rounded-[32px] border border-white/5 mb-6 md:mb-8">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="size-8 md:size-10 bg-white text-slate-900 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform">
                        <Truck className="size-4 md:size-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5 md:mb-1">Entregador Responsável</p>
                        <p className="text-[10px] md:text-xs font-black uppercase text-white tracking-widest">
                           {couriers.find(c => c.id === delivery.entregador_id)?.nome || "Buscando..."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 md:gap-4">
                    <Button className="flex-1 h-10 md:h-12 bg-pink-500 hover:bg-pink-600 text-white rounded-xl md:rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-pink-500/20">
                      Rastrear
                    </Button>
                    <Button variant="outline" className="size-10 md:size-12 rounded-xl md:rounded-2xl border-white/10 bg-white/5 text-white/50 hover:bg-white/10">
                      <Navigation className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="h-48 md:h-64 border-2 border-dashed border-white/5 rounded-[40px] md:rounded-[50px] flex flex-col items-center justify-center text-center p-6 md:p-8 bg-white/[0.01]">
                 <div className="size-16 md:size-20 bg-white/5 rounded-2xl md:rounded-3xl flex items-center justify-center text-slate-700 mb-4 md:mb-6 scale-75 opacity-50">
                   <AlertCircle className="size-8 md:size-10" />
                 </div>
                 <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-slate-500 italic">No Active Wings in Transit</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
