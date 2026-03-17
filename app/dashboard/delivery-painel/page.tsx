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
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { format, differenceInMinutes } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { ArrowLeft } from "lucide-react"

// --- Sub-components (could be separate files, but keeping here for cohesion) ---

function OrderListItem({ order, isSelected, onClick }: any) {
  const age = differenceInMinutes(new Date(), new Date(order.created_at))
  const isLate = age > 30 && (order.status === 'novo' || order.status === 'confirmado')

  return (
    <button 
      onClick={() => onClick(order)}
      className={cn(
        "w-full p-5 text-left transition-all border-b border-slate-50 relative group",
        isSelected ? "bg-pink-50/50 border-r-4 border-r-pink-500" : "hover:bg-slate-50",
        isLate && !isSelected && "bg-rose-50/20"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">#{order.num_serial || order.id.slice(0, 4)}</span>
           <span className={cn(
             "size-2 rounded-full",
             order.status === 'novo' ? "bg-pink-500 animate-pulse" : 
             order.status === 'saiu_entrega' ? "bg-emerald-500" : "bg-slate-300"
           )} />
        </div>
        <span className={cn("text-[10px] font-black italic", isLate ? "text-rose-500" : "text-slate-400")}>
           {age} min
        </span>
      </div>
      
      <p className="font-black text-slate-900 uppercase italic tracking-tighter truncate leading-none mb-1">
        {order.clientes?.nome || order.cliente_nome || "Cliente"}
      </p>
      
      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
         <span>{order.tipo_pedido === 'entrega' ? 'Delivery' : 'Retirada'}</span>
         <span className="text-slate-900 font-black">R$ {order.valor_total?.toFixed(2)}</span>
      </div>

      {isLate && (
         <div className="absolute top-2 right-12">
            <Badge className="bg-rose-500 text-white border-none text-[8px] px-1 py-0 animate-bounce">ATRASADO</Badge>
         </div>
      )}
    </button>
  )
}

// --- Main Page ---

export default function GestorPedidos() {
  const { profile, business, loadingBusiness } = useBusiness()
  const [orders, setOrders] = useState<any[]>([])
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<'abertos' | 'concluidos'>('abertos')
  const [autoAccept, setAutoAccept] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const isMobile = useIsMobile()

  const toggleAudio = () => {
    // Establishing audio context on user gesture
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
    if (!profile?.company_id) return
    
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*, clientes(*)')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setOrders(data || [])
      
      // If we have data and no selected order, select the first one in the list
      if (data && data.length > 0 && !selectedOrder) {
        // setSelectedOrder(data[0]) // Auto-select might be annoying, let's keep it null
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setIsLoading(false)
    }
  }, [profile?.company_id])

  const playAlert = useCallback(() => {
    const audio = new Audio("/sounds/notificacao.mp3")
    audio.play().catch(e => console.log("Sound alert blocked by browser"))
  }, [])

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
     try {
       const { error } = await supabase
         .from('pedidos')
         .update({ 
           status: newStatus,
           ...(newStatus === 'confirmado' ? { inicio_preparo: new Date().toISOString() } : {}),
           ...(newStatus === 'pronto' ? { preparado_em: new Date().toISOString() } : {}),
           ...(newStatus === 'entregue' ? { finalizado_em: new Date().toISOString() } : {})
         })
         .eq('id', orderId)
       
       if (error) throw error
       
       toast.success(`Pedido ${newStatus}!`)
       fetchOrders()
       
       if (selectedOrder?.id === orderId) {
         setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }))
       }
     } catch (error) {
       toast.error("Erro ao atualizar status")
     }
  }

  const fetchOrderItems = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('itens_pedido')
        .select('*, produtos(nome)')
        .eq('pedido_id', orderId)
      
      if (error) throw error
      
      const items = data?.map(i => ({
        ...i,
        product_name: i.produtos?.nome || 'Produto'
      })) || []
      
      setSelectedOrder((prev: any) => {
        if (prev?.id === orderId) {
          return { ...prev, itens_pedido: items }
        }
        return prev
      })
    } catch (error) {
      console.error("Error fetching items:", error)
    }
  }

  useEffect(() => {
    if (selectedOrder && !selectedOrder.itens_pedido) {
      fetchOrderItems(selectedOrder.id)
    }
  }, [selectedOrder?.id])

  useEffect(() => {
    if (profile?.company_id) {
      fetchOrders()
      
      const subscription = supabase
        .channel('pedidos-manager')
        .on('postgres_changes', { 
           event: 'INSERT', 
           schema: 'public', 
           table: 'pedidos',
           filter: `company_id=eq.${profile.company_id}`
        }, (payload) => {
           playAlert()
           toast.info("Novo pedido recebido!")
           
           if (autoAccept) {
              handleStatusUpdate(payload.new.id, 'confirmado')
           } else {
              fetchOrders()
           }
        })
        .on('postgres_changes', { 
           event: '*', 
           schema: 'public', 
           table: 'pedidos',
           filter: `company_id=eq.${profile.company_id}`
        }, fetchOrders)
        .subscribe()
      
      return () => { supabase.removeChannel(subscription) }
    }
  }, [profile?.company_id, autoAccept, playAlert, fetchOrders])

  const filteredOrders = useMemo(() => {
     return orders.filter(o => {
        const matchesSearch = o.id.includes(search) || 
                             o.clientes?.nome?.toLowerCase().includes(search.toLowerCase()) || 
                             o.cliente_nome?.toLowerCase().includes(search.toLowerCase())
        
        if (activeTab === 'abertos') {
           return matchesSearch && o.status !== 'entregue' && o.status !== 'cancelado'
        } else {
           return matchesSearch && (o.status === 'entregue' || o.status === 'cancelado')
        }
     })
  }, [orders, search, activeTab])

  if (loadingBusiness || (isLoading && !orders.length)) {
    return (
       <div className="h-screen flex items-center justify-center bg-slate-50 font-black italic uppercase tracking-tighter text-2xl animate-pulse">
          Sincronizando Gestor...
       </div>
    )
  }

  return (
    <div className="h-screen flex bg-slate-100 overflow-hidden font-sans">
      
      {/* SIDEBAR: Order List */}
      <aside className={cn(
        "w-full md:w-96 flex flex-col bg-white border-r border-slate-200",
        isMobile && selectedOrder ? "hidden" : "flex"
      )}>
         <div className="p-6 space-y-4 shrink-0 border-b border-slate-100 bg-white z-10">
            <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-3">
                  <div className="size-10 bg-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20">
                     <Zap className="size-5 text-white" />
                  </div>
                  <div>
                     <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none">Gestor</h1>
                     <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] italic">De Pedidos</span>
                  </div>
               </div>
               <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setAutoAccept(!autoAccept)}
                    className={cn("size-8 rounded-lg transition-all", autoAccept ? "bg-emerald-100 text-emerald-600 shadow-sm" : "text-slate-400")}
                    title="Aceite Automático"
                  >
                     <Check className={cn("size-4", autoAccept && "scale-110")} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleAudio}
                    className={cn("size-8 rounded-lg transition-all", audioEnabled ? "bg-emerald-100 text-emerald-600 shadow-sm" : "text-slate-400")}
                    title={audioEnabled ? "Alertas de Som Ativados" : "Ativar Alertas de Som"}
                  >
                     <Bell className={cn("size-4", audioEnabled && "animate-bounce")} />
                  </Button>
               </div>
            </div>

            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
               <Input 
                 placeholder="BUSCAR CLIENTE OU ID..." 
                 value={search}
                 onChange={e => setSearch(e.target.value)}
                 className="h-12 pl-12 rounded-2xl border-none bg-slate-100 text-[10px] font-black tracking-widest uppercase focus-visible:ring-pink-500/20 shadow-inner"
               />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl">
               <button 
                  onClick={() => setActiveTab('abertos')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    activeTab === 'abertos' ? "bg-white text-pink-500 shadow-sm" : "text-slate-400"
                  )}
               >
                 Abertos ({orders.filter(o => o.status !== 'entregue' && o.status !== 'cancelado').length})
               </button>
               <button 
                  onClick={() => setActiveTab('concluidos')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    activeTab === 'concluidos' ? "bg-white text-pink-500 shadow-sm" : "text-slate-400"
                  )}
               >
                 Concluídos
               </button>
            </div>
         </div>

         <ScrollArea className="flex-1">
            <div className="divide-y divide-slate-50">
               {filteredOrders.length > 0 ? (
                 filteredOrders.map(order => (
                    <OrderListItem 
                      key={order.id} 
                      order={order} 
                      isSelected={selectedOrder?.id === order.id}
                      onClick={setSelectedOrder}
                    />
                 ))
               ) : (
                 <div className="p-12 text-center opacity-20 flex flex-col items-center">
                    <ShoppingBag className="size-12 mb-4 stroke-1" />
                    <p className="font-black uppercase tracking-widest text-[10px]">Nenhum pedido</p>
                 </div>
               )}
            </div>
         </ScrollArea>
         
         <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
            <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-2">
                  <div className={cn("size-2 rounded-full", autoAccept ? "bg-emerald-500" : "bg-slate-300")} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aceite Automático</span>
               </div>
               <Switch checked={autoAccept} onCheckedChange={setAutoAccept} />
            </div>
         </div>
      </aside>

      {/* MAIN CONTENT: Order Details */}
      <main className={cn(
        "flex-1 flex flex-col min-w-0 bg-slate-50",
        isMobile && !selectedOrder ? "hidden" : "flex"
      )}>
         {selectedOrder ? (
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="p-4 md:p-8 bg-white border-b border-slate-200 flex flex-col md:flex-row items-center justify-between shrink-0 gap-4">
                  <div className="flex items-center gap-4 md:gap-6 w-full">
                     {isMobile && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setSelectedOrder(null)}
                          className="size-10 rounded-xl bg-slate-100"
                        >
                           <ArrowLeft className="size-5" />
                        </Button>
                     )}
                     <div className="size-12 md:size-16 rounded-[18px] md:rounded-[24px] bg-slate-900 flex items-center justify-center font-black text-white italic text-base md:text-xl shadow-xl transform -rotate-3">
                        #{selectedOrder.num_serial || selectedOrder.id.slice(0, 3)}
                     </div>
                     <div className="flex-1">
                        <div className="flex items-center gap-2 md:gap-3 mb-0.5">
                           <h2 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none truncate">
                              {selectedOrder.clientes?.nome || selectedOrder.cliente_nome}
                           </h2>
                           <Badge className={cn("border-none text-[10px] font-black uppercase tracking-widest px-3", 
                             selectedOrder.status === 'novo' ? "bg-pink-500" : "bg-slate-900"
                           )}>
                              {selectedOrder.status}
                           </Badge>
                        </div>
                        <p className="text-slate-400 font-bold text-sm flex items-center gap-4">
                           <span className="flex items-center gap-1.5"><Clock className="size-3" /> Recebido às {format(new Date(selectedOrder.created_at), 'HH:mm')}</span>
                           <span className="flex items-center gap-1.5"><Truck className="size-3" /> {selectedOrder.tipo_pedido === 'entrega' ? 'Para Entrega' : 'Para Retirada'}</span>
                        </p>
                     </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                     <Button 
                        variant="outline" 
                        className="flex-1 md:flex-none h-12 md:h-14 px-4 md:px-6 rounded-2xl border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-widest gap-2"
                     >
                        <Printer className="size-4" /> <span className="md:inline">Imprimir</span>
                     </Button>
                     <Button 
                        onClick={() => handleStatusUpdate(selectedOrder.id, 'cancelado')}
                        variant="outline" 
                        className="flex-1 md:flex-none h-12 md:h-14 px-4 md:px-6 rounded-2xl border-rose-100 text-rose-500 font-bold uppercase text-[10px] tracking-widest hover:bg-rose-50"
                     >
                        Cancelar
                     </Button>
                  </div>
               </header>

               {/* Detail Content */}
               <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-slate-50/50">
                  <ScrollArea className="flex-1">
                     <div className="p-4 md:p-12 space-y-6 md:space-y-12">
                        {/* Customer & Logistics */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                           <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 italic">Cliente</h3>
                              <div className="flex items-center justify-between">
                                 <div>
                                    <p className="text-lg font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-1">
                                       {selectedOrder.clientes?.nome || selectedOrder.cliente_nome}
                                    </p>
                                    <p className="text-slate-400 font-bold text-sm tracking-wide">{selectedOrder.cliente_telefone || "Sem Telefone"}</p>
                                 </div>
                                 <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm"><MessageCircle className="size-5" /></Button>
                                    <Button variant="ghost" size="icon" className="size-12 rounded-2xl bg-blue-50 text-blue-600 shadow-sm"><Phone className="size-5" /></Button>
                                 </div>
                              </div>
                           </div>

                            <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 italic">Endereço</h3>
                               <div className="flex gap-4 items-start">
                                  <div className="p-3 bg-pink-50 rounded-2xl text-pink-500 shrink-0">
                                     <MapPin className="size-6" />
                                  </div>
                                  <div className="min-w-0">
                                     <p className="text-sm font-black text-slate-900 uppercase italic tracking-tighter leading-tight break-words">
                                        {selectedOrder.endereco_entrega || "Retirada no Local"}
                                     </p>
                                     <p className="text-slate-400 font-bold text-xs mt-1">
                                        {selectedOrder.clientes?.bairro && `${selectedOrder.clientes.bairro} • `}
                                        {selectedOrder.complemento_endereco && `${selectedOrder.complemento_endereco}`}
                                     </p>
                                  </div>
                               </div>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="space-y-6">
                           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 italic">Produtos</h3>
                            <div className="bg-white rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
                               <table className="w-full min-w-[600px] md:min-w-full">
                                  <thead>
                                     <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-4 md:px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Qtd</th>
                                        <th className="px-4 md:px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Produto</th>
                                        <th className="px-4 md:px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Preço</th>
                                        <th className="px-4 md:px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Total</th>
                                     </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                     {(selectedOrder.itens_pedido || []).map((item: any, i: number) => (
                                        <tr key={i} className="group hover:bg-slate-50/30 transition-colors">
                                           <td className="px-4 md:px-8 py-6 font-black text-slate-400">{item.quantidade}x</td>
                                           <td className="px-4 md:px-8 py-6">
                                              <p className="font-black text-slate-900 uppercase italic tracking-tighter break-words">{item.product_name || "Produto"}</p>
                                              {item.observacoes && <p className="text-[10px] font-bold text-pink-500 italic uppercase">Obs: {item.observacoes}</p>}
                                           </td>
                                           <td className="px-4 md:px-8 py-6 text-right font-bold text-slate-400 text-sm italic">R$ {item.preco?.toFixed(2)}</td>
                                           <td className="px-4 md:px-8 py-6 text-right font-black text-slate-900 italic">R$ {(item.quantidade * item.preco).toFixed(2)}</td>
                                        </tr>
                                     ))}
                                     {(!selectedOrder.itens_pedido || selectedOrder.itens_pedido.length === 0) && (
                                        <tr>
                                           <td colSpan={4} className="px-8 py-12 text-center text-slate-300 font-bold italic">Sem itens detalhados</td>
                                        </tr>
                                     )}
                                  </tbody>
                               </table>
                            </div>
                              
                              <div className="bg-slate-950 p-6 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center text-white gap-6">
                                 <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                       <CreditCard className="size-4 text-emerald-400" />
                                       <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{selectedOrder.payment_method || "PAGAMENTO"}</span>
                                    </div>
                                    <Badge className={cn("bg-emerald-500 hover:bg-emerald-600 text-white border-none font-black text-[9px] uppercase tracking-[0.2em]")}>
                                       {selectedOrder.status_pagamento === 'pago' ? 'Confirmado' : 'Pendente'}
                                    </Badge>
                                 </div>
                                 <div className="text-right w-full md:w-auto">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-500 mb-1 leading-none">Total à Pagar</p>
                                    <p className="text-3xl md:text-5xl font-black italic tracking-tighter leading-none">R$ {selectedOrder.valor_total?.toFixed(2)}</p>
                                 </div>
                              </div>
                           </div>

                        {selectedOrder.observacoes && (
                           <div className="p-8 bg-amber-50 rounded-[32px] border border-amber-100 flex gap-4 items-start">
                              <AlertCircle className="size-6 text-amber-500 mt-1 shrink-0" />
                              <div>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Atenção para as Observações:</p>
                                 <p className="font-bold italic text-slate-700 text-lg">"{selectedOrder.observacoes}"</p>
                              </div>
                           </div>
                        )}
                        <div className="h-20" />
                     </div>
                  </ScrollArea>

                  {/* Actions Sidebar */}
                  <div className="w-full md:w-96 p-6 md:p-10 space-y-6 md:space-y-10 shrink-0 bg-white border-l border-slate-100">
                     <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 italic">Ações do Pedido</h3>
                        
                        {selectedOrder.status === 'novo' && (
                           <Button 
                              onClick={() => handleStatusUpdate(selectedOrder.id, 'confirmado')}
                              className="w-full h-16 md:h-20 rounded-[24px] md:rounded-[32px] bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase italic text-base md:text-lg tracking-widest shadow-xl shadow-emerald-500/20 gap-3 group"
                           >
                              <Zap className="size-6 group-hover:animate-pulse" /> Confirmar Pedido
                           </Button>
                        )}

                        {selectedOrder.status === 'confirmado' && (
                           <Button 
                              onClick={() => handleStatusUpdate(selectedOrder.id, 'preparando')}
                              className="w-full h-16 md:h-20 rounded-[24px] md:rounded-[32px] bg-amber-500 hover:bg-amber-600 text-white font-black uppercase italic text-base md:text-lg tracking-widest shadow-xl shadow-amber-500/20 gap-3 group"
                           >
                              <ChefHat className="size-6" /> Iniciar Preparo
                           </Button>
                        )}

                        {selectedOrder.status === 'preparando' && (
                           <Button 
                              onClick={() => handleStatusUpdate(selectedOrder.id, 'pronto')}
                              className="w-full h-16 md:h-20 rounded-[24px] md:rounded-[32px] bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase italic text-base md:text-lg tracking-widest shadow-xl shadow-indigo-500/20 gap-3 group"
                           >
                              <ShoppingBag className="size-6" /> Marcar como Pronto
                           </Button>
                        )}

                        {selectedOrder.status === 'pronto' && (
                           <Button 
                              onClick={() => handleStatusUpdate(selectedOrder.id, 'saiu_entrega')}
                              className="w-full h-16 md:h-20 rounded-[24px] md:rounded-[32px] bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase italic text-base md:text-lg tracking-widest shadow-xl shadow-emerald-600/20 gap-3 group"
                           >
                              <Truck className="size-6 shadow-glow" /> Despachar Pedido
                           </Button>
                        )}

                        {selectedOrder.status === 'saiu_entrega' && (
                           <Button 
                              onClick={() => handleStatusUpdate(selectedOrder.id, 'entregue')}
                              className="w-full h-16 md:h-20 rounded-[24px] md:rounded-[32px] bg-slate-900 hover:bg-black text-white font-black uppercase italic text-base md:text-lg tracking-widest shadow-xl gap-3 group"
                           >
                              <CheckCircle2 className="size-6" /> Concluir Entrega
                           </Button>
                        )}
                     </div>

                     <Separator className="bg-slate-50" />

                     <div className="space-y-6">
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Pagamento</p>
                              <p className="font-black text-slate-900 uppercase italic tracking-tighter">{selectedOrder.payment_method}</p>
                           </div>
                           <Badge className="bg-white text-emerald-500 border-none font-black shadow-sm italic text-[10px] uppercase tracking-widest">
                              {selectedOrder.status_pagamento === 'pago' ? 'PAGO' : 'PENDENTE'}
                           </Badge>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Logística</p>
                              <p className="font-black text-slate-900 uppercase italic tracking-tighter">{selectedOrder.tipo_pedido}</p>
                           </div>
                           <Badge className="bg-white text-pink-500 border-none font-black shadow-sm italic text-[10px] uppercase tracking-widest">
                              {selectedOrder.id_entregador ? 'COM MOTO' : 'SEM MOTO'}
                           </Badge>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6 opacity-30 select-none">
               <div className="size-32 bg-slate-200 rounded-[50px] flex items-center justify-center border-4 border-slate-300">
                  <ShoppingBag className="size-16 stroke-1 text-slate-400" />
               </div>
               <div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-500">Nenhum Pedido Selecionado</h3>
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Clique em um pedido na lateral para ver os detalhes</p>
               </div>
            </div>
         )}
      </main>
    </div>
  )
}
