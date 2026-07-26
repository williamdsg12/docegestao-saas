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
import { cn } from "@/lib/utils"

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

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
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

  // Real-time dispatch call overlay states
  const [activeDispatchCall, setActiveDispatchCall] = useState<any | null>(null)
  const [dispatchOrderDetails, setDispatchOrderDetails] = useState<any | null>(null)
  const [countdown, setCountdown] = useState<number>(20)
  const lastCoordsRef = useRef<{ latitude: number; longitude: number; timestamp: number } | null>(null)

  // Real-time chat states
  const [chatOrderId, setChatOrderId] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState("")

  const audioContextRef = useRef<AudioContext | null>(null)
  const alarmIntervalRef = useRef<number | null>(null)
  const vibrationIntervalRef = useRef<number | null>(null)

  // Synthetic alarm beep loops
  const startSyntheticAlarm = useCallback(() => {
    if (alarmIntervalRef.current) return
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return
      const ctx = new AudioContextClass()
      audioContextRef.current = ctx

      const playBeep = () => {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {})
        }
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(880, ctx.currentTime)
        gain.gain.setValueAtTime(0.3, ctx.currentTime)

        osc.start(ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
        osc.stop(ctx.currentTime + 0.15)

        setTimeout(() => {
          const osc2 = ctx.createOscillator()
          const gain2 = ctx.createGain()
          osc2.connect(gain2)
          gain2.connect(ctx.destination)
          osc2.type = 'sawtooth'
          osc2.frequency.setValueAtTime(880, ctx.currentTime)
          gain2.gain.setValueAtTime(0.3, ctx.currentTime)

          osc2.start(ctx.currentTime)
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
          osc2.stop(ctx.currentTime + 0.15)
        }, 200)
      }

      playBeep()
      alarmIntervalRef.current = window.setInterval(playBeep, 1000)
    } catch (err) {
      console.error("Error starting synthetic audio alarm:", err)
    }

    if (navigator.vibrate) {
      navigator.vibrate([400, 200, 400])
      vibrationIntervalRef.current = window.setInterval(() => {
        navigator.vibrate([400, 200, 400])
      }, 2000)
    }
  }, [])

  const stopSyntheticAlarm = useCallback(() => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current)
      alarmIntervalRef.current = null
    }
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current)
      vibrationIntervalRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
  }, [])

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

  const handleIncomingDispatch = useCallback(async (dispatch: any) => {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*, tenants!company_id(*), customers!customer_id(name, phone), addresses!address_id(*)')
        .eq('id', dispatch.order_id)
        .single()

      if (error || !order) {
        console.error("Error fetching order for dispatch:", error)
        return
      }

      setActiveDispatchCall(dispatch)
      setDispatchOrderDetails(order)

      const secondsLeft = Math.max(0, Math.floor((new Date(dispatch.expires_at).getTime() - Date.now()) / 1000))
      setCountdown(secondsLeft)

      startSyntheticAlarm()

      // Trigger browser push notification
      import("@/lib/services/notifications").then(({ NotificationService }) => {
        NotificationService.showLocalNotification(
          "Nova corrida disponível! 🛵",
          `Estabelecimento: ${order.tenants?.name || "Doce Gestão"}\nValor: R$ ${Number(order.total || 0).toFixed(2)}`
        )
      })
    } catch (err) {
      console.error(err)
    }
  }, [startSyntheticAlarm])

  // Respond to Dispatch Offer
  async function respondToDispatch(accept: boolean) {
    if (!activeDispatchCall) return
    const status = accept ? 'accepted' : 'rejected'

    try {
      const { error } = await supabase
        .from('delivery_dispatches')
        .update({ status })
        .eq('id', activeDispatchCall.id)

      if (error) throw error

      if (accept) {
        toast.success("Corrida aceita com sucesso!")
        fetchAssignedOrders()
      } else {
        toast.success("Chamada recusada.")
      }
    } catch (err) {
      console.error("Error responding to dispatch:", err)
      toast.error("Erro ao responder chamada")
    } finally {
      setActiveDispatchCall(null)
      setDispatchOrderDetails(null)
      stopSyntheticAlarm()
    }
  }

  // Monitor dispatches Realtime and Initial Check
  useEffect(() => {
    if (!driver || driver.status !== 'online') {
      setActiveDispatchCall(null)
      setDispatchOrderDetails(null)
      return
    }

    const channel = supabase
      .channel(`driver-dispatches-${driver.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'delivery_dispatches',
        filter: `driver_id=eq.${driver.id}`
      }, (payload) => {
        const dispatch = payload.new
        if (dispatch.status === 'pending') {
          handleIncomingDispatch(dispatch)
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'delivery_dispatches',
        filter: `driver_id=eq.${driver.id}`
      }, (payload) => {
        const dispatch = payload.new
        if (dispatch.status !== 'pending') {
          setActiveDispatchCall(null)
          setDispatchOrderDetails(null)
        }
      })
      .subscribe()

    async function checkPendingDispatches() {
      if (!driver) return
      const { data } = await supabase
        .from('delivery_dispatches')
        .select('*')
        .eq('driver_id', driver.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        const expiresAt = new Date(data[0].expires_at).getTime()
        if (expiresAt > Date.now()) {
          handleIncomingDispatch(data[0])
        }
      }
    }
    checkPendingDispatches()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [driver, handleIncomingDispatch])

  // Countdown timer effect
  useEffect(() => {
    if (!activeDispatchCall) {
      stopSyntheticAlarm()
      return
    }

    const interval = setInterval(() => {
      const secondsLeft = Math.max(0, Math.floor((new Date(activeDispatchCall.expires_at).getTime() - Date.now()) / 1000))
      setCountdown(secondsLeft)

      if (secondsLeft <= 0) {
        setActiveDispatchCall(null)
        setDispatchOrderDetails(null)
        stopSyntheticAlarm()
      }
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [activeDispatchCall, stopSyntheticAlarm])

  // Real-time Chat Load & Subscription in Driver Page
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
        if (payload.new.sender_type !== 'driver') {
          import("@/lib/services/notifications").then(({ NotificationService }) => {
            NotificationService.showLocalNotification(
              "Nova mensagem da loja 💬",
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
        sender_id: driver?.id,
        sender_type: 'driver',
        message: msg
      })

    if (error) {
      console.error("Error sending message:", error)
      toast.error("Erro ao enviar mensagem")
    }
  }

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

  // Live telemetry push with GPS mock and velocity checks
  const sendLocationUpdate = useCallback(async (lat: number, lng: number, speed: number | null, heading: number | null, mocked: boolean) => {
    if (!driver) return

    let isMocked = mocked
    const now = Date.now()
    if (lastCoordsRef.current) {
      const dist = calculateDistance(
        lastCoordsRef.current.latitude,
        lastCoordsRef.current.longitude,
        lat,
        lng
      ) * 1000 // meters
      const timeDiff = (now - lastCoordsRef.current.timestamp) / 1000 // seconds
      if (timeDiff > 2) {
        const computedSpeed = dist / timeDiff
        if (computedSpeed > 35) { // 35 m/s is ~126 km/h
          isMocked = true
          toast.warning("Velocidade de deslocamento suspeita detectada!", {
            description: "Seu GPS pode estar sendo simulado ou instável."
          })
        }
      }
    }
    lastCoordsRef.current = { latitude: lat, longitude: lng, timestamp: now }

    // 1. Update database coordinates for driver dashboard list
    await supabase
      .from('delivery_drivers')
      .update({
        latitude: lat,
        longitude: lng,
        last_update: new Date().toISOString()
      })
      .eq('id', driver.id)

    // 2. Append directly to driver_locations history log
    await supabase
      .from('driver_locations')
      .insert({
        driver_id: driver.id,
        latitude: lat,
        longitude: lng,
        speed: speed !== null ? Number(speed) : null,
        heading: heading !== null ? Number(heading) : null,
        is_mocked: isMocked
      })

    // 3. If there are active deliveries ON_ROUTE, post coordinates for client map tracking
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
            heading: heading || 0,
            isMocked: isMocked
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
        const mocked = (position.coords as any).mocked || (position as any).mocked || false
        sendLocationUpdate(latitude, longitude, speed, heading, mocked)
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
                  <Button 
                    variant="outline"
                    onClick={() => setChatOrderId(order.id)}
                    className="w-full h-10 rounded-xl border-slate-800 text-pink-500 hover:bg-pink-500/10 font-bold text-[10px] uppercase gap-1"
                  >
                    <MessageCircle size={12} /> Chat Interno (Loja)
                  </Button>

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

      {/* iFood-Style Incoming Call Overlay */}
      {activeDispatchCall && dispatchOrderDetails && (
        <div className="fixed inset-0 bg-slate-950 z-[9999] flex flex-col justify-between p-6 animate-in fade-in zoom-in duration-200">
          {/* Top Banner / Store Details */}
          <div className="flex flex-col items-center text-center mt-12 space-y-4">
            <div className="size-20 bg-pink-500 rounded-[32px] flex items-center justify-center text-white text-3xl font-black italic shadow-2xl shadow-pink-500/20 animate-bounce">
              <Truck size={36} />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
                Nova Chamada Disponível
              </span>
              <h2 className="text-2xl font-black uppercase italic tracking-tight text-white pt-2">
                {dispatchOrderDetails.tenants?.name || "Doce Gestão"}
              </h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                {dispatchOrderDetails.tenants?.street 
                  ? `${dispatchOrderDetails.tenants.street}, ${dispatchOrderDetails.tenants.number}` 
                  : "Endereço da Loja"}
              </p>
            </div>
          </div>

          {/* Center Details: Value, Distance & Countdown */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-4">
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block leading-none">
                    Valor do Pedido
                  </span>
                  <span className="text-2xl font-black italic text-white leading-none">
                    R$ {Number(dispatchOrderDetails.total || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block leading-none">
                    Pagamento
                  </span>
                  <span className="text-sm font-bold text-pink-400 uppercase tracking-wide">
                    {dispatchOrderDetails.payment_method || "PIX"}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Cliente
                  </span>
                  <p className="text-sm font-bold text-slate-300">
                    {dispatchOrderDetails.customers?.name || "Cliente"}
                  </p>
                </div>
                <div className="flex-1 text-right">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Destino
                  </span>
                  <p className="text-xs font-bold text-slate-300 truncate">
                    {dispatchOrderDetails.endereco_entrega || 
                     (dispatchOrderDetails.addresses 
                       ? `${dispatchOrderDetails.addresses.neighborhood}, ${dispatchOrderDetails.addresses.city}`
                       : "Retirada")}
                  </p>
                </div>
              </div>
            </div>

            {/* Countdown Slider Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-400">
                <span>Tempo restante</span>
                <span className="text-pink-500 font-mono text-sm">{countdown}s</span>
              </div>
              <div className="h-3 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-600 transition-all duration-1000 ease-linear"
                  style={{ width: `${(countdown / 20) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Button 
              onClick={() => respondToDispatch(false)}
              className="h-16 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-[24px] font-black uppercase tracking-widest text-xs"
            >
              Recusar
            </Button>
            <Button 
              onClick={() => respondToDispatch(true)}
              className="h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[24px] font-black uppercase italic tracking-widest text-sm shadow-lg shadow-emerald-500/20 animate-pulse"
            >
              Aceitar
            </Button>
          </div>
        </div>
      )}

      {/* Floating Chat Drawer overlay */}
      {chatOrderId && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-slate-900 border-l border-white/10 z-[9999] flex flex-col animate-in slide-in-from-right duration-300">
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
              const isMe = msg.sender_type === 'driver'
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
