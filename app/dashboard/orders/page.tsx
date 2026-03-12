"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useBusiness } from "@/hooks/useBusiness"
import { 
  ShoppingCart, 
  Search, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  ChevronRight, 
  Phone, 
  MapPin, 
  DollarSign,
  AlertCircle,
  Eye,
  Printer,
  Calendar
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
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
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  price: number
  options: any[]
}

interface Order {
  id: string
  customer_name: string
  customer_phone: string
  customer_address: string
  customer_cep: string
  delivery_fee: number
  subtotal: number
  total: number
  payment_method: string
  payment_status: string
  status: string
  notes: string
  created_at: string
  menu_order_items?: OrderItem[]
}

const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
  pending: { label: "Pendente", color: "bg-amber-50 text-amber-600 border-amber-100", icon: Clock },
  preparing: { label: "Preparando", color: "bg-blue-50 text-blue-600 border-blue-100", icon: AlertCircle },
  ready: { label: "Pronto", color: "bg-indigo-50 text-indigo-600 border-indigo-100", icon: CheckCircle2 },
  delivering: { label: "Em Entrega", color: "bg-pink-50 text-primary border-pink-100", icon: Truck },
  delivered: { label: "Entregue", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: CheckCircle2 },
  canceled: { label: "Cancelado", color: "bg-slate-100 text-slate-400 border-slate-200", icon: XCircle },
}

