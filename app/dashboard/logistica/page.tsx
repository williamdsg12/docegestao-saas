"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
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
  Zap,
  X,
  MessageCircle,
  CheckCircle2,
  Trash2
} from "lucide-react"
import { useBusiness } from "@/hooks/useBusiness"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { differenceInMinutes } from "date-fns"
import { toast } from "sonner"

export default function LogisticaPage() {
  const { business, profile } = useBusiness()
  const [couriers, setCouriers] = useState<any[]>([])
  const [activeDeliveries, setActiveDeliveries] = useState<any[]>([])
  const [selectedMarker, setSelectedMarker] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [activeTab, setActiveTab] = useState<'manifest' | 'fleet'>('manifest')

  // Manual Driver Assignment Selectors
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null)

  // Real-time Chat Drawer States
  const [chatOrderId, setChatOrderId] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState("")

  // Leaflet references
  const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<{ [key: string]: any }>({})

  const center = useMemo(() => ({
    lat: business?.address_lat ? Number(business.address_lat) : -23.5505,
    lng: business?.address_lng ? Number(business.address_lng) : -46.6333
  }), [business])

  const fetchLogisticsData = useCallback(async () => {
    if (!profile?.company_id) return

    // 1. Fetch drivers from delivery_drivers table
    const { data: driversData, error: driversError } = await supabase
      .from('delivery_drivers')
      .select('*')
      .eq('company_id', profile.company_id)
    
    if (driversError) {
      console.error("Error fetching drivers:", driversError.message)
    }
    setCouriers(driversData || [])

    // 2. Fetch active deliveries from orders / entregas tables
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        customers(*),
        addresses!address_id(*)
      `)
      .eq('tenant_id', profile.company_id)
      .in('order_status', ['ready', 'pronto', 'assigned', 'accepted_driver', 'on_route', 'a_caminho', 'arrived', 'chegou'])
    
    if (ordersError) {
      console.error("Error fetching active orders for logistics:", ordersError.message)
    }

    const mapped = (ordersData || []).map((o: any) => ({
      ...o,
      clientes: {
        nome: o.customers?.name || o.customers?.full_name || 'Cliente'
      },
      status: o.order_status || o.status,
      lat: Number(o.latitude || o.addresses?.latitude || -23.5505),
      lng: Number(o.longitude || o.addresses?.longitude || -46.6333)
    }))
    
    setActiveDeliveries(mapped)
  }, [profile])

  // Poll logistics metadata periodically
  useEffect(() => {
    fetchLogisticsData()
    const interval = setInterval(fetchLogisticsData, 20000)

    // Subscriptions to driver locations & orders to auto update without refresh
    const channelDrivers = supabase
      .channel("driver-status-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "delivery_drivers" }, () => {
        fetchLogisticsData()
      })
      .subscribe()

    const channelOrders = supabase
      .channel("orders-dispatch-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchLogisticsData()
      })
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channelDrivers)
      supabase.removeChannel(channelOrders)
    }
  }, [fetchLogisticsData])

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainer) return
    const container = mapContainer

    let leafMap = mapRef.current
    let LInstance: any = null

    async function initMap() {
      const L = await import("leaflet")
      await import("leaflet/dist/leaflet.css")
      LInstance = L

      if (!mapRef.current) {
        leafMap = L.map(container, {
          zoomControl: false,
          attributionControl: false
        }).setView([center.lat, center.lng], 14)

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 20
        }).addTo(leafMap)

        mapRef.current = leafMap
      } else {
        leafMap = mapRef.current
        leafMap.setView([center.lat, center.lng], 14)
      }

      // Clean up previous markers
      Object.values(markersRef.current).forEach(marker => leafMap.removeLayer(marker))
      markersRef.current = {}

      // Add Store Marker
      const storeIcon = L.divIcon({
        className: 'custom-store-icon',
        html: `<div class="w-10 h-10 bg-pink-500 rounded-2xl border-2 border-slate-900 flex items-center justify-center text-white shadow-lg shadow-pink-500/20 text-lg font-bold">🏪</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      })
      const storeMarker = L.marker([center.lat, center.lng], { icon: storeIcon })
        .addTo(leafMap)
        .bindPopup(`<div class="p-2 text-slate-900 bg-white font-sans"><h4 class="font-black text-xs uppercase">${business?.nome || 'Doce Gestão'}</h4><p class="text-[9px] uppercase tracking-wider text-slate-400">Sede Principal</p></div>`)
      markersRef.current['store'] = storeMarker

      // Add delivery radius circle
      if (business?.delivery_radius) {
        const circle = L.circle([center.lat, center.lng], {
          color: '#ec4899',
          fillColor: '#ec4899',
          fillOpacity: 0.05,
          radius: Number(business.delivery_radius) * 1000,
          weight: 1
        }).addTo(leafMap)
        markersRef.current['radius'] = circle
      }

      // Add Courier Markers
      couriers.forEach(courier => {
        if (!courier.latitude || !courier.longitude) return
        
        const isOnline = courier.status === 'online' || courier.status === 'em_entrega'
        const color = courier.status === 'em_entrega' ? 'bg-purple-600' : (isOnline ? 'bg-emerald-500' : 'bg-slate-700')
        
        const courierIcon = L.divIcon({
          className: 'custom-courier-icon',
          html: `<div class="w-9 h-9 ${color} rounded-full border-2 border-slate-900 flex items-center justify-center text-white shadow-lg text-sm">🛵</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        })

        const marker = L.marker([Number(courier.latitude), Number(courier.longitude)], { icon: courierIcon })
          .addTo(leafMap)
          .bindPopup(`
            <div class="p-3 text-slate-900 bg-white font-sans space-y-1">
              <h4 class="font-black text-xs uppercase">${courier.name}</h4>
              <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">${courier.vehicle} • ${courier.plate || 'Sem Placa'}</p>
              <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status: <span class="text-emerald-600">${courier.status.toUpperCase()}</span></p>
            </div>
          `)
        
        markersRef.current[`courier-${courier.id}`] = marker
      })

      // Add Active Deliveries Destination Markers
      activeDeliveries.forEach(delivery => {
        if (!delivery.lat || !delivery.lng) return

        const deliveryIcon = L.divIcon({
          className: 'custom-delivery-icon',
          html: `<div class="w-9 h-9 bg-pink-500 rounded-xl border-2 border-slate-900 flex items-center justify-center text-white shadow-lg text-sm">📦</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        })

        const marker = L.marker([Number(delivery.lat), Number(delivery.lng)], { icon: deliveryIcon })
          .addTo(leafMap)
          .bindPopup(`
            <div class="p-3 text-slate-900 bg-white font-sans space-y-1">
              <h4 class="font-black text-xs uppercase">${delivery.clientes?.nome || 'Cliente'}</h4>
              <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pedido #${delivery.num_serial || delivery.id.slice(-4).toUpperCase()}</p>
              <p class="text-[9px] font-bold text-pink-500 uppercase tracking-wider">${delivery.order_status?.toUpperCase()}</p>
            </div>
          `)

        markersRef.current[`delivery-${delivery.id}`] = marker
      })
    }

    initMap()

    return () => {
      if (leafMap && LInstance) {
        Object.values(markersRef.current).forEach(marker => leafMap.removeLayer(marker))
        markersRef.current = {}
      }
    }
  }, [mapContainer, center, couriers, activeDeliveries, business])

  // Handle Manual Assignment / Re-assignment
  async function assignDriver(orderId: string, driverId: string) {
    try {
      const selectedDriver = couriers.find(d => d.id === driverId)
      if (!selectedDriver) return

      // 1. Assign driver in orders table
      const { error: orderErr } = await supabase
        .from('orders')
        .update({ driver_id: driverId })
        .eq('id', orderId)

      if (orderErr) throw orderErr

      // 2. Assign driver in pedidos table
      await supabase
        .from('pedidos')
        .update({ driver_id: driverId })
        .eq('id', orderId)

      // 3. Upsert legacy entregas status
      await supabase
        .from('entregas')
        .update({ 
          status: 'accepted_driver',
          entregador_id: driverId
        })
        .eq('pedido_id', orderId)

      // 4. Log event
      await supabase.from('delivery_events').insert({
        order_id: orderId,
        event_type: 'accepted',
        details: `Corrida designada manualmente para o entregador ${selectedDriver.name}`
      })

      toast.success(`Pedido designado para ${selectedDriver.name}`)
      setAssigningOrderId(null)
      fetchLogisticsData()
    } catch (err: any) {
      console.error(err)
      toast.error("Erro ao designar entregador")
    }
  }

  // Cancel active delivery and return to waiting queue
  async function cancelDelivery(orderId: string) {
    try {
      await supabase
        .from('orders')
        .update({ driver_id: null })
        .eq('id', orderId)

      await supabase
        .from('pedidos')
        .update({ driver_id: null })
        .eq('id', orderId)

      await supabase
        .from('entregas')
        .update({ 
          status: 'aguardando',
          entregador_id: null
        })
        .eq('pedido_id', orderId)

      await supabase.from('delivery_events').insert({
        order_id: orderId,
        event_type: 'dispatch_failed',
        details: "Corrida cancelada manualmente pela loja."
      })

      toast.success("Entrega cancelada e devolvida à fila de espera")
      fetchLogisticsData()
    } catch (err: any) {
      console.error(err)
      toast.error("Erro ao cancelar entrega")
    }
  }

  // Real-time Chat Load & Subscription
  useEffect(() => {
    if (!chatOrderId) {
      setChatMessages([])
      return
    }

    async function loadMessages() {
      const { data } = await supabase
        .from('delivery_messages')
        .select('*')
        .eq('order_id', chatOrderId)
        .order('created_at', { ascending: true })
      setChatMessages(data || [])
    }
    loadMessages()

    const channel = supabase
      .channel(`chat-${chatOrderId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'delivery_messages',
        filter: `order_id=eq.${chatOrderId}`
      }, (payload) => {
        setChatMessages(prev => [...prev, payload.new])
        if (payload.new.sender_type !== 'merchant') {
          import("@/lib/services/notifications").then(({ NotificationService }) => {
            NotificationService.showLocalNotification(
              "Nova mensagem de entrega 💬",
              payload.new.message
            )
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatOrderId])

  async function sendChatMessage() {
    if (!chatInput.trim() || !chatOrderId) return
    const msg = chatInput
    setChatInput("")

    const { error } = await supabase
      .from('delivery_messages')
      .insert({
        order_id: chatOrderId,
        sender_id: profile?.id,
        sender_type: 'merchant',
        message: msg
      })

    if (error) {
      console.error("Error sending message:", error)
      toast.error("Erro ao enviar mensagem")
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col overflow-hidden">
      {/* Logistics Header */}
      <div className="p-4 md:p-6 border-b border-white/5 flex flex-col md:flex-row items-center justify-between bg-slate-900/50 backdrop-blur-xl relative z-20 shadow-2xl gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="size-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20 animate-pulse">
            <Zap className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">
              Fleet <span className="text-pink-500">Command</span>
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-slate-500 italic">LOGISTICS INTELLIGENCE V4</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="hidden sm:flex items-center gap-6 px-8 py-3 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3">
              <div className="size-2 bg-emerald-500 rounded-full animate-ping" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-slate-500 leading-none mb-1">Status</span>
                <span className="text-xs font-black text-emerald-500 uppercase">{couriers.filter(c => c.status === 'online').length} ONLINE</span>
              </div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-slate-500 leading-none mb-1">Transit</span>
              <span className="text-xs font-black text-white uppercase">{activeDeliveries.filter(d => ['on_route', 'a_caminho', 'arrived', 'chegou'].includes(d.order_status?.toLowerCase())).length} ACTIVE</span>
            </div>
          </div>
          
          <Button onClick={fetchLogisticsData} variant="outline" className="rounded-xl border-white/10 bg-white/5 text-white/70 hover:bg-white/10 h-12 w-12 p-0">
            <RefreshCcw className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Map Container View */}
        <div className="flex-1 relative bg-slate-950">
          <div ref={setMapContainer} className="w-full h-full" />

          {/* Map Mode Buttons */}
          <div className="absolute top-8 left-8 flex flex-col gap-4 z-[400]">
            <div className="bg-slate-950/80 backdrop-blur-md p-2 rounded-2xl border border-white/10 flex flex-col gap-2 shadow-2xl">
              <Button onClick={() => setViewMode('map')} className={cn("size-12 rounded-xl transition-all", viewMode === 'map' ? "bg-pink-500 text-white" : "bg-transparent text-slate-500")}>
                <MapIcon className="size-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar Panel */}
        <div className="w-full lg:w-[480px] bg-slate-900 lg:border-l border-white/5 flex flex-col overflow-hidden relative z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] h-[400px] lg:h-auto">
          {/* Tabs Selector */}
          <div className="grid grid-cols-2 border-b border-white/5 bg-slate-950/60 shrink-0">
            <button 
              onClick={() => setActiveTab('manifest')}
              className={cn("h-16 font-black uppercase text-[10px] tracking-widest transition-all", 
                activeTab === 'manifest' ? "text-pink-500 border-b-2 border-pink-500 bg-white/[0.02]" : "text-slate-500 hover:text-slate-300"
              )}
            >
              📦 Manifesto ({activeDeliveries.length})
            </button>
            <button 
              onClick={() => setActiveTab('fleet')}
              className={cn("h-16 font-black uppercase text-[10px] tracking-widest transition-all", 
                activeTab === 'fleet' ? "text-pink-500 border-b-2 border-pink-500 bg-white/[0.02]" : "text-slate-500 hover:text-slate-300"
              )}
            >
              🛵 Frota ({couriers.length})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
            {activeTab === 'manifest' ? (
              activeDeliveries.length > 0 ? (
                activeDeliveries.map((delivery) => {
                  const statusLower = delivery.order_status?.toLowerCase()
                  const isAssigned = !!delivery.driver_id
                  const assignedDriver = couriers.find(c => c.id === delivery.driver_id)

                  return (
                    <Card key={delivery.id} className="bg-white/[0.03] border-white/5 rounded-[28px] overflow-hidden group hover:bg-white/10 transition-all border-none">
                      <CardContent className="p-6 space-y-5">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-pink-500 uppercase tracking-widest">
                              Pedido #{delivery.num_serial || delivery.id.slice(-4).toUpperCase()}
                            </span>
                            <h4 className="text-base font-black uppercase italic tracking-tight truncate max-w-[200px]">
                              {delivery.clientes?.nome || "Cliente"}
                            </h4>
                          </div>
                          <Badge className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border-none",
                            statusLower === 'ready' || statusLower === 'pronto' ? "bg-slate-700 text-white" :
                            statusLower === 'accepted_driver' ? "bg-emerald-600 text-white" :
                            "bg-purple-600 text-white animate-pulse"
                          )}>
                            {delivery.order_status || "Pronto"}
                          </Badge>
                        </div>

                        {/* Driver status indicators */}
                        <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Entregador Designado</span>
                              <span className="text-xs font-black uppercase tracking-wide text-white">
                                {assignedDriver ? assignedDriver.name : "Nenhum"}
                              </span>
                            </div>
                            {isAssigned && (
                              <Badge className={cn("px-2.5 py-0.5 rounded-full border-none text-[8px] font-black uppercase tracking-widest",
                                assignedDriver?.status === 'online' ? "bg-emerald-500/10 text-emerald-400" :
                                assignedDriver?.status === 'em_entrega' ? "bg-purple-500/10 text-purple-400" : "bg-slate-800 text-slate-400"
                              )}>
                                ● {assignedDriver?.status || "offline"}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Dropdown Selector for Driver Assignment */}
                        {assigningOrderId === delivery.id ? (
                          <div className="space-y-2 p-3 bg-slate-950 border border-white/10 rounded-2xl">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Escolha o Entregador</span>
                            <select 
                              onChange={(e) => assignDriver(delivery.id, e.target.value)}
                              defaultValue=""
                              className="w-full h-10 bg-slate-900 border border-white/10 text-xs rounded-xl font-bold uppercase px-3 focus:outline-none focus:border-pink-500 text-white"
                            >
                              <option value="" disabled>SELECIONE...</option>
                              {couriers.filter(c => c.status === 'online' || c.status === 'em_entrega').map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.status === 'em_entrega' ? 'Ocupado' : 'Disponível'})</option>
                              ))}
                            </select>
                            <Button size="sm" variant="ghost" onClick={() => setAssigningOrderId(null)} className="w-full text-[9px] font-black uppercase tracking-wider text-rose-500">
                              Cancelar Seleção
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => setAssigningOrderId(delivery.id)}
                              className="flex-1 h-11 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-black uppercase text-[10px] tracking-wider"
                            >
                              {isAssigned ? "Re-designar" : "Designar Motorista"}
                            </Button>

                            {isAssigned && (
                              <>
                                <Button 
                                  onClick={() => setChatOrderId(delivery.id)}
                                  className="h-11 bg-slate-800 hover:bg-slate-700 text-pink-500 rounded-xl font-black uppercase text-[10px] tracking-wider gap-1 px-3"
                                >
                                  <MessageCircle size={14} /> Chat
                                </Button>
                                <Button 
                                  onClick={() => cancelDelivery(delivery.id)}
                                  className="h-11 bg-rose-600/20 hover:bg-rose-600/35 border border-rose-500/30 text-rose-400 rounded-xl font-black uppercase text-[10px] tracking-wider gap-1 px-3"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <div className="h-64 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center text-center p-8 bg-white/[0.01]">
                   <div className="size-20 bg-white/5 rounded-3xl flex items-center justify-center text-slate-700 mb-6 scale-75 opacity-50">
                     <AlertCircle className="size-10" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Nenhum pedido em rota</p>
                </div>
              )
            ) : (
              // Fleet Management UI
              couriers.length > 0 ? (
                <div className="space-y-4">
                  {couriers.map((driver) => {
                    const isOnline = driver.status === 'online' || driver.status === 'em_entrega'
                    return (
                      <div key={driver.id} className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="text-sm font-black uppercase tracking-tight text-white">{driver.name}</h4>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                            {driver.vehicle} • {driver.plate || "Sem Placa"}
                          </p>
                        </div>
                        <Badge className={cn("px-3 py-1 rounded-full border-none font-black text-[8px] uppercase tracking-wider",
                          driver.status === 'online' ? "bg-emerald-500/10 text-emerald-400" :
                          driver.status === 'em_entrega' ? "bg-purple-500/10 text-purple-400" : "bg-slate-800 text-slate-500"
                        )}>
                          ● {driver.status === 'online' ? 'Disponível' : driver.status === 'em_entrega' ? 'Em Entrega' : driver.status.toUpperCase()}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-64 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center text-center p-8 bg-white/[0.01]">
                   <div className="size-20 bg-white/5 rounded-3xl flex items-center justify-center text-slate-700 mb-6 scale-75 opacity-50">
                     <User className="size-10" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Nenhum entregador cadastrado</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Floating Chat Drawer overlay */}
      {chatOrderId && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-slate-900 border-l border-white/10 z-[999] flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-950">
            <div>
              <h3 className="font-black text-sm uppercase italic">Chat de Entrega</h3>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Pedido #{chatOrderId.slice(-4).toUpperCase()}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setChatOrderId(null)} className="text-slate-400 hover:text-white rounded-xl">
              <X className="size-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/50">
            {chatMessages.map((msg) => {
              const isMe = msg.sender_type === 'merchant'
              return (
                <div key={msg.id} className={cn("flex flex-col max-w-[80%] rounded-2xl p-3 text-xs font-sans", 
                  isMe ? "ml-auto bg-pink-500 text-white rounded-tr-none" : "mr-auto bg-slate-800 text-slate-200 rounded-tl-none"
                )}>
                  <span className="text-[8px] font-black uppercase text-slate-400 mb-1">{msg.sender_type}</span>
                  <p className="font-medium leading-relaxed">{msg.message}</p>
                  <span className="text-[8px] text-white/50 text-right mt-1 block font-mono">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="p-4 border-t border-white/10 bg-slate-950 flex gap-2">
            <input 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
              placeholder="DIGITAR MENSAGEM..."
              className="flex-1 h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-pink-500 placeholder:text-slate-600 text-white"
            />
            <Button onClick={sendChatMessage} className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl h-12 px-5 font-black uppercase text-xs">
              Enviar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
