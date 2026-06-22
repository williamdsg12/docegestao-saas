"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Truck, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Power, 
  DollarSign, 
  Navigation,
  CheckCircle2, 
  Zap, 
  Clock, 
  LogOut,
  Map,
  Compass,
  AlertCircle,
  Camera,
  Trash,
  X
} from "lucide-react"
import { toast } from "sonner"

interface DriverProfile {
  id: string
  name: string
  email: string
  phone: string
  vehicle: string
  plate: string
  status: 'online' | 'offline' | 'em_entrega' | 'pausado'
}

interface DeliveryOrder {
  id: string
  num_serial?: string
  total: number
  payment_method: string
  payment_status: string
  notes?: string
  order_status: string
  created_at: string
  customers?: {
    name: string
    phone: string
  }
  addresses?: {
    street: string
    number: string
    neighborhood: string
    city: string
  }
  endereco_entrega?: string
}

export default function DriverDashboardPage() {
  const router = useRouter()
  const [driver, setDriver] = useState<DriverProfile | null>(null)
  const [orders, setOrders] = useState<DeliveryOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [trackingActive, setTrackingActive] = useState(false)
  const watchIdRef = useRef<number | null>(null)

  // Confirmation Modal Proof States
  const [selectedConfirmOrder, setSelectedConfirmOrder] = useState<DeliveryOrder | null>(null)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Validate session on load
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/entregador/login')
        return
      }

      // Check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (!profile || profile.role !== 'delivery_driver') {
        await supabase.auth.signOut()
        router.push('/entregador/login')
        return
      }

      // Fetch driver details
      const { data: driverData, error } = await supabase
        .from('delivery_drivers')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (error || !driverData) {
        toast.error("Erro ao carregar perfil do entregador")
        return
      }

      setDriver(driverData)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  // Fetch driver assigned orders
  const fetchAssignedOrders = useCallback(async () => {
    if (!driver) return
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, customers!customer_id(name, phone), addresses!address_id(*)')
        .eq('driver_id', driver.id)
        .in('order_status', [
          'assigned', 'accepted_driver', 'on_route', 'a_caminho', 'arrived', 'chegou', 'ready', 'pronto',
          'ASSIGNED', 'ACCEPTED_DRIVER', 'ON_ROUTE', 'A_CAMINHO', 'ARRIVED', 'CHEGOU', 'READY', 'PRONTO'
        ])
        .order('created_at', { ascending: true })

      if (error) throw error
      
      const ordersWithEntrega = [...(data || [])]
      if (ordersWithEntrega.length > 0) {
        const orderIds = ordersWithEntrega.map(o => o.id)
        const { data: entregas } = await supabase
          .from('entregas')
          .select('*')
          .in('pedido_id', orderIds)
        
        if (entregas) {
          ordersWithEntrega.forEach(o => {
            const ent = entregas.find(e => e.pedido_id === o.id)
            if (ent && ent.status && ent.status !== 'aguardando') {
              o.order_status = ent.status
            }
          })
        }
      }
      
      setOrders(ordersWithEntrega)
    } catch (e: any) {
      console.error(e.message)
    }
  }, [driver])

  useEffect(() => {
    if (driver) {
      fetchAssignedOrders()

      // Realtime subscription for assigned orders
      const channel = supabase
        .channel(`driver-orders-${driver.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `driver_id=eq.${driver.id}`
        }, () => {
          fetchAssignedOrders()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [driver, fetchAssignedOrders])

  // Live telemetry push
  const sendLocationUpdate = useCallback(async (lat: number, lng: number, speed: number | null, heading: number | null) => {
    if (!driver) return

    // 1. Update database coordinates for driver dashboard list
    await supabase
      .from('delivery_drivers')
      .update({
        latitude: lat,
        longitude: lng,
        last_update: new Date().toISOString()
      })
      .eq('id', driver.id)

    // 2. If there are active deliveries ON_ROUTE, post coordinates for client map tracking
    const activeOrder = orders.find(o => {
      const s = o.order_status.toLowerCase()
      return s === 'on_route' || s === 'a_caminho'
    })
    if (activeOrder) {
      try {
        await fetch('/api/delivery/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: activeOrder.id,
            deliveryPersonId: driver.id,
            latitude: lat,
            longitude: lng,
            speed: speed || 0,
            heading: heading || 0
          })
        })
      } catch (err) {
        console.error("Erro ao enviar coordenadas:", err)
      }
    }
  }, [driver, orders])

  // Trigger GPS telemetry loop
  const startTracking = useCallback(() => {
    if (watchIdRef.current !== null) return

    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada pelo seu navegador")
      return
    }

    setTrackingActive(true)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, heading } = position.coords
        sendLocationUpdate(latitude, longitude, speed, heading)
      },
      (error) => {
        console.error("GPS error:", error)
        toast.error("Erro ao obter localização GPS")
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }, [sendLocationUpdate])

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
      setTrackingActive(false)
    }
  }, [])

  // Geolocation trigger on status update
  useEffect(() => {
    if (driver?.status === 'online' || driver?.status === 'em_entrega') {
      startTracking()
    } else {
      stopTracking()
    }

    return () => stopTracking()
  }, [driver?.status, startTracking, stopTracking])

  // Toggle Driver Status
  async function updateDriverStatus(nextStatus: 'online' | 'offline' | 'pausado') {
    if (!driver) return
    try {
      const { error } = await supabase
        .from('delivery_drivers')
        .update({ status: nextStatus })
        .eq('id', driver.id)

      if (error) throw error
      setDriver({ ...driver, status: nextStatus })
      toast.success(`Status alterado para: ${nextStatus.toUpperCase()}`)
    } catch (err: any) {
      toast.error("Erro ao atualizar status")
      console.error(err)
    }
  }

  // Update order status flow (enhanced with signature / photo metadata)
  async function handleUpdateOrderStatus(orderId: string, nextStatus: string, signature?: string, photo?: string) {
    try {
      const dbStatus = (nextStatus === 'delivered' ? 'finalizado' : (['accepted_driver', 'on_route', 'arrived'].includes(nextStatus) ? 'pronto' : nextStatus))
      const updateData: any = { order_status: dbStatus }

      if (nextStatus === 'pronto') {
        // Driver rejected the order, clear driver_id so it returns to dispatch queue
        updateData.driver_id = null
      }

      if (nextStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString()
        updateData.tracking_closed = true
        if (signature) updateData.delivery_signature = signature
        if (photo) updateData.delivery_photo = photo
      }

      // 1. Update orders table
      const { error: orderErr } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (orderErr) throw orderErr

      // 2. Update pedidos table
      await supabase
        .from('pedidos')
        .update(updateData)
        .eq('id', orderId)

      // 3. Update legacy entregas table
      const legacyUpdate: any = { status: nextStatus }
      if (nextStatus === 'pronto') {
        legacyUpdate.entregador_id = null
        legacyUpdate.status = 'aguardando'
      }
      await supabase
        .from('entregas')
        .update(legacyUpdate)
        .eq('pedido_id', orderId)


      // 4. Notify Chatbot of Status Change
      fetch('/api/chatbot/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: nextStatus })
      }).catch(err => console.error("Error notifying chatbot:", err))

      toast.success(
        nextStatus === 'pronto' ? "Pedido recusado e devolvido à central." :
        nextStatus === 'accepted_driver' ? "Pedido aceito!" :
        nextStatus === 'on_route' ? "Rota iniciada! Lembre-se de dirigir com cuidado." :
        nextStatus === 'arrived' ? "Você marcou que chegou ao local!" :
        "Entrega finalizada com sucesso! Parabéns!"
      )
      
      setIsConfirmModalOpen(false)
      setSelectedConfirmOrder(null)
      setPhotoBase64(null)
      fetchAssignedOrders()
    } catch (err: any) {
      toast.error("Erro ao atualizar pedido")
      console.error(err)
    }
  }

  // Signature Canvas Canvas Coordinators
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    let clientX, clientY
    if ('touches' in e) {
      if (e.touches.length === 0) return null
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.strokeStyle = '#000000' // Black ink
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    
    const coords = getCanvasCoords(e, canvas)
    if (!coords) return
    
    ctx.beginPath()
    ctx.moveTo(coords.x, coords.y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const coords = getCanvasCoords(e, canvas)
    if (!coords) return
    
    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()
    e.preventDefault()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  // Image compressor from file/camera input
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 600
        const MAX_HEIGHT = 600
        let width = img.width
        let height = img.height
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }
        
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7) // 70% quality JPEG
        setPhotoBase64(compressedDataUrl)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // Helper formats
  const formatAddress = (order: DeliveryOrder) => {
    if (order.endereco_entrega) return order.endereco_entrega
    const addr = order.addresses
    if (!addr) return "Retirada no Balcão"
    return `${addr.street}, ${addr.number} - ${addr.neighborhood}, ${addr.city}`
  }

  async function handleLogout() {
    stopTracking()
    await supabase.auth.signOut()
    router.push('/entregador/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-black uppercase tracking-widest text-sm animate-pulse">
        Carregando painel do entregador...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans pb-10">
      {/* Mobile Top Header */}
      <header className="p-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-pink-500 rounded-2xl flex items-center justify-center text-white font-bold italic shadow-md shadow-pink-500/10">
            <Truck className="size-5" />
          </div>
          <div>
            <h2 className="font-black text-sm uppercase leading-none">{driver?.name}</h2>
            <p className="text-[9px] font-bold text-pink-500 uppercase tracking-widest leading-none mt-1">
              {driver?.vehicle} • {driver?.plate || "SEM PLACA"}
            </p>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-white rounded-xl">
          <LogOut size={20} />
        </Button>
      </header>

      {/* Driver Status Panel */}
      <section className="p-6 bg-slate-900/50 border-b border-slate-900 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status Operacional</span>
          <Badge className={`px-3 py-1 font-black text-[9px] uppercase tracking-wider border-none ${
            driver?.status === 'online' ? "bg-emerald-500/15 text-emerald-400" :
            driver?.status === 'pausado' ? "bg-amber-500/15 text-amber-400" : "bg-slate-800 text-slate-400"
          }`}>
            ● {driver?.status === 'online' ? 'Online' : driver?.status === 'pausado' ? 'Pausado' : 'Offline'}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Button 
            onClick={() => updateDriverStatus('online')}
            className={`h-11 rounded-xl text-[10px] font-black uppercase tracking-wider gap-1.5 transition-all ${
              driver?.status === 'online' ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-400"
            }`}
          >
            Ficar Online
          </Button>
          <Button 
            onClick={() => updateDriverStatus('pausado')}
            className={`h-11 rounded-xl text-[10px] font-black uppercase tracking-wider gap-1.5 transition-all ${
              driver?.status === 'pausado' ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-400"
            }`}
          >
            Pausar
          </Button>
          <Button 
            onClick={() => updateDriverStatus('offline')}
            className={`h-11 rounded-xl text-[10px] font-black uppercase tracking-wider gap-1.5 transition-all ${
              driver?.status === 'offline' ? "bg-rose-500 hover:bg-rose-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-400"
            }`}
          >
            Ficar Offline
          </Button>
        </div>

        {trackingActive && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <Compass className="size-4 text-emerald-400 animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-wide text-emerald-400">Rastreamento GPS Ativo em Tempo Real</span>
          </div>
        )}
      </section>

      {/* Orders List Container */}
      <main className="flex-1 p-6 space-y-6">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Pedidos Designados ({orders.length})</h3>

        {orders.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-center space-y-2">
            <Truck size={40} className="stroke-[1.5] mb-2 text-slate-600 animate-bounce" />
            <p className="font-bold text-sm">Nenhum pedido no momento.</p>
            <p className="text-[10px] font-medium text-slate-600 max-w-xs uppercase">Seu gerente adicionará pedidos à sua fila quando estiverem prontos.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusLower = order.order_status.toLowerCase()
              
              let statusLabel = 'Pendente'
              if (statusLower === 'accepted_driver') statusLabel = 'Aceito'
              else if (statusLower === 'on_route' || statusLower === 'a_caminho') statusLabel = 'A Caminho'
              else if (statusLower === 'arrived' || statusLower === 'chegou') statusLabel = 'No Local'

              return (
                <Card key={order.id} className="border-slate-800 bg-slate-900/60 rounded-[28px] overflow-hidden shadow-lg p-5 space-y-5">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">
                        Pedido #{order.num_serial || order.id.slice(-4).toUpperCase()}
                      </span>
                      <h4 className="text-base font-black uppercase italic tracking-tight">
                        {order.customers?.name || "Cliente"}
                      </h4>
                    </div>
                    <Badge className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border-none ${
                      statusLower === 'on_route' || statusLower === 'a_caminho' 
                        ? "bg-purple-500 text-white animate-pulse" 
                        : statusLower === 'arrived' || statusLower === 'chegou'
                        ? "bg-blue-600 text-white"
                        : statusLower === 'accepted_driver'
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-700 text-white"
                    }`}>
                      {statusLabel}
                    </Badge>
                  </div>

                  {/* Delivery Location Address details */}
                  <div className="space-y-2 text-slate-300">
                    <div className="flex gap-2">
                      <MapPin className="size-4 text-pink-500 shrink-0 mt-0.5" />
                      <p className="text-xs font-bold font-sans leading-tight">
                        {formatAddress(order)}
                      </p>
                    </div>
                  </div>

                  {/* Payment details */}
                  <div className="p-3.5 bg-slate-950/60 rounded-2xl flex justify-between items-center">
                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none block">Total a cobrar</span>
                      <span className="text-base font-black italic text-white leading-none">
                        R$ {Number(order.total || 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none block">Método</span>
                      <span className="text-xs font-bold text-pink-500 uppercase tracking-wide">
                        {order.payment_method || 'PIX'}
                      </span>
                    </div>
                  </div>

                  {/* Customer Quick contact links */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(`tel:${order.customers?.phone || ''}`)}
                      className="h-10 rounded-xl border-slate-800 text-slate-400 hover:text-white font-bold text-[10px] uppercase gap-1"
                    >
                      <Phone size={12} /> Ligar
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.open(`https://wa.me/55${(order.customers?.phone || '').replace(/\D/g, '')}`)}
                      className="h-10 rounded-xl border-slate-800 text-emerald-500 hover:bg-emerald-500/10 font-bold text-[10px] uppercase gap-1"
                    >
                      <MessageCircle size={12} /> WhatsApp
                    </Button>
                  </div>

                  {/* Navigation & Action Button */}
                  <div className="pt-2">
                    {statusLower === 'assigned' || statusLower === 'ready' || statusLower === 'pronto' ? (
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleUpdateOrderStatus(order.id, 'pronto')}
                          className="flex-1 h-12 bg-rose-600/20 hover:bg-rose-600/35 border border-rose-500/30 text-rose-400 rounded-2xl font-black uppercase text-[10px] tracking-wider"
                        >
                          Recusar
                        </Button>
                        <Button 
                          onClick={() => handleUpdateOrderStatus(order.id, 'accepted_driver')}
                          className="flex-[2] h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest gap-1"
                        >
                          <CheckCircle2 size={12} /> Aceitar Entrega
                        </Button>
                      </div>
                    ) : statusLower === 'accepted_driver' ? (
                      <Button 
                        onClick={() => handleUpdateOrderStatus(order.id, 'on_route')}
                        className="w-full h-14 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-black uppercase italic tracking-widest gap-2"
                      >
                        <Zap size={16} /> Iniciar Rota / Despachar
                      </Button>
                    ) : statusLower === 'on_route' || statusLower === 'a_caminho' ? (
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {
                            const fullAddr = formatAddress(order)
                            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddr)}`, '_blank')
                          }}
                          className="size-14 rounded-2xl bg-slate-800 hover:bg-slate-700 text-pink-500 shrink-0 border border-slate-700"
                        >
                          <Navigation size={22} className="mx-auto" />
                        </Button>
                        <Button 
                          onClick={() => handleUpdateOrderStatus(order.id, 'arrived')}
                          className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase italic tracking-widest gap-2"
                        >
                          Cheguei ao Destino
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => {
                          setSelectedConfirmOrder(order)
                          setPhotoBase64(null)
                          setIsConfirmModalOpen(true)
                        }}
                        className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase italic tracking-widest gap-2"
                      >
                        <CheckCircle2 size={16} /> Confirmar Entrega
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* Touch Signature Pad and Camera Photo Capture Confirmation Modal */}
      {isConfirmModalOpen && selectedConfirmOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-2xl w-full max-w-md space-y-6 text-left relative my-8">
            <button 
              onClick={() => {
                setIsConfirmModalOpen(false)
                setSelectedConfirmOrder(null)
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <div>
              <h3 className="text-lg font-black uppercase italic tracking-tight text-white mb-1">
                Finalizar Entrega
              </h3>
              <p className="text-xs text-slate-400">
                Pedido #{selectedConfirmOrder.num_serial || selectedConfirmOrder.id.slice(-4).toUpperCase()}
              </p>
            </div>

            {/* Signature Box */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Assinatura do Cliente
                </label>
                <button 
                  onClick={clearCanvas}
                  className="text-[9px] font-black uppercase text-pink-500 hover:text-pink-400 flex items-center gap-1"
                >
                  <Trash size={10} /> Limpar
                </button>
              </div>

              <div className="bg-white rounded-2xl overflow-hidden p-1 border border-slate-800">
                <canvas 
                  ref={canvasRef} 
                  width={340} 
                  height={150} 
                  className="w-full h-[150px] bg-white cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
            </div>

            {/* Photo Attachment Capture Box */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Comprovante / Foto do Local (Opcional)
              </label>

              {photoBase64 ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 max-h-48 flex justify-center bg-slate-950">
                  <img src={photoBase64} alt="Comprovante" className="object-contain max-h-48 w-full" />
                  <button 
                    onClick={() => setPhotoBase64(null)}
                    className="absolute right-2 top-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ) : (
                <div className="relative border border-dashed border-slate-800 rounded-2xl p-6 text-center hover:border-pink-500/40 transition-colors">
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Camera className="size-8 text-slate-500 mx-auto mb-2" />
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Tirar Foto / Anexar Imagem
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex gap-3">
              <Button 
                onClick={() => {
                  setIsConfirmModalOpen(false)
                  setSelectedConfirmOrder(null)
                }}
                className="flex-1 h-12 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black uppercase tracking-wider text-xs"
              >
                Voltar
              </Button>
              <Button 
                onClick={() => {
                  const signatureCanvas = canvasRef.current
                  let signatureDataUrl = ""
                  
                  if (signatureCanvas) {
                    // Check if signature has drawing (if it is not completely empty/blank)
                    const buffer = new Uint32Array(
                      signatureCanvas.getContext('2d')!.getImageData(0, 0, signatureCanvas.width, signatureCanvas.height).data.buffer
                    )
                    const hasDrawn = buffer.some(color => color !== 0)
                    if (hasDrawn) {
                      signatureDataUrl = signatureCanvas.toDataURL('image/png')
                    }
                  }
                  
                  handleUpdateOrderStatus(selectedConfirmOrder.id, 'delivered', signatureDataUrl, photoBase64 || "")
                }}
                className="flex-[2] h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase italic tracking-widest gap-1.5 shadow-lg shadow-emerald-500/10 text-xs"
              >
                <CheckCircle2 size={14} /> Concluir Entrega
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
