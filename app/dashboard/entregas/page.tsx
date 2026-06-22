"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  MapPin,
  Truck,
  CheckCircle2,
  Navigation,
  Phone,
  MessageCircle,
  ShoppingBag,
  DollarSign,
  AlertCircle,
  Clock,
  ChevronRight,
  Zap,
  ArrowRight,
  User,
  Plus,
  Trash2,
  Image,
  RefreshCcw,
  Check
} from "lucide-react"
import { useBusiness } from "@/hooks/useBusiness"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { formatAddress } from "@/lib/formatters"
import { FeatureGuard } from "@/components/dashboard/FeatureGuard"

function DeliveryTimeline({ status }: { status: string }) {
  const steps = [
    { id: 'pronto', label: 'Coleta', icon: ShoppingBag },
    { id: 'a_caminho', label: 'Trânsito', icon: Truck },
    { id: 'chegou', label: 'Chegou', icon: MapPin },
    { id: 'finalizado', label: 'Entregue', icon: CheckCircle2 },
  ]

  const getCurrentStepIndex = () => {
    if (status === 'finalizado') return 3
    if (status === 'chegou') return 2
    if (status === 'a_caminho' || status === 'saiu_entrega') return 1
    return 0
  }

  const currentIdx = getCurrentStepIndex()

  return (
    <div className="relative flex justify-between items-center w-full px-4 mb-10">
      <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full" />
      <div 
        className="absolute top-1/2 left-0 h-1 bg-pink-500 -translate-y-1/2 rounded-full transition-all duration-1000" 
        style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}
      />
      
      {steps.map((step, idx) => {
        const Icon = step.icon
        const isDone = idx <= currentIdx
        const isActive = idx === currentIdx

        return (
          <div key={step.id} className="relative z-10 flex flex-col items-center">
            <div className={cn(
              "size-10 rounded-full flex items-center justify-center transition-all duration-500 border-4 border-white shadow-md",
              isDone ? "bg-pink-500 text-white" : "bg-white text-slate-300 border-slate-100"
            )}>
              <Icon className={cn("size-4", isActive && "animate-pulse")} />
            </div>
            <span className={cn(
              "absolute top-full mt-3 text-[8px] font-black uppercase tracking-widest whitespace-nowrap",
              isDone ? "text-slate-900" : "text-slate-400"
            )}>
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function EntregasPage() {
  return (
    <FeatureGuard feature="entregas" planRequired="pro">
      <EntregasContent />
    </FeatureGuard>
  )
}

function EntregasContent() {
  const { profile } = useBusiness()
  const companyId = profile?.tenant_id || profile?.company_id

  const [activeTab, setActiveTab] = useState<'entregas' | 'entregadores'>('entregas')
  const [orders, setOrders] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  // Couriers CRUD State
  const [couriers, setCouriers] = useState<any[]>([])
  const [loadingCouriers, setLoadingCouriers] = useState(true)
  const [newCourierName, setNewCourierName] = useState("")
  const [newCourierPhone, setNewCourierPhone] = useState("")
  const [newCourierVehicle, setNewCourierVehicle] = useState("Moto")
  const [newCourierPlate, setNewCourierPlate] = useState("")
  const [newCourierPhotoUrl, setNewCourierPhotoUrl] = useState("")

  const fetchDeliveryOrders = useCallback(async () => {
    if (!companyId) return
    try {
      setLoadingOrders(true)
      const { data, error } = await supabase
        .from('orders')
        .select('*, customers!customer_id(name, phone), addresses!address_id(*)')
        .eq('tenant_id', companyId)
        .in('order_status', ['pronto', 'a_caminho', 'chegou'])
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      // Normalize statuses
      const normalized = (data || []).map((o: any) => ({
        ...o,
        status: o.order_status || o.status
      }))
      setOrders(normalized)
    } catch (e: any) {
      console.error("Error fetching deliveries:", e.message)
      toast.error("Erro ao carregar entregas")
    } finally {
      setLoadingOrders(false)
    }
  }, [companyId])

  const fetchCouriers = useCallback(async () => {
    if (!companyId) return
    try {
      setLoadingCouriers(true)
      const { data, error } = await supabase
        .from('entregadores')
        .select('*')
        .eq('empresa_id', companyId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setCouriers(data || [])
    } catch (e: any) {
      console.error("Error fetching couriers:", e.message)
      toast.error("Erro ao carregar entregadores")
    } finally {
      setLoadingCouriers(false)
    }
  }, [companyId])

  useEffect(() => {
    if (companyId) {
      fetchDeliveryOrders()
      fetchCouriers()

      // Realtime subscription for orders
      const orderChannel = supabase
        .channel('delivery-orders-realtime')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `tenant_id=eq.${companyId}`
        }, () => {
          fetchDeliveryOrders()
        })
        .subscribe()

      // Realtime subscription for couriers
      const courierChannel = supabase
        .channel('couriers-realtime')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'entregadores',
          filter: `empresa_id=eq.${companyId}`
        }, () => {
          fetchCouriers()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(orderChannel)
        supabase.removeChannel(courierChannel)
      }
    }
  }, [companyId, fetchDeliveryOrders, fetchCouriers])

  // Courier Actions
  const handleAddCourier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCourierName || !newCourierPhone) {
      toast.error("Nome e telefone são obrigatórios.")
      return
    }

    try {
      const serializedName = JSON.stringify({
        nome: newCourierName,
        veiculo: newCourierVehicle,
        placa: newCourierPlate
      })

      const { error } = await supabase
        .from('entregadores')
        .insert({
          empresa_id: companyId,
          nome: serializedName,
          telefone: newCourierPhone,
          foto_url: newCourierPhotoUrl || null,
          status: 'disponivel'
        })

      if (error) throw error
      toast.success("Entregador adicionado com sucesso!")
      setNewCourierName("")
      setNewCourierPhone("")
      setNewCourierVehicle("Moto")
      setNewCourierPlate("")
      setNewCourierPhotoUrl("")
      fetchCouriers()
    } catch (e: any) {
      console.error("Error adding courier:", e.message)
      toast.error("Erro ao adicionar entregador")
    }
  }

  const handleDeleteCourier = async (id: string) => {
    try {
      const { error } = await supabase
        .from('entregadores')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success("Entregador removido.")
      fetchCouriers()
    } catch (e: any) {
      console.error("Error deleting courier:", e.message)
      toast.error("Erro ao remover entregador")
    }
  }

  const toggleCourierAvailability = async (courier: any) => {
    const nextStatus = courier.status === 'disponivel' ? 'offline' : 'disponivel'
    try {
      const { error } = await supabase
        .from('entregadores')
        .update({ status: nextStatus })
        .eq('id', courier.id)

      if (error) throw error
      toast.success(`Entregador agora está ${nextStatus === 'disponivel' ? 'disponível' : 'offline'}`)
      fetchCouriers()
    } catch (e: any) {
      console.error("Error updating courier status:", e.message)
      toast.error("Erro ao atualizar status do entregador")
    }
  }

  // Delivery Actions
  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      // 1. Update order table
      const { error: orderErr } = await supabase
        .from('orders')
        .update({ order_status: nextStatus })
        .eq('id', orderId)
      
      if (orderErr) throw orderErr

      // 2. Update delivery status in public.entregas
      const { error: deliveryErr } = await supabase
        .from('entregas')
        .update({ status: nextStatus })
        .eq('pedido_id', orderId)

      if (deliveryErr) {
        console.warn("Could not update entregas record, might not exist yet:", deliveryErr.message)
      }

      // Trigger chatbot notifications
      fetch('/api/chatbot/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: nextStatus })
      }).catch(err => console.error("Error notifying chatbot:", err))

      toast.success(`Pedido atualizado para ${nextStatus.toUpperCase()}`)
      fetchDeliveryOrders()
    } catch (e: any) {
      console.error("Error updating status:", e.message)
      toast.error("Erro ao atualizar status da entrega")
    }
  }

  const openGoogleMaps = (order: any) => {
    const address = order.delivery_address || order.addresses?.street || ''
    const number = order.delivery_number || order.addresses?.number || ''
    const neighborhood = order.delivery_neighborhood || order.addresses?.neighborhood || ''
    const city = order.delivery_city || order.addresses?.city || ''

    const parts = [address, number, neighborhood, city].filter(Boolean)

    if (parts.length === 0) {
      toast.error('Endereço não cadastrado')
      return
    }

    const fullAddress = parts.join(', ')
    const encoded = encodeURIComponent(fullAddress)
    const url = `https://www.google.com/maps/search/?api=1&query=${encoded}`
    window.open(url, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-slate-200/60 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2 justify-center lg:justify-start">
               <div className="size-2 bg-pink-500 rounded-full animate-ping" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Logistics & Command</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none text-center lg:text-left">
              Gestão de <span className="text-pink-500">Logística</span>
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
             {/* Navigation Tabs */}
             <div className="flex bg-slate-200/50 p-1 rounded-2xl border border-slate-100 w-full sm:w-auto">
                <button 
                  onClick={() => setActiveTab('entregas')}
                  className={cn(
                    "flex-1 sm:flex-initial h-10 px-6 rounded-xl font-black text-[10px] uppercase italic tracking-widest transition-all",
                    activeTab === 'entregas' ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Entregas ({orders.length})
                </button>
                <button 
                  onClick={() => setActiveTab('entregadores')}
                  className={cn(
                    "flex-1 sm:flex-initial h-10 px-6 rounded-xl font-black text-[10px] uppercase italic tracking-widest transition-all",
                    activeTab === 'entregadores' ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Entregadores ({couriers.length})
                </button>
             </div>
             
             {activeTab === 'entregas' && (
               <div className="px-6 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 w-full sm:w-auto justify-center">
                  <div className="text-center">
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">A Coletar</p>
                     <p className="text-lg font-black italic text-slate-900 leading-none">{orders.filter(o => o.status === 'pronto').length}</p>
                  </div>
                  <div className="w-px h-6 bg-slate-100" />
                  <div className="text-center">
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Em Trânsito</p>
                     <p className="text-lg font-black italic text-pink-500 leading-none">{orders.filter(o => ['a_caminho', 'chegou'].includes(o.status)).length}</p>
                  </div>
               </div>
             )}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'entregas' ? (
            <motion.div
              key="entregas"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
            >
              {orders.length > 0 ? (
                orders.map((order, idx) => (
                  <Card key={order.id} className="rounded-[40px] border-none shadow-xl shadow-slate-200/40 bg-white overflow-hidden p-6 flex flex-col min-h-[500px] hover:shadow-2xl transition-all duration-300">
                    <div className="flex justify-between items-start mb-6">
                      <Badge className={cn(
                        "px-3 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest border-none",
                        order.status === 'a_caminho' ? "bg-purple-100 text-purple-700 animate-pulse" : 
                        order.status === 'chegou' ? "bg-indigo-100 text-indigo-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {order.status === 'a_caminho' ? '🛵 em trânsito' : 
                         order.status === 'chegou' ? '📍 no local' : '✅ pronto p/ coleta'}
                      </Badge>
                      <span className="text-[9px] font-mono text-slate-300 uppercase">#{order.id.slice(-4).toUpperCase()}</span>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-tight mb-6">
                        {order.customers?.name || "Cliente"}
                      </h3>

                      <DeliveryTimeline status={order.status} />

                      <div className="space-y-3 mt-auto bg-slate-50 p-4 rounded-3xl border border-slate-100">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="size-4 text-pink-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Endereço de Entrega</p>
                            <p className="text-xs font-bold text-slate-700 leading-snug">
                              {order.delivery_address || order.addresses?.street || 'Endereço não informado'}, {order.delivery_number || order.addresses?.number || ''}
                              {order.delivery_neighborhood || order.addresses?.neighborhood ? ` - ${order.delivery_neighborhood || order.addresses?.neighborhood}` : ''}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="size-4 text-emerald-500" />
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Total à cobrar</span>
                          </div>
                          <span className="text-base font-black text-slate-900 italic">R$ {(order.total || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600 font-bold uppercase text-[9px] h-12"
                          onClick={() => window.open(`tel:${order.customers?.phone}`)}
                        >
                          <Phone className="size-3.5 mr-1" /> Ligar
                        </Button>
                        <Button 
                          variant="outline" 
                          className="rounded-xl border-slate-200 hover:bg-slate-50 text-emerald-600 font-bold uppercase text-[9px] h-12"
                          onClick={() => window.open(`https://wa.me/55${order.customers?.phone?.replace(/\D/g, '')}`)}
                        >
                          <MessageCircle className="size-3.5 mr-1" /> WhatsApp
                        </Button>
                      </div>

                      {order.status === 'pronto' ? (
                        <Button 
                          onClick={() => handleUpdateStatus(order.id, 'a_caminho')}
                          className="w-full h-14 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-black uppercase text-[10px] tracking-wider transition-all"
                        >
                          Iniciar Rota <ArrowRight className="ml-2 size-4 text-pink-500 animate-bounceHorizontal" />
                        </Button>
                      ) : order.status === 'a_caminho' ? (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            onClick={() => openGoogleMaps(order)}
                            className="h-14 w-14 rounded-xl border-slate-200 text-pink-500 shadow-sm shrink-0"
                          >
                            <Navigation className="size-5" />
                          </Button>
                          <Button 
                            onClick={() => handleUpdateStatus(order.id, 'chegou')}
                            className="flex-1 h-14 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase text-[10px] tracking-wider transition-all"
                          >
                            Cheguei no Local
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            onClick={() => openGoogleMaps(order)}
                            className="h-14 w-14 rounded-xl border-slate-200 text-pink-500 shadow-sm shrink-0"
                          >
                            <Navigation className="size-5" />
                          </Button>
                          <Button 
                            onClick={() => handleUpdateStatus(order.id, 'finalizado')}
                            className="flex-1 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-wider transition-all"
                          >
                            Finalizar Entrega
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              ) : !loadingOrders && (
                <div className="col-span-full py-28 flex flex-col items-center">
                   <div className="size-24 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm mb-6">
                      <Truck className="size-10" />
                   </div>
                   <h3 className="text-xl font-black text-slate-800 uppercase italic">Nenhuma entrega em curso</h3>
                   <p className="text-slate-400 font-medium italic mt-1 text-xs uppercase tracking-widest">Os pedidos aguardando entrega serão exibidos aqui.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="entregadores"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Register Courier Form */}
              <Card className="rounded-[40px] border-none shadow-xl shadow-slate-200/40 bg-white p-6 h-fit lg:col-span-1">
                <form onSubmit={handleAddCourier} className="space-y-5">
                  <div>
                    <h3 className="text-lg font-black uppercase italic text-slate-800">Cadastrar Entregador</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Adicione novos membros à frota</p>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Nome Completo</Label>
                    <Input 
                      value={newCourierName}
                      onChange={(e) => setNewCourierName(e.target.value)}
                      placeholder="Nome do entregador"
                      className="rounded-xl border-slate-200 h-11"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Telefone (WhatsApp)</Label>
                    <Input 
                      value={newCourierPhone}
                      onChange={(e) => setNewCourierPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="rounded-xl border-slate-200 h-11"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Veículo</Label>
                      <select 
                        value={newCourierVehicle}
                        onChange={(e) => setNewCourierVehicle(e.target.value)}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 font-bold text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300"
                      >
                        <option value="Moto">Moto</option>
                        <option value="Carro">Carro</option>
                        <option value="Bicicleta">Bicicleta</option>
                        <option value="Van">Van</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Placa</Label>
                      <Input 
                        value={newCourierPlate}
                        onChange={(e) => setNewCourierPlate(e.target.value)}
                        placeholder="ABC-1234"
                        className="rounded-xl border-slate-200 h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Foto URL (Opcional)</Label>
                    <Input 
                      value={newCourierPhotoUrl}
                      onChange={(e) => setNewCourierPhotoUrl(e.target.value)}
                      placeholder="https://..."
                      className="rounded-xl border-slate-200 h-11"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-black uppercase text-[10px] tracking-wider gap-2 shadow-lg shadow-pink-100"
                  >
                    <Plus size={14} /> Cadastrar Entregador
                  </Button>
                </form>
              </Card>

              {/* Courier List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider ml-1">Entregadores Cadastrados</h3>
                  <Button variant="ghost" onClick={fetchCouriers} className="text-slate-400 hover:text-slate-600 p-2"><RefreshCcw size={14} /></Button>
                </div>

                {loadingCouriers ? (
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] text-center py-10 animate-pulse">Buscando entregadores...</p>
                ) : couriers.length === 0 ? (
                  <div className="bg-white p-12 rounded-[40px] border border-slate-100 text-center shadow-sm">
                    <User size={32} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-bold text-sm">Nenhum entregador cadastrado.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {couriers.map((courier) => {
                      let displayName = courier.nome
                      let vehicle = ""
                      let plate = ""
                      try {
                        const parsed = JSON.parse(courier.nome)
                        displayName = parsed.nome
                        vehicle = parsed.veiculo
                        plate = parsed.placa
                      } catch (e) {
                        // fallback to plain text if not JSON
                      }

                      return (
                        <Card key={courier.id} className="rounded-[30px] border-none shadow-md bg-white p-5 hover:shadow-lg transition-all">
                          <div className="flex items-start gap-4">
                            <div className="size-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                              {courier.foto_url ? (
                                <img src={courier.foto_url} alt={displayName} className="size-full object-cover" />
                              ) : (
                                <User size={20} className="text-slate-400" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-black text-slate-800 uppercase italic leading-none mb-1.5 truncate">
                                {displayName}
                              </h4>
                              <p className="text-[10px] font-bold text-slate-500 leading-none mb-1">
                                📞 {courier.telefone}
                              </p>
                              {(vehicle || plate) && (
                                <p className="text-[9px] font-black text-pink-500 uppercase tracking-wide">
                                  {vehicle} {plate ? `[${plate}]` : ""}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                                <button
                                  onClick={() => toggleCourierAvailability(courier)}
                                  className={cn(
                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all",
                                    courier.status === 'disponivel' 
                                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                                      : "bg-slate-100 text-slate-400 border border-slate-200"
                                  )}
                                >
                                  <span className={cn("size-1.5 rounded-full", courier.status === 'disponivel' ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                                  {courier.status === 'disponivel' ? 'Disponível' : 'Offline'}
                                </button>
                                
                                <button 
                                  onClick={() => handleDeleteCourier(courier.id)}
                                  className="ml-auto p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
