"use client"

import {
  Dialog,
  DialogContent,
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
  novo: { label: "Novo", color: "bg-amber-50 text-amber-600 border-amber-100", icon: Clock },
  waiting_payment: { label: "Aguardando Pagamento", color: "bg-rose-50 text-rose-600 border-rose-100", icon: CreditCard },
  paid: { label: "Pago", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: CheckCircle2 },
  em_preparo: { label: "Em Preparo", color: "bg-blue-50 text-blue-600 border-blue-100", icon: AlertCircle },
  pronto: { label: "Pronto", color: "bg-purple-50 text-purple-600 border-purple-100", icon: CheckCircle2 },
  saiu_entrega: { label: "Saiu p/ Entrega", color: "bg-pink-50 text-primary border-pink-100", icon: Truck },
  entregue: { label: "Entregue", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", color: "bg-slate-100 text-slate-400 border-slate-200", icon: XCircle },
}

interface OrderDetailsModalProps {
  order: Order | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onUpdateStatus: (orderId: string, status: string) => Promise<void>
}

export function OrderDetailsModal({ order, isOpen, onOpenChange, onUpdateStatus }: OrderDetailsModalProps) {
  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl rounded-[40px] p-0 overflow-hidden border-none shadow-2xl focus:outline-none">
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Modal Header */}
          <div className="p-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,47,129,0.15),transparent)] pointer-events-none" />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400">ID: #{order.id.slice(0, 8)}</span>
                <Badge className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase border-none", statusConfig[order.status]?.color)}>
                  {statusConfig[order.status]?.label}
                </Badge>
              </div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{order.customer_name}</h2>
            </div>
            <div className="flex gap-2 relative z-10">
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
                  {order.order_items?.map((item: OrderItem, idx: number) => (
                    <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between mb-2">
                        <span className="font-black text-slate-900 uppercase italic text-sm">{item.quantity}x {item.product_name}</span>
                        <span className="font-black text-primary italic">R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Totals */}
                <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                    <span>Taxa de Entrega</span>
                    <span>R$ {order.delivery_fee.toFixed(2)}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-sm font-black uppercase tracking-widest text-slate-900">Total</span>
                    <span className="text-2xl font-black text-primary italic">R$ {order.total.toFixed(2)}</span>
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
                      <p className="font-bold text-slate-900">{order.customer_phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <MapPin className="size-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Endereço</p>
                      <p className="font-bold text-slate-900 leading-tight">{order.customer_address || "Retirada no Local"}</p>
                      <p className="text-xs text-slate-500 font-medium">CEP: {order.customer_cep || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <DollarSign className="size-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Pagamento</p>
                      <div className="flex gap-2 items-center">
                        <span className="font-bold text-slate-900 uppercase">{order.payment_method}</span>
                        <Badge className={cn("px-2 py-0.5 rounded-full text-[8px] font-black", 
                          order.payment_status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                          {order.payment_status === 'paid' ? "Pago" : "Pendente"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {order.notes && (
                  <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 italic text-sm text-amber-700 font-medium">
                    <p className="text-[10px] font-black uppercase text-amber-500 mb-1 not-italic">Observações:</p>
                    "{order.notes}"
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer: Action Buttons */}
          <div className="p-8 bg-white border-t border-slate-200">
            <div className="flex flex-wrap gap-3">
              {order.status === 'novo' && (
                <Button 
                  onClick={() => onUpdateStatus(order.id, 'em_preparo')}
                  className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic tracking-widest text-xs"
                >
                  Aceitar & Preparar
                </Button>
              )}
              {order.status === 'em_preparo' && (
                <Button 
                  onClick={() => onUpdateStatus(order.id, 'pronto')}
                  className="flex-1 h-14 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black uppercase italic tracking-widest text-xs"
                >
                  Pedido Pronto
                </Button>
              )}
              {order.status === 'pronto' && (
                <Button 
                  onClick={() => onUpdateStatus(order.id, 'saiu_entrega')}
                  className="flex-1 h-14 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-black uppercase italic tracking-widest text-xs"
                >
                  Sair para Entrega
                </Button>
              )}
               {order.status === 'saiu_entrega' && (
                <Button 
                  onClick={() => onUpdateStatus(order.id, 'entregue')}
                  className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase italic tracking-widest text-xs"
                >
                  Finalizar Entrega
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => onUpdateStatus(order.id, 'cancelado')}
                className="h-14 px-8 rounded-2xl border-slate-200 text-slate-400 font-bold hover:bg-rose-50 hover:text-rose-500"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