export default function OnlineOrdersPage() {
  const { user } = useAuth()
  const { profile } = useBusiness()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  useEffect(() => {
    if (profile?.company_id) {
      fetchOrders()
      const subscription = subscribeToOrders()
      return () => {
        subscription.unsubscribe()
      }
    }
  }, [profile])

  async function fetchOrders() {
    if (!profile?.company_id) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('menu_orders')
        .select('*, menu_order_items(*)')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error: any) {
      console.error("Error fetching orders:", error.message)
      toast.error("Erro ao carregar pedidos")
    } finally {
      setLoading(false)
    }
  }

  function subscribeToOrders() {
    if (!profile?.company_id) return { unsubscribe: () => {} }
    return supabase
      .channel('menu_orders_realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'menu_orders',
        filter: `company_id=eq.${profile.company_id}`
      }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new as Order, ...prev])
          toast.success("Novo pedido recebido! 🎂", {
            description: `De: ${payload.new.customer_name}`,
            duration: 10000,
          })
          // Play notification sound
          const audio = new Audio('/notification.mp3')
          audio.play().catch(() => {})
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map((o: Order) => o.id === payload.new.id ? { ...o, ...payload.new } : o))
        }
      })
      .subscribe()
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('menu_orders')
        .update({ status: newStatus })
        .eq('id', orderId)
      
      if (error) throw error
      toast.success("Status atualizado!")
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null)
      }
    } catch (error) {
      toast.error("Erro ao atualizar status")
    }
  }

  const filteredOrders = orders.filter((o: Order) => 
    o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    o.id.includes(search)
  )

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2 uppercase italic leading-none">
            Pedidos <span className="text-primary tracking-tighter">Online</span>
          </h1>
          <p className="text-slate-500 font-medium">Acompanhe em tempo real os pedidos vindos do seu cardápio digital.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative group max-w-sm">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Buscar cliente ou ID..." 
              className="h-12 w-64 rounded-xl border-slate-200 bg-white pl-12 font-medium shadow-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={fetchOrders} className="h-12 rounded-xl bg-white border-slate-200 font-bold">
            <Clock className="size-4 mr-2" /> Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Pendentes", value: orders.filter((o: Order) => o.status === 'pending').length, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Em Preparo", value: orders.filter((o: Order) => o.status === 'preparing').length, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Saiu p/ Entrega", value: orders.filter((o: Order) => o.status === 'delivering').length, color: "text-primary", bg: "bg-pink-50" },
          { label: "Total Hoje", value: `R$ ${orders.reduce((acc: number, o: Order) => acc + o.total, 0).toFixed(2)}`, color: "text-emerald-500", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <div key={i} className={cn("p-6 rounded-[32px] border border-slate-200 shadow-sm transition-all hover:scale-105", stat.bg)}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
            <p className={cn("text-2xl font-black italic tracking-tighter", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="rounded-[40px] border border-slate-200 bg-white overflow-hidden shadow-sm mt-8">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-100 italic">
              <TableHead className="py-5 pl-8 text-[10px] font-black uppercase tracking-widest text-slate-400">ID Pedido</TableHead>
              <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente / Telefone</TableHead>
              <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Total</TableHead>
              <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
              <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Data / Hora</TableHead>
              <TableHead className="py-5 pr-8 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order: Order, i: number) => {
                const StatusIcon = statusConfig[order.status]?.icon || AlertCircle
                return (
                  <motion.tr 
                    key={order.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedOrder(order)
                      setIsDetailsOpen(true)
                    }}
                  >
                    <TableCell className="py-6 pl-8">
                      <span className="font-black text-slate-400 uppercase text-[10px]">#{order.id.slice(0, 8)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 uppercase italic tracking-tight">{order.customer_name}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{order.customer_phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-slate-900 italic tracking-tighter text-lg">
                      R$ {order.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-none flex items-center gap-2 w-fit", statusConfig[order.status]?.color)}>
                        <StatusIcon className="size-3" />
                        {statusConfig[order.status]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase italic">
                        <Calendar className="size-3 text-slate-300" />
                        {format(new Date(order.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell className="pr-8 text-right">
                       <Button variant="ghost" size="icon" className="size-9 rounded-xl bg-slate-50 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                        <ChevronRight className="size-5" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-3xl rounded-[40px] p-0 overflow-hidden border-none shadow-2xl">
          {selectedOrder && (
            <div className="flex flex-col h-full max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,47,129,0.15),transparent)] pointer-events-none" />
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400">ID: #{selectedOrder.id.slice(0, 8)}</span>
                    <Badge className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase border-none", statusConfig[selectedOrder.status]?.color)}>
                      {statusConfig[selectedOrder.status]?.label}
                    </Badge>
                  </div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{selectedOrder.customer_name}</h2>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="size-12 rounded-2xl bg-white/5 border-white/10 text-white hover:bg-white/10">
                    <Printer className="size-5" />
                  </Button>
                  <Button variant="outline" size="icon" className="size-12 rounded-2xl bg-white/5 border-white/10 text-white hover:bg-white/10">
                    <Eye className="size-5" />
                  </Button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left Column: Items */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <ShoppingCart className="size-4" /> Itens do Pedido
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.menu_order_items?.map((item: OrderItem, idx: number) => (
                        <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                          <div className="flex justify-between mb-2">
                            <span className="font-black text-slate-900 uppercase italic text-sm">{item.quantity}x {item.product_name}</span>
                            <span className="font-black text-primary italic">R$ {(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                          {item.options && (
                            <div className="flex flex-wrap gap-1">
                              {/* Option rendering here if structured */}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Totals */}
                    <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                        <span>Subtotal</span>
                        <span>R$ {selectedOrder.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                        <span>Taxa de Entrega</span>
                        <span>R$ {selectedOrder.delivery_fee.toFixed(2)}</span>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-sm font-black uppercase tracking-widest text-slate-900">Total</span>
                        <span className="text-2xl font-black text-primary italic">R$ {selectedOrder.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Info */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <MapPin className="size-4" /> Endereço e Contato
                    </h3>
                    <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                          <Phone className="size-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400">Telefone</p>
                          <p className="font-bold text-slate-900">{selectedOrder.customer_phone}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                          <MapPin className="size-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400">Endereço</p>
                          <p className="font-bold text-slate-900 leading-tight">{selectedOrder.customer_address || "Retirada no Local"}</p>
                          <p className="text-xs text-slate-500 font-medium">CEP: {selectedOrder.customer_cep || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                          <DollarSign className="size-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400">Pagamento</p>
                          <div className="flex gap-2 items-center">
                            <span className="font-bold text-slate-900 uppercase">{selectedOrder.payment_method}</span>
                            <Badge className={cn("px-2 py-0.5 rounded-full text-[8px] font-black", 
                              selectedOrder.payment_status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                              {selectedOrder.payment_status === 'paid' ? "Pago" : "Pendente"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedOrder.notes && (
                      <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 italic text-sm text-amber-700 font-medium">
                        <p className="text-[10px] font-black uppercase text-amber-500 mb-1 not-italic">Observações:</p>
                        "{selectedOrder.notes}"
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer: Action Buttons */}
              <div className="p-8 bg-white border-t border-slate-200">
                <div className="flex flex-wrap gap-3">
                  {selectedOrder.status === 'pending' && (
                    <Button 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'preparing')}
                      className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic tracking-widest text-xs"
                    >
                      Aceitar & Preparar
                    </Button>
                  )}
                  {selectedOrder.status === 'preparing' && (
                    <Button 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'ready')}
                      className="flex-1 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase italic tracking-widest text-xs"
                    >
                      Marcar como Pronto
                    </Button>
                  )}
                  {selectedOrder.status === 'ready' && (
                    <Button 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'delivering')}
                      className="flex-1 h-14 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-black uppercase italic tracking-widest text-xs"
                    >
                      Sair para Entrega
                    </Button>
                  )}
                   {selectedOrder.status === 'delivering' && (
                    <Button 
                    onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                    className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase italic tracking-widest text-xs"
                    >
                      Finalizar Entrega
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => updateOrderStatus(selectedOrder.id, 'canceled')}
                    className="h-14 px-8 rounded-2xl border-slate-200 text-slate-400 font-bold hover:bg-rose-50 hover:text-rose-500"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
