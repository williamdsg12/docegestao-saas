"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useBusiness } from "@/hooks/useBusiness"
import { usePlanLimits } from "@/hooks/usePlanLimits"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { 
  Plus, Search, CheckCircle2, Truck, X, FileText, 
  Calendar as CalendarIcon, ChevronRight, ChevronLeft, 
  Flame, Clock, SearchX, ShoppingBag, Bell, 
  Volume2, VolumeX, User
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO 
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { criarEntregaSeNaoExistir } from "@/lib/services/delivery"
import { OrderCard } from "@/components/orders/OrderCard"
import { OrderFilters } from "@/components/orders/OrderFilters"
import { FeatureGuard } from "@/components/dashboard/FeatureGuard"

const NOTIFICATION_SOUND = "/sounds/notificacao.mp3"

type OrderStatus = "novo" | "em_preparo" | "pronto" | "saiu_entrega" | "entregue" | "cancelado" | "orcamento" | "confirmado"

interface Order {
  id: string
  customer_id: string
  product_name: string
  total: number
  deposit_value: number
  status: OrderStatus
  delivery_date: string
  installments: number
  created_at: string
  customers?: { name: string }
}

const statusConfig: Record<string, any> = {
  novo: { label: "Novo", color: "text-amber-500", icon: ShoppingBag, bg: "bg-amber-50", border: "border-amber-200" },
  em_preparo: { label: "Preparando", color: "text-blue-600", icon: Flame, bg: "bg-blue-50", border: "border-blue-200" },
  pronto: { label: "Pronto", color: "text-purple-600", icon: CheckCircle2, bg: "bg-purple-50", border: "border-purple-200" },
  saiu_entrega: { label: "Em Rota", color: "text-orange-600", icon: Truck, bg: "bg-orange-50", border: "border-orange-200" },
  entregue: { label: "Entregue", color: "text-green-600", icon: CheckCircle2, bg: "bg-green-50", border: "border-green-200" },
  cancelado: { label: "Cancelado", color: "text-rose-600", icon: X, bg: "bg-rose-50", border: "border-rose-200" },
  orcamento: { label: "Orçamento", color: "text-slate-500", icon: FileText, bg: "bg-slate-100", border: "border-slate-200" },
  confirmado: { label: "Confirmado", color: "text-emerald-600", icon: CheckCircle2, bg: "bg-emerald-50", border: "border-emerald-200" },
}

export default function PedidosPage() {
  return (
    <FeatureGuard feature="pedidos" planRequired="pro">
      <PedidosContent />
    </FeatureGuard>
  )
}

function PedidosContent() {
  const { profile } = useBusiness()
  const { canAddOrder, refreshLimits } = usePlanLimits()
  const [orders, setOrders] = useState<Order[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("todos")
  const [newOrderOpen, setNewOrderOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [isSoundEnabled, setIsSoundEnabled] = useState(false)

  const [orderData, setOrderData] = useState({
    client_id: "", product_name: "", total_value: "", deposit_value: "0", 
    delivery_date: "", installments: "1"
  })

  useEffect(() => {
    if (profile?.tenant_id || profile?.company_id) {
      fetchData()
      const channel = setupRealtime()
      return () => { channel.unsubscribe() }
    }
  }, [profile])

  function setupRealtime() {
    const tenantId = profile?.tenant_id || profile?.company_id
    return supabase.channel('orders-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` }, (payload) => {
          if (isSoundEnabled) new Audio(NOTIFICATION_SOUND).play().catch(() => {})
          toast.info(`🔥 NOVO PEDIDO: R$ ${payload.new.total?.toFixed(2)}`)
          fetchData()
          refreshLimits()
      })
      .subscribe()
  }

  async function fetchData() {
    const tenantId = profile?.tenant_id || profile?.company_id
    if (!tenantId) return
    try {
      setLoading(true)
      const [ordRes, cliRes, prodRes] = await Promise.all([
        supabase.from('orders').select('*').eq('tenant_id', tenantId).order('delivery_date', { ascending: true }),
        supabase.from('customers').select('id, name').eq('tenant_id', tenantId).order('name'),
        supabase.from('products').select('id, name, price').eq('tenant_id', tenantId).order('name')
      ])
      const customersData = cliRes.data || []
      setOrders(ordRes.data?.map((o: any) => ({
        ...o, customers: { name: customersData.find((c: any) => c.id === o.customer_id)?.name || 'Cliente comum' }
      })) || [])
      setClients(customersData)
      setProducts(prodRes.data || [])
    } finally { setLoading(false) }
  }

  async function handleSaveOrder() {
    if (!editingOrder && !canAddOrder()) return toast.error("Limite atingido!")
    try {
      const payload = {
        customer_id: orderData.client_id, product_name: orderData.product_name,
        total: parseFloat(orderData.total_value), deposit_value: parseFloat(orderData.deposit_value),
        delivery_date: orderData.delivery_date, installments: parseInt(orderData.installments),
      }
      if (editingOrder) await supabase.from('orders').update(payload).eq('id', editingOrder.id)
      else await supabase.from('orders').insert({ ...payload, tenant_id: profile?.tenant_id || profile?.company_id, status: 'novo' })
      fetchData()
      handleCloseModal()
      toast.success("Pedido salvo!")
    } catch (e) { toast.error("Erro ao salvar") }
  }

  const handleCloseModal = () => {
    setNewOrderOpen(false)
    setEditingOrder(null)
    setOrderData({ client_id: "", product_name: "", total_value: "", deposit_value: "0", delivery_date: "", installments: "1" })
  }

  async function handleDeleteOrder(id: string) {
    if (!confirm("Excluir?")) return
    await supabase.from('orders').delete().eq('id', id)
    setOrders(prev => prev.filter(o => o.id !== id))
    toast.success("Excluído!")
  }

  async function handleUpdateStatus(orderId: string, newStatus: OrderStatus) {
    try {
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
      if (newStatus === "pronto") await criarEntregaSeNaoExistir(supabase, { id: orderId, empresa_id: profile?.tenant_id || profile?.company_id })
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      toast.success("Status atualizado!")
    } catch (e) { toast.error("Erro") }
  }

  const filtered = orders.filter(o => {
    const matchSearch = (o.customers?.name || "").toLowerCase().includes(search.toLowerCase()) || (o.product_name || "").toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "todos" || o.status === filterStatus
    return matchSearch && matchStatus
  })

  const statusCounts: any = { total: orders.length }
  orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1 })

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth), monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart), endDate = endOfWeek(monthEnd)
    const rows = []
    let days = [], day = startDate
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const d = day, dayOrders = orders.filter(o => isSameDay(parseISO(o.delivery_date), d))
        days.push(
          <div key={d.toString()} className={cn("min-h-[100px] p-2 border border-slate-100 transition-all cursor-pointer hover:bg-slate-50", !isSameMonth(d, monthStart) && "opacity-30", isSameDay(d, selectedDate) && "bg-rose-50 ring-1 ring-rose-200")} onClick={() => setSelectedDate(d)}>
            <span className={cn("text-xs font-black", isSameDay(d, new Date()) ? "bg-rose-500 text-white px-1.5 rounded" : "text-slate-400")}>{format(d, "d")}</span>
            <div className="mt-1 space-y-1">{dayOrders.slice(0, 2).map(o => <div key={o.id} className="text-[8px] font-bold bg-white border border-slate-100 p-1 rounded truncate">{o.product_name}</div>)}</div>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(<div className="grid grid-cols-7" key={day.toString()}>{days}</div>); days = []
    }
    return <div className="rounded-2xl overflow-hidden border border-slate-200">{rows}</div>
  }

  return (
    <div className="space-y-8 pb-20">
      <OrderFilters 
        search={search}
        setSearch={setSearch}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isSoundEnabled={isSoundEnabled}
        setIsSoundEnabled={setIsSoundEnabled}
        onNewOrder={() => setNewOrderOpen(true)}
        statusCounts={statusCounts}
        statusConfig={statusConfig}
      />

      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(o => <OrderCard key={o.id} order={o} onUpdateStatus={handleUpdateStatus} onDelete={handleDeleteOrder} onShare={(o) => window.open(`https://wa.me/?text=${encodeURIComponent(`Pedido: ${o.product_name}`)}`)} />)}
            {filtered.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 font-black uppercase text-[10px] italic bg-slate-50 rounded-3xl border-2 border-dashed">Nenhum pedido encontrado</div>}
          </motion.div>
        ) : (
          <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft size={18} /></Button>
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight size={18} /></Button>
                </div>
                <h2 className="text-xl font-bold text-slate-900 uppercase italic">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</h2>
              </div>
              {renderCalendar()}
            </div>
            <div className="space-y-6">
              <Card className="p-6 rounded-3xl border-none bg-slate-900 text-white shadow-xl">
                <h3 className="text-sm font-black uppercase italic mb-4">Pedidos em {format(selectedDate, "dd/MM")}</h3>
                <div className="space-y-3">
                  {orders.filter(o => isSameDay(parseISO(o.delivery_date), selectedDate)).map(o => (
                    <div key={o.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-1 cursor-pointer" onClick={() => { setEditingOrder(o); setOrderData({ client_id: o.customer_id, product_name: o.product_name, total_value: o.total.toString(), deposit_value: (o.deposit_value || 0).toString(), delivery_date: o.delivery_date?.split('T')[0], installments: o.installments?.toString() || "1" }); setNewOrderOpen(true) }}>
                      <span className="text-xs font-bold text-white truncate">{o.product_name}</span>
                      <span className="text-[10px] text-slate-400 truncate">{o.customers?.name} • R$ {o.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={newOrderOpen} onOpenChange={setNewOrderOpen}>
        <DialogContent className="sm:max-w-lg rounded-[32px] p-8">
          <DialogHeader className="mb-6"><DialogTitle className="text-2xl font-black uppercase italic">{editingOrder ? 'Editar' : 'Novo'} Pedido</DialogTitle></DialogHeader>
          <div className="space-y-5 font-bold">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase text-slate-400">Cliente</Label>
              <select className="w-full h-12 rounded-xl border-slate-100 bg-slate-50 px-4 text-sm" value={orderData.client_id} onChange={e => setOrderData({ ...orderData, client_id: e.target.value })}><option value="">Selecione</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase text-slate-400">Produto</Label>
              <select className="w-full h-12 rounded-xl border-slate-100 bg-slate-50 px-4 text-sm" value={orderData.product_name} onChange={e => { const p = products.find(p => p.name === e.target.value); setOrderData({ ...orderData, product_name: e.target.value, total_value: p ? p.price.toString() : orderData.total_value }) }}><option value="">Selecione</option>{products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[10px] uppercase text-slate-400">Total (R$)</Label><Input type="number" className="h-12 rounded-xl" value={orderData.total_value} onChange={e => setOrderData({ ...orderData, total_value: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-[10px] uppercase text-slate-400">Entrada (R$)</Label><Input type="number" className="h-12 rounded-xl" value={orderData.deposit_value} onChange={e => setOrderData({ ...orderData, deposit_value: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label className="text-[10px] uppercase text-slate-400">Data de Entrega</Label><Input type="datetime-local" className="h-12 rounded-xl" value={orderData.delivery_date} onChange={e => setOrderData({ ...orderData, delivery_date: e.target.value })} /></div>
            <Button onClick={handleSaveOrder} className="w-full h-14 rounded-2xl bg-rose-500 font-black uppercase text-white shadow-lg">Salvar Pedido</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
