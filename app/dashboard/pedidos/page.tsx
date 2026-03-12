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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Truck,
  FileText,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Flame,
  Clock,
  SearchX,
  ShoppingBag,
  Download,
  MessageCircle,
  User
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  parseISO
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

type OrderStatus = "orcamento" | "confirmado" | "producao" | "finalizado" | "entregue"

interface Order {
  id: string
  client_id: string
  product_name: string
  total_value: number
  deposit_value: number
  status: OrderStatus
  delivery_date: string
  installments: number
  created_at: string
  clients?: { name: string }
}

const statusConfig: Record<OrderStatus, { label: string, color: string, icon: any, bg: string, iconBg: string, border: string }> = {
  orcamento: { label: "Orçamento", color: "text-slate-500", icon: FileText, bg: "bg-slate-100", iconBg: "bg-slate-400", border: "border-slate-200" },
  confirmado: { label: "Confirmado", color: "text-blue-600", icon: CheckCircle2, bg: "bg-blue-50", iconBg: "bg-blue-400", border: "border-blue-200" },
  producao: { label: "Produção", color: "text-amber-600", icon: Flame, bg: "bg-amber-50", iconBg: "bg-amber-400", border: "border-amber-200" },
  finalizado: { label: "Finalizado", color: "text-primary", icon: CheckCircle2, bg: "bg-rose-50", iconBg: "bg-primary/80", border: "border-rose-200" },
  entregue: { label: "Entregue", color: "text-green-600", icon: Truck, bg: "bg-green-50", iconBg: "bg-green-400", border: "border-green-200" },
}

