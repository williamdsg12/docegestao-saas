"use client"

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  Phone, 
  MapPin, 
  DollarSign,
  AlertCircle,
  Eye,
  Printer,
  CreditCard
} from "lucide-react"
import { cn } from "@/lib/utils"

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  customer_name: string
  customer_phone: string
  customer_address: string
  customer_cep: string
  delivery_fee: number
  total: number
  payment_method: string
  payment_status: string
  status: string
  notes: string
  created_at: string
  order_items?: OrderItem[]
}

const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
  novo: { label: "Novo", color: "bg-amber-500 text-white", icon: Clock },
  preparo: { label: "Em Preparo", color: "bg-blue-500 text-white", icon: AlertCircle },
  pronto: { label: "Pronto", color: "bg-emerald-500 text-white", icon: CheckCircle2 },
  finalizado: { label: "Finalizado", color: "bg-slate-400 text-white", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", color: "bg-slate-300 text-white", icon: XCircle },
}

interface OrderDetailsModalProps {
  order: any | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onUpdateStatus: (orderId: string, status: string) => Promise<void>
}

export function OrderDetailsModal({ order, isOpen, onOpenChange, onUpdateStatus }: OrderDetailsModalProps) {
  if (!order) return null

  const handleUpdate = async (status: string) => {
    await onUpdateStatus(order.id, status)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl rounded-[40px] p-0 overflow-hidden border-none shadow-2xl focus:outline-none">
        <div className="flex flex-col h-full max-h-[95vh]">
          {/* Modal Header */}
          <div className="p-10 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,47,129,0.2),transparent)] pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400">ID: #{order.id.slice(0, 8)}</span>
                <Badge className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase border-none shadow-lg", statusConfig[order.status]?.color)}>
                  {statusConfig[order.status]?.label}
                </Badge>
              </div>
              <DialogTitle className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">{order.customer_name}</DialogTitle>
              <DialogDescription className="text-[#FF2F81] font-black uppercase text-[10px] tracking-widest mt-2 italic">
                {order.order_type === 'delivery' ? 'Entrega em domicílio' : order.order_type === 'balcao' ? 'Retirada no Balcão' : 'Consumo no Local'}
              </DialogDescription>
            </div>
            <div className="flex gap-3 relative z-10">
              <Button variant="outline" size="icon" className="size-14 rounded-2xl bg-white/5 border-white/10 text-white hover:bg-white/10 active:scale-90 transition-all">
                <Printer className="size-6" />
              </Button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-white no-scrollbar">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Left Column: Items */}
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 italic">
                    <ShoppingCart className="size-4" /> Itens Escolhidos
                  </h3>
                  <span className="text-[10px] font-black text-[#FF2F81] uppercase tracking-widest">{order.items?.length || 0} Itens</span>
                </div>

                <div className="space-y-4">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="p-6 bg-slate-50 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                           <p className="font-black text-slate-900 uppercase italic text-sm leading-tight">{item.quantity}x {item.name}</p>
                           {item.variation && <p className="text-[10px] font-black text-[#FF2F81] uppercase mt-1">● {item.variation.name}</p>}
                        </div>
                        <span className="font-black text-slate-900 italic text-lg tracking-tighter leading-none">R$ {(item.totalItemPrice || item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      {item.extras && item.extras.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {item.extras.map((ex: any, i: number) => (
                            <p key={i} className="text-[10px] font-bold text-slate-400 uppercase">+ {ex.quantity}x {ex.name}</p>
                          ))}
                        </div>
                      )}
                      {item.observation && (
                        <p className="mt-3 text-[10px] italic text-slate-500 bg-white p-2 rounded-xl border border-slate-100 font-medium">"{item.observation}"</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Totals Section */}
                <div className="p-8 bg-slate-900 rounded-[40px] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 size-32 bg-[#FF2F81]/20 rounded-full blur-3xl" />
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <span>Subtotal</span>
                      <span>R$ {(order.subtotal || order.total - (order.delivery_fee || 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <span>Taxa de Entrega</span>
                      <span className="text-pink-500">+ R$ {(order.delivery_fee || 0).toFixed(2)}</span>
                    </div>
                    <div className="pt-5 border-t border-white/10 flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Total Final</span>
                      <span className="text-4xl font-black text-[#FF2F81] italic tracking-tighter">R$ {order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Info */}
              <div className="space-y-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 italic">
                  <User className="size-4" /> Informações do Cliente
                </h3>
                
                <div className="space-y-4">
                  <div className="p-6 bg-slate-50 rounded-[32px] flex items-center gap-6 group hover:bg-[#FF2F81]/5 transition-all cursor-pointer">
                    <div className="size-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#FF2F81] group-hover:scale-110 transition-transform">
                      <Phone className="size-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">WhatsApp</p>
                      <p className="text-xl font-black italic text-slate-900 tracking-tight">{order.customer_phone}</p>
                    </div>
                    <Button variant="ghost" className="ml-auto size-12 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600">
                       <Phone className="size-5" />
                    </Button>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-[32px] flex items-start gap-6 group hover:bg-[#FF2F81]/5 transition-all">
                    <div className="size-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#FF2F81] group-hover:scale-110 transition-transform shrink-0">
                      <MapPin className="size-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Endereço</p>
                      <p className="text-lg font-black italic text-slate-900 leading-tight uppercase tracking-tight">{order.address || "Retirada no Local"}</p>
                      <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">Bairro: {order.neighborhood || "N/A"}</p>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-[32px] flex flex-col gap-4 group hover:bg-[#FF2F81]/5 transition-all">
                    <div className="flex items-center gap-6">
                      <div className="size-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#FF2F81] group-hover:scale-110 transition-transform">
                        <CreditCard className="size-6" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Pagamento</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-black italic text-slate-900 uppercase tracking-tight">{order.payment_method}</span>
                          <Badge className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm border-none", 
                            order.payment_status === 'paid' || order.payment_status === 'pago' ? "bg-emerald-500 text-white" : "bg-amber-500 text-white")}>
                            {order.payment_status === 'paid' || order.payment_status === 'pago' ? "Pago" : "Pendente"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {order.payment_method?.toLowerCase() === 'pix' && order.payment_status !== 'pago' && (
                      <div className="mt-4 p-4 bg-white rounded-2xl border border-dashed border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Copia e Cola PIX</span>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-[8px] font-black uppercase bg-slate-100" onClick={() => {
                            navigator.clipboard.writeText(order.pix_copy_paste || "chave-pix-exemplo-123")
                            toast.success("Código PIX copiado!")
                          }}>Copiar</Button>
                        </div>
                        <p className="text-[10px] font-mono text-slate-500 break-all">{order.pix_copy_paste || "00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540510.005802BR5913DOCE_GESTAO6009SAO_PAULO62070503***6304"}</p>
                        <Button 
                          className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[9px] italic rounded-xl"
                          onClick={async () => {
                            await onUpdateStatus(order.id, 'finalizado')
                            toast.success("Pagamento confirmado via PIX! 🎉")
                            onOpenChange(false)
                          }}
                        >
                          Confirmar Recebimento PIX
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {order.notes && (
                  <div className="p-8 bg-pink-50 rounded-[32px] border border-pink-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 size-20 bg-white/40 blur-2xl rounded-full" />
                    <p className="text-[10px] font-black uppercase text-[#FF2F81] mb-2 tracking-widest italic">Observações Adicionais:</p>
                    <p className="text-slate-600 font-bold leading-relaxed italic">"{order.notes}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer: Action Buttons */}
          <div className="p-10 bg-slate-50 border-t border-slate-100 shrink-0">
            <div className="flex flex-wrap gap-4">
              {order.status === 'novo' && (
                <Button 
                  onClick={() => handleUpdate('preparo')}
                  className="flex-[2] h-16 rounded-[24px] bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic tracking-[0.2em] text-sm shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                >
                  Aceitar & Produzir
                </Button>
              )}
              {order.status === 'preparo' && (
                <Button 
                  onClick={() => handleUpdate('pronto')}
                  className="flex-[2] h-16 rounded-[24px] bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase italic tracking-[0.2em] text-sm shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  Concluir Produção
                </Button>
              )}
              {order.status === 'pronto' && (
                <Button 
                  onClick={() => handleUpdate('finalizado')}
                  className="flex-[2] h-16 rounded-[24px] bg-slate-800 hover:bg-slate-900 text-white font-black uppercase italic tracking-[0.2em] text-sm shadow-xl shadow-slate-500/20 active:scale-95 transition-all"
                >
                  Finalizar Pedido
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => handleUpdate('cancelado')}
                className="flex-1 h-16 px-10 rounded-[24px] border-none bg-white text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-rose-50 hover:text-rose-500 shadow-sm active:scale-95 transition-all"
              >
                Rejeitar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
