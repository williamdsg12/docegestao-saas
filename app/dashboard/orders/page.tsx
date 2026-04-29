"use client"

import { useState, useEffect, useMemo } from "react"
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
  DollarSign,
  AlertCircle,
  Calendar,
  CreditCard
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
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { 
  initSound, 
  startAlert, 
  stopAlert, 
  requestNotificationPermission, 
  sendBrowserNotification, 
  vibrateDevice 
} from "@/lib/notifications"
import { useOrders } from "@/hooks/useOrders"
import { OrderDetailsModal } from "@/components/dashboard/orders/OrderDetailsModal"
import { useQueryClient } from "@tanstack/react-query"

const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
  novo: { label: "Novo", color: "bg-amber-50 text-amber-600 border-amber-100", icon: Clock },
  waiting_payment: { label: "Aguardando Pagamento", color: "bg-rose-50 text-rose-600 border-rose-100", icon: CreditCard },
  paid: { label: "Pago", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: CheckCircle2 },
  em_preparo: { label: "Em Preparo", color: "bg-blue-50 text-blue-600 border-blue-100", icon: AlertCircle },
  pronto: { label: "Pronto", color: "bg-purple-50 text-purple-600 border-purple-100", icon: CheckCircle2 },
  saiu_entrega: { label: "Saiu p/ Entrega", color: "bg-pink-50 text-primary border-pink-100", icon: Truck },
  entregue: { label: "Entregue", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", color: "bg-slate-100 text-slate-400 border-slate-200", icon: XCircle },
}

export default function OnlineOrdersPage() {
  const { profile } = useBusiness()
  const companyId = profile?.company_id
  const queryClient = useQueryClient()
  
  const { data: orders = [], isLoading: loading, updateStatus } = useOrders(companyId)
  
  const [search, setSearch] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isAlertEnabled, setIsAlertEnabled] = useState(false)
  const [isFlashing, setIsFlashing] = useState(false)

  // Realtime subscription using TanStack Query Invalidation
  useEffect(() => {
    if (!companyId) return

    const channel = supabase
      .channel('orders_realtime_page')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'orders',
        filter: `company_id=eq.${companyId}`
      }, (payload: any) => {
        const newOrder = payload.new
        
        if (isAlertEnabled) {
          startAlert()
          sendBrowserNotification(newOrder)
          vibrateDevice()
          setIsFlashing(true)
          setTimeout(() => {
            stopAlert()
            setIsFlashing(false)
          }, 15000)
        }

        queryClient.invalidateQueries({ queryKey: ["orders", companyId] })
        toast.success("Novo pedido recebido! 🚀")
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders',
        filter: `company_id=eq.${companyId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["orders", companyId] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [companyId, isAlertEnabled, queryClient])

  const filteredOrders = useMemo(() => 
    orders.filter((o: any) => 
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.id.includes(search)
    ).slice(0, 50), // Performance: limit DOM elements
  [orders, search])

  const stats = useMemo(() => ([
    { label: "Pendentes", value: orders.filter((o: any) => o.status === 'novo').length, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Em Preparo", value: orders.filter((o: any) => o.status === 'em_preparo').length, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Saiu p/ Entrega", value: orders.filter((o: any) => o.status === 'saiu_entrega').length, color: "text-primary", bg: "bg-pink-50" },
    { label: "Total Receita", value: `R$ ${orders.reduce((acc: number, o: any) => acc + o.total, 0).toFixed(2)}`, color: "text-emerald-500", bg: "bg-emerald-50" },
  ]), [orders])

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2 uppercase italic leading-none">
            Pedidos <span className="text-primary tracking-tighter">Online</span>
          </h1>
          <p className="text-slate-500 font-medium">Acompanhe em tempo real os pedidos vindos do seu cardápio digital.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
           <Button 
             variant={isAlertEnabled ? "outline" : "default"}
             className={cn(
               "h-12 rounded-xl font-bold transition-all gap-2",
               !isAlertEnabled && "bg-rose-500 hover:bg-rose-600 text-white animate-bounce",
               isAlertEnabled && "bg-emerald-50 text-emerald-600 border-emerald-100"
             )}
             onClick={async () => {
               initSound()
               const granted = await requestNotificationPermission()
               setIsAlertEnabled(true)
               if (granted) toast.success("Alertas e notificações ativados!")
               else toast.info("Som ativado! (Notificações bloqueadas)")
             }}
           >
             {isAlertEnabled ? <CheckCircle2 className="size-5" /> : <CreditCard className="size-5" />}
             {isAlertEnabled ? "Alertas Ativados" : "Ativar Alertas iFood"}
           </Button>

           <div className="relative group max-w-sm">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Buscar cliente ou ID..." 
              className="h-12 w-64 rounded-xl border-slate-200 bg-white pl-12 font-medium shadow-sm transition-all focus:w-80"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["orders", companyId] })} className="h-12 rounded-xl bg-white border-slate-200 font-bold">
            <Clock className="size-4 mr-2" /> Atualizar
          </Button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes iFoodPulse {
          0% { background-color: #e11d48; }
          50% { background-color: #f43f5e; }
          100% { background-color: #e11d48; }
        }
        .animate-ifood-flash {
          animation: iFoodPulse 0.5s infinite;
        }
      `}</style>

      {/* Flashing Alert Banner */}
      <AnimatePresence>
        {isFlashing && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full text-white p-4 text-center font-black uppercase italic tracking-widest animate-ifood-flash rounded-2xl shadow-xl shadow-rose-200 flex items-center justify-center gap-4 border-4 border-white"
          >
            <AlertCircle className="size-8" />
            <span className="text-xl">VOCÊ TEM NOVO PEDIDO!</span>
            <AlertCircle className="size-8" />
            <Button 
               variant="secondary" 
               className="ml-4 rounded-full bg-white text-rose-600 hover:bg-slate-100 font-black h-8 px-6"
               onClick={() => {
                 stopAlert()
                 setIsFlashing(false)
               }}
            >
              ESTOU VENDO
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className={cn("p-6 rounded-[32px] border border-slate-200 shadow-sm transition-all hover:translate-y-[-4px]", stat.bg)}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
            <p className={cn("text-2xl font-black italic tracking-tighter", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="rounded-[40px] border border-slate-200 bg-white overflow-hidden shadow-sm mt-8 relative">
        {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center font-black uppercase text-xs italic tracking-widest text-slate-400 animate-pulse">Carregando Pedidos...</div>}
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
              {filteredOrders.map((order: any, i: number) => {
                const StatusIcon = statusConfig[order.status]?.icon || AlertCircle
                return (
                  <motion.tr 
                    key={order.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
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
            {!loading && filteredOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-20 text-center font-black uppercase italic text-slate-300 tracking-widest">Nenhum pedido encontrado</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <OrderDetailsModal 
        order={selectedOrder}
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onUpdateStatus={async (id, status) => {
          await updateStatus({ orderId: id, newStatus: status })
          // If the order being viewed is the one updated, we might need to sync if not using Query's direct data
        }}
      />
    </div>
  )
}