export default function PedidosPage() {
  const { user } = useAuth()
  const { profile } = useBusiness()
  const { limits, canAddOrder, refreshLimits } = usePlanLimits()
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

  // New Order Form
  const [orderData, setOrderData] = useState({
    client_id: "",
    product_name: "",
    total_value: "",
    deposit_value: "0",
    delivery_date: "",
    installments: "1"
  })

  useEffect(() => {
    if (profile?.company_id) {
      fetchData()
    }
  }, [profile])

  async function fetchData() {
    if (!profile?.company_id) return
    try {
      setLoading(true)
      const [ordRes, cliRes, prodRes] = await Promise.all([
        supabase.from('orders').select('*').eq('company_id', profile.company_id).order('delivery_date', { ascending: true }),
        supabase.from('clients').select('id, name').eq('company_id', profile.company_id).order('name'),
        supabase.from('products').select('id, name, price').eq('company_id', profile.company_id).order('name')
      ])

      if (ordRes.error) throw ordRes.error
      if (cliRes.error) throw cliRes.error
      if (prodRes.error) throw prodRes.error

      const clientsData = cliRes.data || []
      const ordersData = ordRes.data?.map((o: any) => ({
        ...o,
        clients: { name: clientsData.find((c: any) => c.id === o.client_id)?.name || 'Cliente Desconhecido' }
      })) || []

      setOrders(ordersData)
      setClients(clientsData)
      setProducts(prodRes.data || [])
    } catch (error: any) {
      console.error("Error fetching orders:", error.message || error)
      toast.error("Erro ao carregar pedidos")
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveOrder() {
    if (!editingOrder && !canAddOrder()) {
      toast.error(`Limite do plano ${limits.plan_name} atingido (${limits.max_orders} pedidos). Faça upgrade para continuar!`)
      return
    }

    if (!orderData.client_id || !orderData.product_name || !orderData.total_value) {
      toast.error("Preencha os campos obrigatórios")
      return
    }

    try {
      if (editingOrder) {
        const { error } = await supabase
          .from('orders')
          .update({
            client_id: orderData.client_id,
            product_name: orderData.product_name,
            total_value: parseFloat(orderData.total_value),
            deposit_value: parseFloat(orderData.deposit_value),
            delivery_date: orderData.delivery_date,
            installments: parseInt(orderData.installments),
          })
          .eq('id', editingOrder.id)

        if (error) throw error

        toast.success("Pedido atualizado com sucesso!")
        fetchData() // Refresh to get relations
      } else {
        const { data, error } = await supabase
          .from('orders')
          .insert({
            user_id: user?.id,
            company_id: profile?.company_id,
            client_id: orderData.client_id,
            product_name: orderData.product_name,
            total_value: parseFloat(orderData.total_value),
            deposit_value: parseFloat(orderData.deposit_value),
            delivery_date: orderData.delivery_date,
            installments: parseInt(orderData.installments),
            status: 'confirmado'
          })
          .select('*')
          .single()

        if (error) throw error
        const clientName = clients.find(c => c.id === data.client_id)?.name || 'Cliente Desconhecido'
        const newOrder = { ...data, clients: { name: clientName } }
        setOrders(prev => [newOrder, ...prev])
        toast.success("Pedido criado com sucesso!")
        refreshLimits() // Update plan usage
      }
      
      handleCloseModal()
    } catch (error: any) {
      console.error("Error saving order:", error.message || error)
      toast.error("Erro ao salvar pedido")
    }
  }

  const handleCloseModal = () => {
    setNewOrderOpen(false)
    setEditingOrder(null)
    setOrderData({
      client_id: "",
      product_name: "",
      total_value: "",
      deposit_value: "0",
      delivery_date: "",
      installments: "1"
    })
  }

  async function handleDeleteOrder(id: string) {
    if (!window.confirm("Deseja realmente excluir este pedido?")) return
    try {
      const { error } = await supabase.from('orders').delete().eq('id', id)
      if (error) throw error
      setOrders(prev => prev.filter(o => o.id !== id))
      toast.success("Pedido excluído!")
      refreshLimits()
    } catch (error: any) {
      console.error("Error deleting:", error.message || error)
      toast.error("Erro ao excluir pedido")
    }
  }

  async function handleUpdateStatus(orderId: string, newStatus: OrderStatus) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      toast.success("Status atualizado!")
    } catch (error: any) {
      console.error("Error updating status:", error.message || error)
      toast.error("Erro ao atualizar status")
    }
  }

  const handleWhatsAppShare = (order: Order) => {
    const text = `Olá ${order.clients?.name || 'Cliente'}! Aqui é da DoceGestão. Passando para confirmar seu pedido de *${order.product_name}* para o dia *${new Date(order.delivery_date).toLocaleDateString()}*. Valor: R$ ${order.total_value.toFixed(2)}. Aguardamos sua confirmação!`
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const filtered = orders.filter((o) => {
    const matchSearch = (o.clients?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.product_name || "").toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "todos" || o.status === filterStatus
    return matchSearch && matchStatus
  })

  const statusCounts = {
    total: orders.length,
    orcamento: orders.filter((o: Order) => o.status === "orcamento").length,
    confirmado: orders.filter((o: Order) => o.status === "confirmado").length,
    producao: orders.filter((o: Order) => o.status === "producao").length,
    finalizado: orders.filter((o: Order) => o.status === "finalizado").length,
    entregue: orders.filter((o: Order) => o.status === "entregue").length,
  }

  const renderCalendarHeader = () => {
    return (
      <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="rounded-xl hover:bg-rose-50 text-primary">
          <ChevronLeft className="size-5" />
        </Button>
        <span className="text-sm font-black uppercase italic min-w-[140px] text-center">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="rounded-xl hover:bg-rose-50 text-primary">
          <ChevronRight className="size-5" />
        </Button>
      </div>
    )
  }

  const renderCalendarDays = () => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
    return (
      <div className="grid grid-cols-7 mb-4">
        {days.map((day) => (
          <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
            {day}
          </div>
        ))}
      </div>
    )
  }

  const renderCalendarCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const rows = []
    let days = []
    let day = startDate
    let formattedDate = ""

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d")
        const cloneDay = day
        const dayOrders = orders.filter(o => isSameDay(parseISO(o.delivery_date), cloneDay))

        days.push(
          <motion.div
            key={day.toString()}
            whileHover={{ y: -2 }}
            className={cn(
              "relative min-h-[100px] p-2 border border-slate-100 bg-white transition-all cursor-pointer hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20",
              !isSameMonth(day, monthStart) ? "bg-slate-50 opacity-40" : "",
              isSameDay(day, selectedDate) ? "ring-2 ring-primary ring-inset z-10" : ""
            )}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <span className={cn(
              "text-xs font-black",
              isSameDay(day, new Date()) ? "size-6 flex items-center justify-center bg-primary text-white rounded-lg shadow-lg shadow-primary/20" : "text-slate-400"
            )}>
              {formattedDate}
            </span>

            <div className="mt-2 space-y-1 overflow-hidden h-14">
              {dayOrders.slice(0, 2).map((order) => {
                const cfg = statusConfig[order.status]
                return (
                  <div
                    key={order.id}
                    className={cn(
                      "px-1.5 py-0.5 text-[8px] font-bold rounded-md truncate border",
                      cfg.bg, cfg.border
                    )}
                  >
                    {order.product_name}
                  </div>
                )
              })}
              {dayOrders.length > 2 && (
                <div className="text-[7px] font-black text-slate-400 text-center uppercase">
                  +{dayOrders.length - 2}
                </div>
              )}
            </div>
          </motion.div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      )
      days = []
    }
    return <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm">{rows}</div>
  }

  const selectedDayOrders = orders.filter(o => isSameDay(parseISO(o.delivery_date), selectedDate))

  return (
    <div className="space-y-12 pb-24">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-2 uppercase italic leading-none">
            Gestão de <span className="text-primary tracking-tighter">Pedidos</span>
          </h1>
          <p className="text-slate-500 font-medium">Controle sua produção e encante seus clientes com organização absoluta.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* View Switcher */}
          <div className="flex bg-slate-100/50 p-1.5 rounded-[22px] border border-slate-200/50 backdrop-blur-sm">
            <Button
              variant="ghost"
              onClick={() => setViewMode('list')}
              className={cn(
                "h-11 px-6 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all",
                viewMode === 'list' ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Lista
            </Button>
            <Button
              variant="ghost"
              onClick={() => setViewMode('calendar')}
              className={cn(
                "h-11 px-6 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all",
                viewMode === 'calendar' ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Calendário
            </Button>
          </div>

          <Dialog open={newOrderOpen} onOpenChange={(val) => {
            if (!val) handleCloseModal()
            else setNewOrderOpen(true)
          }}>
            <DialogTrigger asChild>
              <Button className="h-14 px-10 rounded-[20px] bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95">
                <Plus className="mr-2 size-5" />
                Novo Pedido
                {limits.max_orders < 99999 && (
                  <span className="ml-2 text-[8px] bg-white/20 px-1.5 py-0.5 rounded-md">
                    {limits.current_orders}/{limits.max_orders}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl border-white/60 bg-white/90 backdrop-blur-2xl p-10 rounded-[40px] shadow-2xl overflow-hidden">
              <div className="absolute -top-24 -right-24 size-48 bg-primary/10 rounded-full blur-3xl" />
              <DialogHeader className="mb-8 relative z-10">
                <DialogTitle className="text-3xl font-black tracking-tighter uppercase italic">
                  Criar Novo <span className="text-primary italic">Pedido</span>
                </DialogTitle>
                <p className="text-slate-500 text-sm font-medium">Preencha os dados abaixo para registrar a encomenda.</p>
              </DialogHeader>

              <div className="grid gap-8 relative z-10">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cliente</Label>
                    <select
                      className="w-full h-14 border-rose-100 bg-rose-50/30 rounded-2xl px-5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer text-slate-900"
                      value={orderData.client_id}
                      onChange={e => setOrderData({ ...orderData, client_id: e.target.value })}
                    >
                      <option value="">Selecione um cliente</option>
                      {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Produto</Label>
                    <select
                      className="w-full h-14 border-rose-100 bg-rose-50/30 rounded-2xl px-5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer text-slate-900"
                      value={orderData.product_name}
                      onChange={e => {
                        const prod = products.find(p => p.name === e.target.value)
                        setOrderData({
                          ...orderData,
                          product_name: e.target.value,
                          total_value: prod ? prod.price.toString() : orderData.total_value
                        })
                      }}
                    >
                      <option value="">Selecione um produto</option>
                      {products.map((p: any) => <option key={p.id} value={p.name}>{p.name}</option>)}
                      <option value="custom">Outro (digitar...)</option>
                    </select>
                  </div>
                </div>

                {orderData.product_name === 'custom' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <Input
                      placeholder="Nome do produto personalizado"
                      className="h-14 border-rose-100 bg-rose-50/30 rounded-2xl px-5 font-bold text-slate-900"
                      onChange={e => setOrderData({ ...orderData, product_name: e.target.value })}
                    />
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Valor Total</Label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                      <Input
                        type="number"
                        className="h-14 border-rose-100 bg-rose-50/30 rounded-2xl pl-12 focus:ring-primary/10 font-bold text-slate-900"
                        value={orderData.total_value}
                        onChange={e => setOrderData({ ...orderData, total_value: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sinal / Entrada</Label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                      <Input
                        type="number"
                        className="h-14 border-rose-100 bg-rose-50/30 rounded-2xl pl-12 focus:ring-primary/10 font-bold text-slate-900"
                        value={orderData.deposit_value}
                        onChange={e => setOrderData({ ...orderData, deposit_value: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Data Prevista para Entrega</Label>
                  <Input
                    type="date"
                    className="h-14 border-rose-100 bg-rose-50/30 rounded-2xl px-5 focus:ring-primary/10 font-bold text-slate-900"
                    value={orderData.delivery_date}
                    onChange={e => setOrderData({ ...orderData, delivery_date: e.target.value })}
                  />
                </div>

                <Button
                  onClick={handleSaveOrder}
                  className="h-14 mt-4 rounded-2xl bg-gradient-to-r from-primary to-rose-500 hover:from-primary/90 hover:to-rose-600 font-black text-lg shadow-xl shadow-primary/20 text-white uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95"
                >
                  Confirmar Pedido ✨
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* View Switcher Controls for Calendar (Month navigation) */}
      {viewMode === 'calendar' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center gap-6"
        >
          {renderCalendarHeader()}
          <div className="flex-1 h-px bg-slate-200 hidden md:block" />
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest hidden lg:block">Navegue pelos meses para planejar sua produção</p>
        </motion.div>
      )}

      {/* Filter & Search Bar (Only for List view) */}
      {viewMode === 'list' && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-3 pb-2 overflow-x-auto scrollbar-hide">
            {(["total", "orcamento", "confirmado", "producao", "finalizado", "entregue"] as const).map((key, i) => {
              const isActive = (key === "total" && filterStatus === "todos") || filterStatus === key
              const config = key !== "total" ? statusConfig[key] : { label: "Todos", color: "text-primary", icon: Search, bg: "bg-white/50" }

              return (
                <motion.button
                  key={key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setFilterStatus(key === "total" ? "todos" : key)}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all duration-500 whitespace-nowrap group",
                    isActive
                      ? "bg-primary text-white border-primary shadow-xl shadow-primary/20"
                      : "bg-white/40 backdrop-blur-md border-white/60 text-slate-500 hover:border-primary/30 hover:bg-white/60"
                  )}
                >
                  <config.icon className={cn("size-4 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-primary")} />
                  <span className="text-xs font-black uppercase tracking-widest">{config.label}</span>
                  <Badge className={cn("ml-2 rounded-lg font-black border-none transition-colors", isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary")}>
                    {statusCounts[key]}
                  </Badge>
                </motion.button>
              )
            })}
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-5 top-1/2 size-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Pesquisar por cliente, produto ou ID..."
                className="h-14 rounded-3xl border-white/60 bg-white/40 backdrop-blur-md pl-14 text-slate-900 placeholder:text-slate-400 focus:ring-8 focus:ring-primary/5 focus:border-primary/20 transition-all shadow-xl shadow-rose-200/5"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button variant="outline" className="h-14 px-8 rounded-3xl border-white bg-white/40 backdrop-blur-md text-slate-600 hover:text-primary font-black uppercase tracking-widest text-[10px] shadow-lg border">
                <Download className="mr-2 size-4" />
                Exportar
              </Button>
              <Button variant="outline" className="size-14 rounded-3xl border-white bg-white/40 backdrop-blur-md text-slate-600 hover:text-primary shadow-lg border">
                <Filter className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="min-h-[500px]">
        {viewMode === 'list' ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((order, i) => {
                const config = statusConfig[order.status]
                const balance = order.total_value - order.deposit_value
                const progress = (order.deposit_value / order.total_value) * 100

                return (
                  <motion.div
                    layout
                    key={order.id}
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    transition={{ delay: i * 0.05, type: "spring", stiffness: 100 }}
                    className="group relative flex flex-col overflow-hidden rounded-[40px] border border-white/60 bg-white/40 backdrop-blur-xl p-8 hover:shadow-[0_20px_50px_rgba(244,114,182,0.15)] transition-all duration-500 hover:-translate-y-2"
                  >
                    {/* Status Indicator Bar */}
                    <div className={cn("absolute top-0 left-0 right-0 h-2 opacity-80", config.iconBg)} />

                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className={cn("flex size-14 items-center justify-center rounded-2xl text-white shadow-xl shadow-primary/20 transform rotate-[-3deg] group-hover:rotate-0 transition-transform duration-500", config.iconBg)}>
                          <config.icon className="size-7" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID: #{order.id.slice(0, 8)}</p>
                          <Badge className={cn("px-4 py-1.5 border-none font-black text-[10px] uppercase rounded-full shadow-sm", config.bg, config.color)}>
                            {config.label}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full hover:bg-white/50 text-slate-400 hover:text-primary transition-all"
                          onClick={() => handleWhatsAppShare(order)}
                        >
                          <MessageCircle className="size-6" />
                        </Button>
                      </div>
                    </div>

                    <div className="mb-8 space-y-2">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-none truncate group-hover:text-primary transition-colors">
                        {order.clients?.name || "Cliente S/ Nome"}
                      </h3>
                      <p className="text-sm font-bold text-slate-500 line-clamp-1">{order.product_name}</p>
                    </div>

                    <div className="mt-auto space-y-6">
                      <div className="flex items-center justify-between p-4 rounded-3xl bg-white/50 border border-white/40 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-2xl bg-rose-50 flex items-center justify-center text-primary">
                            <CalendarIcon className="size-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entrega</p>
                            <p className="text-sm font-black text-slate-800 tracking-tight">
                              {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString("pt-BR") : "S/ data"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</p>
                          <p className="text-lg font-black text-primary tracking-tighter">R$ {order.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>

                      {/* Payment Progress */}
                      <div className="space-y-2 px-2">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Pagamento</span>
                          <span className={cn("text-xs font-black", balance > 0 ? "text-rose-500" : "text-green-500")}>
                            {balance > 0 ? `Pendente R$ ${balance.toFixed(2)}` : "Quitado 100%"}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-white/50">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={cn("h-full transition-all duration-1000", balance > 0 ? "bg-rose-400" : "bg-green-400")}
                          />
                        </div>
                      </div>

                      {/* Quick Actions Card Footer */}
                      <div className="flex flex-col gap-3 pt-4 border-t border-rose-100/30">
                        <select
                          className="h-12 w-full bg-white/60 border-rose-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer shadow-sm text-slate-900"
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                        >
                          {Object.entries(statusConfig).map(([status, cfg]) => (
                            <option key={status} value={status}>{cfg.label}</option>
                          ))}
                        </select>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            onClick={() => {
                              setEditingOrder(order)
                              setOrderData({
                                client_id: order.client_id,
                                product_name: order.product_name,
                                total_value: order.total_value.toString(),
                                deposit_value: order.deposit_value.toString(),
                                delivery_date: order.delivery_date || "",
                                installments: order.installments.toString()
                              })
                              setNewOrderOpen(true)
                            }}
                            className="h-12 rounded-2xl bg-white hover:bg-primary hover:text-white text-primary border border-primary/20 font-black uppercase tracking-widest text-[10px] shadow-sm transition-all active:scale-95">
                            Editar
                          </Button>
                          <Button
                            onClick={() => handleDeleteOrder(order.id)}
                            variant="destructive"
                            className="h-12 rounded-2xl bg-white hover:bg-rose-600 hover:text-white text-rose-500 border border-rose-100 font-black uppercase tracking-widest text-[10px] shadow-sm transition-all active:scale-95">
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {filtered.length === 0 && !loading && (
              <div className="col-span-full py-32 text-center flex flex-col items-center justify-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="size-32 bg-rose-50 rounded-[40px] flex items-center justify-center text-primary mb-8 animate-pulse"
                >
                  <SearchX className="size-16" />
                </motion.div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Nenhum pedido encontrado</h3>
                <p className="text-slate-500 mt-4 max-w-sm font-medium">Não encontramos pedidos para o filtro ou termo pesquisado. Tente novamente ou crie um novo pedido!</p>
                <Button
                  onClick={() => setNewOrderOpen(true)}
                  variant="link"
                  className="mt-6 text-primary font-black uppercase tracking-widest text-xs"
                >
                  + Criar primeiro pedido
                </Button>
              </div>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-8"
          >
            <div className="lg:col-span-3">
              {renderCalendarDays()}
              {renderCalendarCells()}
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">
                    {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </h2>
                  <Badge className="bg-primary text-white font-black size-8 rounded-full flex items-center justify-center p-0">{selectedDayOrders.length}</Badge>
                </div>

                <div className="space-y-4">
                  {selectedDayOrders.length > 0 ? (
                    selectedDayOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => {
                          setEditingOrder(order)
                          setOrderData({
                            client_id: order.client_id,
                            product_name: order.product_name,
                            total_value: order.total_value.toString(),
                            deposit_value: order.deposit_value.toString(),
                            delivery_date: order.delivery_date || "",
                            installments: order.installments.toString()
                          })
                          setNewOrderOpen(true)
                        }}
                        className="group p-5 rounded-3xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-primary/20 transition-all cursor-pointer shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="size-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm border border-slate-100 group-hover:bg-primary group-hover:text-white transition-colors">
                            <ShoppingBag className="size-5" />
                          </div>
                          <Badge variant="outline" className={cn("text-[9px] uppercase font-black tracking-widest border-none px-3 py-1", statusConfig[order.status].bg, statusConfig[order.status].color)}>
                            {statusConfig[order.status].label}
                          </Badge>
                        </div>
                        <h3 className="text-base font-black text-slate-900 group-hover:text-primary transition-colors truncate mb-1">
                          {order.product_name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-tight">
                          <User className="size-3.5" />
                          {order.clients?.name || 'Cliente comum'}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-20">
                      <div className="size-20 rounded-[32px] bg-slate-50 flex items-center justify-center mx-auto mb-6 border border-slate-100 border-dashed">
                        <CalendarIcon className="size-10 text-slate-200" />
                      </div>
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                        Nenhum pedido <br /> para este dia
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setOrderData({ ...orderData, delivery_date: format(selectedDate, "yyyy-MM-dd") })
                          setNewOrderOpen(true)
                        }}
                        className="mt-6 h-12 px-8 rounded-2xl border-dashed text-slate-500 hover:text-primary hover:border-primary font-bold transition-all"
                      >
                        <Plus className="size-5 mr-2" />
                        Agendar
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 rounded-[40px] p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 size-40 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl transition-transform group-hover:scale-110" />
                <h4 className="text-base font-black text-white uppercase italic mb-4 flex items-center gap-3 relative z-10">
                  <Clock className="size-5 text-primary" />
                  Lembrete de Hoje
                </h4>
                <p className="text-sm text-slate-400 font-medium leading-relaxed relative z-10">
                  Você tem <span className="text-white font-bold">{orders.filter(o => isSameDay(parseISO(o.delivery_date), new Date())).length} entregas</span> hoje. <br /><br />
                  Verifique se todos os pedidos já estão na fase de finalização para garantir a entrega pontual.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Mobile Floating Action Button Premium */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-10 right-10 z-50 md:hidden"
      >
        <Button
          onClick={() => setNewOrderOpen(true)}
          className="size-20 rounded-[32px] bg-gradient-to-br from-primary to-rose-600 hover:to-rose-700 shadow-2xl shadow-primary/40 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 hover:rotate-12"
        >
          <Plus className="size-10" />
        </Button>
      </motion.div>
    </div>
  )
}
