"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Phone, 
  MessageCircle, 
  MapPin, 
  Truck, 
  Clock, 
  Printer, 
  X,
  CreditCard,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ChefHat,
  Package,
  Calendar,
  User as UserIcon
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface OrderDetailsModalProps {
  order: any
  isOpen: boolean
  onClose: () => void
  onStatusUpdate: (id: string, status: string) => void
}

export function OrderDetailsModal({ order, isOpen, onClose, onStatusUpdate }: OrderDetailsModalProps) {
  const [items, setItems] = useState<any[]>([])
  const [couriers, setCouriers] = useState<any[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [loadingCouriers, setLoadingCouriers] = useState(false)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    if (isOpen && order?.id) {
      fetchItems()
      if (order.company_id) fetchCouriers()
    }
  }, [isOpen, order?.id, order?.company_id])

  async function fetchCouriers() {
    try {
      setLoadingCouriers(true)
      const { data } = await supabase
        .from('entregadores')
        .select('*')
        .eq('company_id', order.company_id)
        .eq('status', 'disponivel')
      
      setCouriers(data || [])
    } catch (error) {
      console.error("Error fetching couriers:", error)
    } finally {
      setLoadingCouriers(false)
    }
  }

  async function fetchItems() {
    try {
      setLoadingItems(true)
      const { data, error } = await supabase
        .from('itens_pedido')
        .select('*, produtos(nome)')
        .eq('pedido_id', order.id)
      
      if (error) throw error
      setItems(data?.map(i => ({
        ...i,
        product_name: i.produtos?.nome || 'Produto'
      })) || [])
    } catch (error) {
      console.error("Error fetching items:", error)
    } finally {
      setLoadingItems(false)
    }
  }

  async function handleAssignCourier(courierId: string) {
    try {
      setAssigning(true)
      const { error } = await supabase
        .from('pedidos')
        .update({ id_entregador: courierId, status: 'saiu_entrega' })
        .eq('id', order.id)

      if (error) throw error
      
      toast.success("Entregador designado!")
      onStatusUpdate(order.id, 'saiu_entrega')
      onClose()
    } catch (error) {
      toast.error("Erro ao designar entregador")
      console.error(error)
    } finally {
      setAssigning(false)
    }
  }

  if (!order) return null

  const statusMap: any = {
    'novo': { label: 'Novo', color: 'bg-pink-500', icon: Clock },
    'confirmado': { label: 'Confirmado', color: 'bg-amber-500', icon: ChefHat },
    'preparando': { label: 'Preparo', color: 'bg-amber-600', icon: ChefHat },
    'pronto': { label: 'Pronto', color: 'bg-indigo-500', icon: Package },
    'saiu_entrega': { label: 'Em Rota', color: 'bg-emerald-500', icon: Truck },
    'entregue': { label: 'Entregue', color: 'bg-slate-500', icon: Calendar },
  }

  const currentStatus = statusMap[order.status] || statusMap['novo']

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-4xl p-0 h-[90vh] flex flex-col overflow-hidden border-none rounded-[40px] shadow-2xl">
        {/* Superior Header - High Contrast */}
        <div className={cn("px-8 py-6 flex items-center justify-between text-white shrink-0", currentStatus.color)}>
          <div className="flex items-center gap-4">
             <div className="size-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-lg italic">
                #{order.id.slice(0, 3)}
             </div>
             <div>
                <div className="flex items-center gap-2">
                   <Badge className="bg-white/20 text-white border-none font-black text-[10px] uppercase">
                      {order.tipo_pedido === 'entrega' ? 'Delivery' : 'Retirada'}
                   </Badge>
                   <span className="text-white/60 font-black text-[10px] uppercase tracking-widest italic">• {order.payment_method || 'Não Informado'}</span>
                </div>
                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-white">
                  {currentStatus.label}
                </DialogTitle>
                <DialogDescription className="sr-only">Detalhes do pedido e entrega.</DialogDescription>
             </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black uppercase text-white/60 tracking-widest leading-none mb-1">Chegada</p>
                <p className="text-sm font-black italic">{format(new Date(order.created_at), 'HH:mm', { locale: ptBR })}</p>
             </div>
             <Button variant="ghost" size="icon" onClick={onClose} className="rounded-2xl hover:bg-black/10 text-white">
                <X className="size-6" />
             </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-slate-50">
           {/* Detailed View Scrollable */}
           <ScrollArea className="flex-1">
              <div className="p-8 space-y-8">
                 {/* ID and Source */}
                 <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID do Pedido</p>
                       <p className="font-bold text-slate-900">{order.id}</p>
                    </div>
                    <div className="bg-slate-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500">
                       Origem: WEB
                    </div>
                 </div>

                 {/* Customer Section */}
                 <section className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                       <UserIcon className="size-3" /> Info do Cliente
                    </h3>
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-8 items-start justify-between">
                       <div className="flex gap-4">
                          <div className="size-16 rounded-[24px] bg-indigo-50 flex items-center justify-center font-black text-2xl text-indigo-500">
                             {order.clientes?.nome?.charAt(0) || order.cliente_nome?.charAt(0) || "C"}
                          </div>
                          <div className="space-y-1">
                             <h4 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                                {order.clientes?.nome || order.cliente_nome || "Cliente Desconhecido"}
                             </h4>
                             <p className="text-slate-400 font-bold text-xs">{order.cliente_telefone || "Sem telefone"}</p>
                             <div className="flex items-center gap-2 group cursor-pointer text-indigo-500">
                                <span className="text-[10px] font-black uppercase tracking-widest">Comprador Frequente</span>
                                <Badge className="bg-indigo-50 text-indigo-600 border-none text-[9px]">Gold</Badge>
                             </div>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <Button variant="outline" className="size-12 rounded-2xl border-slate-100 hover:bg-slate-50 text-slate-600">
                             <Phone className="size-5" />
                          </Button>
                          <Button variant="outline" className="size-12 rounded-2xl border-emerald-100 hover:bg-emerald-50 text-emerald-600">
                             <MessageCircle className="size-5" />
                          </Button>
                       </div>
                    </div>
                 </section>

                 {/* Delivery Info */}
                 <section className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                       <MapPin className="size-3" /> Logística de Entrega
                    </h3>
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
                       <div className="flex gap-4 items-start">
                          <div className="shrink-0 p-3 bg-pink-50 rounded-2xl text-pink-500 mt-1">
                             <MapPin className="size-6" />
                          </div>
                          <div className="space-y-1">
                             <p className="font-black text-slate-900 uppercase italic tracking-tighter text-lg">{order.endereco_entrega || "Endereço não disponível"}</p>
                             <p className="text-slate-400 font-bold text-sm tracking-wide">
                                Bairro: {order.clientes?.bairro || "Não informado"} • CEP: {order.cep || "---"}
                             </p>
                             {order.complemento_endereco && (
                                <p className="text-pink-500 font-black text-[10px] uppercase tracking-widest pt-1 italic">
                                   Complemento: {order.complemento_endereco}
                                </p>
                             )}
                          </div>
                       </div>
                       
                       <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                          <div className="flex-1 flex items-center gap-3">
                             <div className="size-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                <UserIcon className="size-6 text-slate-400" />
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Entregador</p>
                                <p className="text-sm font-black text-slate-800 italic uppercase tracking-tighter">Escolher entregador disponível</p>
                             </div>
                          </div>
                          <Button variant="ghost" className="text-pink-500 font-black uppercase text-[10px] tracking-widest gap-2">
                             <ChevronRight className="size-4" />
                          </Button>
                       </div>
                    </div>
                 </section>

                 {/* Items List */}
                 <section className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                       <Package className="size-3" /> Itens do Pedido
                    </h3>
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                       <div className="p-8 space-y-6">
                          {loadingItems ? (
                             <div className="flex flex-col items-center justify-center py-12 gap-4 opacity-30">
                                <div className="size-8 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
                                <span className="font-bold text-xs uppercase tracking-widest italic tracking-widest text-pink-500">Buscando itens...</span>
                             </div>
                          ) : (items || []).map((item: any, i: number) => (
                             <div key={i} className="flex justify-between items-start group">
                                <div className="flex gap-4">
                                   <div className="size-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-pink-500 group-hover:text-white transition-all">
                                      {item.quantidade}x
                                   </div>
                                   <div>
                                      <p className="font-black text-slate-900 uppercase italic tracking-tighter">{item.product_name}</p>
                                      <p className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">Preço Un: R$ {item.preco?.toFixed(2)}</p>
                                   </div>
                                </div>
                                <span className="font-black text-slate-900 italic tracking-tighter">R$ {(item.quantidade * item.preco).toFixed(2)}</span>
                             </div>
                          ))}
                          
                          {!loadingItems && (!items || items.length === 0) && (
                             <p className="text-slate-400 font-bold italic text-center py-4">Nenhum item detalhado encontrado.</p>
                          )}
                       </div>
                       
                       <div className="bg-slate-950 p-8 text-white space-y-4">
                          <div className="flex justify-between items-center text-white/60">
                             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Subtotal Produtos</span>
                             <span className="font-bold tracking-tight">R$ {(order.valor_total - (order.taxa_entrega || 0)).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-white/60">
                             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Taxa de Entrega</span>
                             <span className="font-bold tracking-tight">R$ {order.taxa_entrega?.toFixed(2) || "0.00"}</span>
                          </div>
                          <Separator className="bg-white/10" />
                          <div className="flex justify-between items-center">
                             <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-500">Total à Pagar</span>
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[9px] uppercase font-black tracking-widest mt-1 w-fit">
                                   {order.payment_status === 'paid' ? 'Pago' : 'Não Pago'}
                                </Badge>
                             </div>
                             <span className="text-3xl font-black italic tracking-tighter">R$ {order.valor_total?.toFixed(2)}</span>
                          </div>
                       </div>
                    </div>
                 </section>

                 {/* Observações */}
                 {order.observacoes && (
                    <section className="space-y-4">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Observações</h3>
                       <div className="bg-white p-6 rounded-3xl border border-dashed border-slate-200">
                          <p className="text-slate-600 font-bold italic text-sm">"{order.observacoes}"</p>
                       </div>
                    </section>
                 )}
                 <div className="h-12" />
              </div>
           </ScrollArea>

           {/* Sidebar Controls - Quick Actions */}
           <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-200 bg-white p-6 space-y-6 shrink-0 flex flex-col justify-between">
              <div className="space-y-6">
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Atualizar Status</p>
                    <div className="grid grid-cols-1 gap-2">
                       {Object.entries(statusMap).map(([key, value]: [string, any]) => (
                          <Button 
                             key={key} 
                             onClick={() => {
                                onStatusUpdate(order.id, key)
                                if (key === 'saiu_entrega') {
                                   // Keep open for courier selection if needed? 
                                   // For now close as in regular flow
                                }
                             }}
                             className={cn(
                                "h-14 rounded-2xl font-black uppercase italic tracking-widest transition-all justify-start px-6 group",
                                order.status === key 
                                   ? cn(value.color, "text-white shadow-lg")
                                   : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                             )}
                          >
                             <value.icon className={cn("size-5 mr-4", order.status === key ? "text-white" : "text-slate-300 group-hover:text-slate-500")} />
                             {value.label}
                             {order.status === key && <Badge className="bg-white/20 ml-auto border-none">Atual</Badge>}
                          </Button>
                       ))}
                    </div>
                 </div>

                 <Separator />

                 <div className="space-y-2 text-slate-400">
                    <p className="text-[10px] font-black uppercase tracking-widest ml-1">Ações Rápidas</p>
                    <div className="flex gap-2">
                       <Button variant="outline" className="flex-1 h-14 rounded-2xl border-slate-100 hover:bg-slate-50 text-slate-600 gap-2 font-bold uppercase text-[10px] tracking-widest">
                          <Printer className="size-4" /> Imprimir
                       </Button>
                       <Button variant="outline" className="flex-1 h-14 rounded-2xl border-slate-100 hover:bg-slate-50 text-slate-600 gap-2 font-bold uppercase text-[10px] tracking-widest">
                          <ExternalLink className="size-4" /> PDF
                       </Button>
                    </div>
                 </div>
              </div>

              <div className="pt-6">
                 <Button onClick={onClose} className="w-full h-16 rounded-[24px] bg-slate-950 text-white font-black uppercase italic tracking-widest shadow-xl transform active:scale-95 transition-all">
                    Fechar Painel
                 </Button>
              </div>
           </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}
