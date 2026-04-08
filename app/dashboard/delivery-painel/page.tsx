"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useBusiness } from "@/hooks/useBusiness"
import { supabase } from "@/lib/supabase"
import { 
  Zap, 
  ChefHat, 
  ShoppingBag, 
  Truck, 
  Search, 
  Plus, 
  Printer, 
  ChevronRight,
  MessageCircle,
  MapPin,
  Clock,
  Phone,
  User as UserIcon,
  Package,
  Calendar,
  ExternalLink,
  X,
  Bell,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  ArrowRight,
  Filter,
  CreditCard,
  Check,
  Store,
  ArrowLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { format, differenceInMinutes, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { motion, AnimatePresence } from "framer-motion"
import { FeatureGuard } from "@/components/dashboard/FeatureGuard"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { PageFilters } from "@/components/dashboard/PageFilters"
import { PageSearch } from "@/components/dashboard/PageSearch"
import { EmptyStateV2 } from "@/components/dashboard/EmptyStateV2"

// --- CSS for Thermal Printing ---
const printStyles = `
@media print {
  @page {
    margin: 0;
    size: 80mm auto;
  }
  body * {
    visibility: hidden;
  }
  #print-receipt, #print-receipt * {
    visibility: visible;
  }
  #print-receipt {
    position: absolute;
    left: 0;
    top: 0;
    width: 80mm;
    padding: 5mm;
    background: white;
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    line-height: 1.2;
    color: black;
  }
  .dashed-line {
    border-top: 1px dashed black;
    margin: 5px 0;
    width: 100%;
  }
  .highlight {
    background: #FFEB3B !important;
    padding: 2px 5px;
    font-weight: bold;
    -webkit-print-color-adjust: exact;
  }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .bold { font-weight: bold; }
  .uppercase { text-transform: uppercase; }
  .mt-2 { margin-top: 8px; }
  .mb-2 { margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; border-bottom: 1px dashed black; padding: 3px 0; }
  td { padding: 3px 0; }
}
`

const statusColors: any = {
  pending: 'bg-rose-100 text-rose-600',
  accepted: 'bg-sky-100 text-sky-600',
  preparing: 'bg-amber-100 text-amber-600',
  ready: 'bg-indigo-100 text-indigo-600',
  out_for_delivery: 'bg-emerald-100 text-emerald-600',
  delivered: 'bg-slate-100 text-slate-400',
  cancelled: 'bg-slate-100 text-slate-400'
}

const statusLabels: any = {
  pending: 'Aguardando',
  accepted: 'Confirmado',
  preparing: 'Em preparo',
  ready: 'Pronto',
  out_for_delivery: 'Em entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado'
}

export default function GestorPedidos() {
  return (
    <FeatureGuard feature="delivery-painel" planRequired="pro">
      <div className="space-y-8 pb-20">
        <GestorPedidosContent />
      </div>
    </FeatureGuard>
  )
}

function GestorPedidosContent() {
  const { profile, business, loadingBusiness } = useBusiness()
  const [orders, setOrders] = useState<any[]>([])
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<string>("todos")
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const isMobile = useIsMobile()

  const toggleAudio = () => {
    if (!audioEnabled) {
       const audio = new Audio("/sounds/notificacao.mp3")
       audio.volume = 0
       audio.play().then(() => {
          setAudioEnabled(true)
          toast.success("Alertas sonoros ativados!")
       }).catch(() => {
          toast.error("Clique para ativar o som")
       })
    } else {
       setAudioEnabled(false)
    }
  }

  const fetchOrders = useCallback(async () => {
    if (!profile?.tenant_id) return
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, customers!customer_id(*), addresses!address_id(*)`)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setIsLoading(false)
    }
  }, [profile?.tenant_id])

  const playAlert = useCallback(() => {
    if (!audioEnabled) return
    const audio = new Audio("/sounds/notificacao.mp3")
    audio.play().catch(e => console.log("Sound alert blocked by browser"))
  }, [audioEnabled])

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
     try {
       const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
       if (error) throw error
       toast.success(`Status atualizado: ${newStatus}`)
       fetchOrders()
       if (selectedOrder?.id === orderId) {
         setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }))
       }
     } catch (error) { toast.error("Erro ao atualizar status") }
  }

  useEffect(() => {
    if (profile?.tenant_id) {
       fetchOrders()
       const subscription = supabase.channel('pedidos-manager')
         .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `tenant_id=eq.${profile.tenant_id}` }, () => {
            playAlert()
            toast.info("Novo pedido recebido!")
            fetchOrders()
         })
         .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${profile.tenant_id}` }, fetchOrders)
         .subscribe()
       return () => { supabase.removeChannel(subscription) }
    }
  }, [profile?.tenant_id, playAlert, fetchOrders])

  const filteredOrders = useMemo(() => {
     return orders.filter(o => {
        const matchSearch = o.customers?.name?.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search)
        const matchFilter = filterType === "todos" || (filterType === "pendente" && o.status === "pending") || (filterType === "em_curso" && ['accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status))
        return matchSearch && matchFilter
     })
  }, [orders, search, filterType])

  const getNextStatus = (current: string) => {
     const flow: any = { pending: 'accepted', accepted: 'preparing', preparing: 'ready', ready: 'out_for_delivery', out_for_delivery: 'delivered' }
     return flow[current] || null
  }

  const getStatusActionLabel = (status: string) => {
     const labels: any = { pending: 'Aceitar Pedido', accepted: 'Iniciar Preparo', preparing: 'Marcar como Pronto', ready: 'Despachar / Sair p/ Entrega', out_for_delivery: 'Confirmar Entrega' }
     return labels[status] || 'Finalizado'
  }

  const filterOptions = [
    { key: "todos", label: "Tudo", count: orders.length },
    { key: "pendente", label: "Pendentes", count: orders.filter(o => o.status === 'pending').length },
    { key: "em_curso", label: "Em Curso", count: orders.filter(o => ['accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)).length },
  ]

  if (loadingBusiness || (isLoading && !orders.length)) {
    return <div className="h-screen flex items-center justify-center bg-white font-black italic uppercase tracking-tighter text-2xl animate-pulse text-rose-500">Sincronizando Gestor DocesGestão...</div>
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PrintReceipt order={selectedOrder} business={business} />
      
      <PageHeader 
        title="Painel de" 
        highlight="Delivery" 
        subtitle="Gerencie seus pedidos em tempo real com agilidade e precisão"
        actions={(
          <div className="flex gap-3">
             <Button onClick={toggleAudio} variant="outline" className={cn("h-11 px-4 rounded-xl border-slate-100 font-black uppercase text-[10px] gap-2", audioEnabled ? "text-emerald-500 bg-emerald-50" : "text-slate-400")}>
                <Bell size={16} /> {audioEnabled ? "Som Ativo" : "Som Mudo"}
             </Button>
             <Button className="h-11 px-6 rounded-xl bg-slate-900 text-white font-black uppercase text-[10px] shadow-lg">
                <Plus size={16} className="mr-2" /> Novo Pedido
             </Button>
          </div>
        )}
      />

      <div className="space-y-6 mt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <PageFilters options={filterOptions} activeKey={filterType} onSelect={setFilterType} />
            <div className="flex items-center gap-4">
               <div className="text-right hidden md:block">
                  <p className="text-[9px] font-black uppercase text-slate-400 italic">Total em Aberto</p>
                  <p className="text-xl font-black italic text-slate-900 leading-none">R$ {orders.reduce((acc, current) => acc + (current.status !== 'delivered' ? Number(current.total) : 0), 0).toFixed(2).replace('.', ',')}</p>
               </div>
               <PageSearch value={search} onChange={setSearch} placeholder="Buscar por cliente ou ID..." className="md:max-w-xs" />
            </div>
        </div>

        <main className="flex-1 overflow-hidden relative flex flex-col gap-6">
           <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest italic">
                       <th className="py-6 px-8">Pedido</th>
                       <th className="py-6 px-8">Status</th>
                       <th className="py-6 px-8">Total</th>
                       <th className="py-6 px-8">Cliente / Destino</th>
                       <th className="py-6 px-8 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredOrders.map(order => (
                       <motion.tr 
                          key={order.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={cn(
                             "hover:bg-slate-50/50 transition-colors cursor-pointer group",
                             selectedOrder?.id === order.id && "bg-rose-50/20"
                          )}
                          onClick={() => { setSelectedOrder(order); setShowDetails(true); }}
                       >
                          <td className="py-6 px-8">
                             <div className="flex items-center gap-4">
                                <div className="size-10 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 italic text-sm">
                                   #{order.num_serial || order.id.slice(0, 3)}
                                </div>
                                <div className="min-w-0">
                                   <p className="text-xs font-black text-rose-500 uppercase italic leading-none">{order.num_serial ? `PEDIDO #${order.num_serial}` : 'Novo Pedido'}</p>
                                   <p className="text-[9px] font-bold text-slate-300 mt-1 uppercase italic">{format(new Date(order.created_at), 'HH:mm')}</p>
                                </div>
                             </div>
                          </td>
                          <td className="py-6 px-8">
                             <Badge className={cn("px-3 py-1 border-none text-[8px] font-black uppercase tracking-widest rounded-full italic", statusColors[order.status])}>
                                {statusLabels[order.status]}
                             </Badge>
                             <p className="text-[10px] font-bold text-slate-300 mt-1.5 uppercase italic ml-1">{order.order_type === 'entrega' ? '📦 Delivery' : '🏪 Retirada'}</p>
                          </td>
                          <td className="py-6 px-8 min-w-[130px]">
                             <p className="text-lg font-black text-slate-900 italic tracking-tighter whitespace-nowrap">R$ {Number(order.total).toFixed(2).replace('.', ',')}</p>
                             <div className="flex items-center gap-1.5 mt-1.5">
                                <div className={cn("size-1.5 rounded-full", order.payment_status === 'paid' ? "bg-emerald-500" : "bg-rose-300")} />
                                <span className={cn("text-[9px] font-black uppercase italic tracking-widest", order.payment_status === 'paid' ? "text-emerald-500" : "text-rose-300")}>{order.payment_method || 'PIX'}</span>
                             </div>
                          </td>
                          <td className="py-6 px-8">
                             <h4 className="font-black text-slate-800 uppercase italic tracking-tighter text-sm mb-1 group-hover:text-rose-500 transition-colors truncate">{order.customers?.name || "Cliente"}</h4>
                             <p className="text-[11px] font-bold text-slate-400 truncate flex items-center gap-2 italic">
                                <MapPin className="size-3 text-rose-500" /> {order.addresses?.street || order.endereco_entrega || 'Retirada'}
                             </p>
                          </td>
                          <td className="py-6 px-8 text-right">
                             <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                {order.status === 'pending' && (
                                   <Button onClick={() => handleStatusUpdate(order.id, 'accepted')} className="h-10 px-6 rounded-xl bg-rose-500 text-white font-black uppercase italic tracking-widest text-[9px] transition-all">Aceitar</Button>
                                )}
                                {getNextStatus(order.status) && order.status !== 'pending' && (
                                   <Button onClick={() => handleStatusUpdate(order.id, getNextStatus(order.status)!)} className="h-10 px-6 rounded-xl bg-white border border-slate-100 text-slate-900 font-black uppercase italic tracking-widest text-[9px] hover:bg-slate-50">{getStatusActionLabel(order.status).split(' ')[0]}</Button>
                                )}
                                <Button variant="ghost" size="icon" className="size-10 rounded-xl text-slate-300"><MoreVertical size={18} /></Button>
                             </div>
                          </td>
                       </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>

           {filteredOrders.length === 0 && !isLoading && (
              <EmptyStateV2 
                icon={Truck}
                title="Sem pedidos agora"
                subtitle="Seu balcão está livre para novas delícias. Que tal uma promoção?"
                action={<Button className="h-10 px-6 rounded-xl bg-rose-500 text-white font-black uppercase text-[10px]">Novo Pedido Manual</Button>}
              />
           )}
        </main>
      </div>

      {/* SIDE DRAWER */}
      <AnimatePresence>
        {showDetails && selectedOrder && (
           <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetails(false)} className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-[60]" />
              <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed right-0 top-0 bottom-0 w-full sm:w-[450px] bg-white shadow-2xl z-[70] flex flex-col border-l border-slate-100">
                 <header className="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                       <div className="size-14 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center text-rose-500 font-black italic text-xl">#{selectedOrder.num_serial || selectedOrder.id.slice(0, 3)}</div>
                       <div>
                          <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Detalhes do Pedido</h3>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 italic">{format(new Date(selectedOrder.created_at), 'dd MMM, HH:mm', { locale: ptBR })}</p>
                       </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowDetails(false)} className="rounded-2xl size-12 text-slate-300 hover:text-slate-900"><X size={24} /></Button>
                 </header>
                 
                 <ScrollArea className="flex-1 p-8">
                    <div className="space-y-10">
                       <div className="space-y-4">
                          <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">Estado Atual</span><Badge className={cn("px-4 py-1.5 border-none font-black text-[9px] uppercase tracking-widest italic", statusColors[selectedOrder.status])}>{statusLabels[selectedOrder.status]}</Badge></div>
                          <div className="h-2 flex gap-1.5 w-full">{['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'].map((s, idx) => (<div key={s} className={cn("h-full flex-1 rounded-full", idx <= ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'].indexOf(selectedOrder.status) ? "bg-rose-500" : "bg-slate-100")} />))}</div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                          <div className="space-y-4">
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">Cliente</p>
                             <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-slate-900 flex items-center justify-center font-black text-white italic text-lg uppercase">{(selectedOrder.customers?.name || "?").charAt(0)}</div>
                                <div className="min-w-0"><h4 className="font-black text-slate-900 uppercase italic tracking-tighter text-base truncate">{selectedOrder.customers?.name || "Cliente"}</h4><p className="text-xs font-bold text-slate-400 mt-0.5">{selectedOrder.customers?.phone || "Sem Telefone"}</p></div>
                             </div>
                             <Button onClick={() => window.open(`https://wa.me/55${(selectedOrder.customers?.phone || "").replace(/\D/g, '')}`, '_blank')} className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 font-bold text-xs gap-2"><MessageCircle size={16} /> WhatsApp</Button>
                          </div>
                          <div className="space-y-4">
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">Destino</p>
                             <div className="flex gap-3"><MapPin className="size-5 text-rose-500 mt-0.5" /><div className="min-w-0"><p className="text-[13px] font-bold text-slate-700 leading-tight">{selectedOrder.addresses?.street || selectedOrder.endereco_entrega || "Retirada"}</p><a href={`#`} className="inline-flex items-center gap-1.5 text-[9px] font-black text-rose-500 uppercase mt-3 italic hover:underline">VER MAPA <ExternalLink size={10} /></a></div></div>
                          </div>
                       </div>

                       <div className="bg-slate-50 rounded-[32px] p-8 space-y-6">
                          <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-widest border-b border-slate-200 pb-4">Itens</h4>
                          <div className="space-y-4">
                             {(selectedOrder.order_items || []).map((item: any, i: number) => (
                                <div key={i} className="flex justify-between items-center"><div className="flex items-center gap-3"><span className="size-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center font-black text-[10px] text-rose-500">{item.quantity}x</span><span className="text-sm font-black uppercase italic text-slate-700">{item.product_name}</span></div><span className="text-sm font-black text-slate-900">R$ {(item.quantity * item.price).toFixed(2)}</span></div>
                             ))}
                          </div>
                          <div className="pt-4 border-t border-slate-200 space-y-2">
                             <div className="flex justify-between text-[10px] font-black uppercase text-slate-400"><span>Subtotal</span><span>R$ {(selectedOrder.total - (selectedOrder.delivery_fee || 0)).toFixed(2)}</span></div>
                             <div className="flex justify-between text-[10px] font-black uppercase text-slate-400"><span>Taxa de Entrega</span><span>R$ {(selectedOrder.delivery_fee || 0).toFixed(2)}</span></div>
                             <div className="flex justify-between items-center pt-2"><span className="text-2xl font-black italic text-slate-900">R$ {selectedOrder.total.toFixed(2)}</span><Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[8px] uppercase tracking-widest">{selectedOrder.payment_status === 'paid' ? 'PAGO' : 'PENDENTE'}</Badge></div>
                          </div>
                       </div>
                    </div>
                 </ScrollArea>
                 
                 <footer className="p-8 bg-white border-t border-slate-100 flex gap-4 shrink-0">
                    <Button onClick={() => handleStatusUpdate(selectedOrder.id, 'cancelled')} variant="outline" className="h-16 px-6 rounded-2xl border-slate-200 font-black text-rose-400 uppercase text-[10px]">Cancelar</Button>
                    {getNextStatus(selectedOrder.status) ? (
                       <Button onClick={() => handleStatusUpdate(selectedOrder.id, getNextStatus(selectedOrder.status)!)} className="flex-1 h-16 rounded-2xl bg-rose-500 text-white font-black uppercase italic text-xs tracking-widest shadow-xl shadow-rose-200 gap-2"><Zap size={18} /> {getStatusActionLabel(selectedOrder.status)}</Button>
                    ) : (
                       <div className="flex-1 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black uppercase italic tracking-widest gap-2"><CheckCircle2 size={24} className="text-emerald-500" /> Finalizado</div>
                    )}
                 </footer>
              </motion.aside>
           </>
        )}
      </AnimatePresence>
    </div>
  )
}

function PrintReceipt({ order, business }: { order: any, business: any }) {
  if (!order) return null;
  const orderDate = order.created_at ? format(new Date(order.created_at), 'dd/MM/yyyy HH:mm') : '';
  const printDate = format(new Date(), 'dd/MM/yy HH:mm');
  return (
    <div id="print-receipt" className="hidden print:block">
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <div className="text-center bold uppercase"><div>{business?.nome || 'DOCE GESTÃO'}</div><div>{business?.whatsapp || ''}</div></div>
      <div className="dashed-line"></div>
      <div className="text-center bold uppercase">PEDIDO N.: {order.num_serial || order.id.slice(0, 3)}</div>
      <div className="dashed-line"></div>
      <div className="mt-2"><div className="bold uppercase">{order.customers?.name || 'Cliente'}</div><div>{order.customers?.phone || ''}</div></div>
      <div className="mt-2"><div>DATA: {orderDate}</div><div>TOTAL: R$ {(Number(order.total) || 0).toFixed(2)}</div></div>
      <div className="dashed-line"></div>
      <div className="text-center mt-4 uppercase bold italic">Obrigado pela preferência!</div>
    </div>
  );
}
