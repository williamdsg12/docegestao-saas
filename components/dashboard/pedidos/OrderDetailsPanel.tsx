"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, Check, Truck, ShoppingBag, MapPin,
  MessageCircle, Clock, CreditCard, DollarSign, Package,
  User, Calendar, Store, Printer, ChevronDown,
  FileText, UtensilsCrossed, Download, Receipt, Copy, Phone, ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { supabase } from "@/lib/supabase"
import { criarEntregaSeNaoExistir } from "@/lib/services/delivery"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface OrderDetailsPanelProps {
  order: any | null
  isOpen: boolean
  onClose: () => void
  onUpdateStatus: (orderId: string, status: string) => void
}

function parseOrderDate(raw: string): Date {
  if (!raw) return new Date()
  const fixed = raw.includes("Z") || raw.includes("+") ? raw : raw + "Z"
  return new Date(fixed)
}

function useInternalTimer(createdAt: string, acceptedAt?: string) {
  const [seconds, setSeconds] = useState(0)
  const [display, setDisplay] = useState("00:00 seg")

  useEffect(() => {
    if (!createdAt) return
    const update = () => {
      const startTimeStr = acceptedAt || null
      if (!startTimeStr) {
        setDisplay("00:00 seg")
        setSeconds(0)
        return
      }
      
      const start = parseOrderDate(startTimeStr).getTime()
      const secs = Math.max(0, Math.floor((Date.now() - start) / 1000))
      setSeconds(secs)
      if (secs < 60) {
        setDisplay(`${String(secs).padStart(2, "0")}:00 seg`)
      } else if (secs < 3600) {
        const m = Math.floor(secs / 60), s = secs % 60
        setDisplay(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} min`)
      } else {
        const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60
        setDisplay(`${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} h`)
      }
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [createdAt, acceptedAt])

  return { display, seconds, isLate: seconds > 900, isVeryLate: seconds > 1800 }
}

function generateKitchenTicket(order: any): string {
  const items = (order.items || []).map((i: any) =>
    `<div style="margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; font-weight: bold;">
        <span>${i.quantity} UN</span>
      </div>
      <div style="font-weight: bold; text-transform: uppercase;">${i.name}</div>
      ${i.variation ? `<div style="font-size: 11px;">- ${i.variation.name || i.variation}</div>` : ""}
      ${i.extras ? `<div style="font-size: 11px;">+ ${i.extras.join(", ")}</div>` : ""}
      ${i.observation ? `<div style="font-size: 11px; margin-top: 2px;">Obs: ${i.observation}</div>` : ""}
    </div>`
  ).join("")

  const typeLabel = order.order_type === 'delivery' ? 'Delivery' : order.order_type === 'retirada' ? 'Pra Retirar' : 'Na Mesa'
  const orderCode = order.code || order.id?.slice(-4).toUpperCase()

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <title>Cozinha #${orderCode}</title>
  <style>
    body{font-family:monospace;width:80mm;margin:0;padding:8px;font-size:12px;line-height:1.2;color:#000;}
    .header{text-align:center;font-weight:bold;margin-bottom:8px;}
    .sep{border:none;border-top:1px dashed #000;margin:8px 0}
  </style></head><body>
  <div class="header">**** PEDIDO #${orderCode} ****</div>
  <div class="header">${typeLabel}</div>
  <div class="sep"></div>
  <p style="margin:4px 0">Data: ${format(parseOrderDate(order.createdAt || order.created_at || new Date().toISOString()), "dd/MM/yyyy HH:mm")}</p>
  <div class="sep"></div>
  <div style="font-weight: bold; text-align: center; margin-bottom: 8px;">ITENS DO PEDIDO</div>
  ${items}
  ${order.notes ? `<div class="sep"></div><p style="margin:4px 0;"><b>OBS GERAL:</b> ${order.notes}</p>` : ""}
  <div class="sep"></div>
  <p style="text-align:center; font-size: 10px;">IMPRESSO EM ${format(new Date(), "dd/MM/yyyy HH:mm")}</p>
  </body></html>`
}

function generateClientTicket(order: any): string {
  const items = (order.items || []).map((i: any) => {
    const unitPrice = Number(i.unit_price || i.price || 0)
    const totalPrice = Number(i.total_price || (unitPrice * i.quantity))
    return `
    <div style="margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between;">
        <span><b>${i.quantity} UN</b></span>
        <span><b>R$ ${unitPrice.toFixed(2)}</b></span>
      </div>
      <div style="text-transform: uppercase;">${i.name}</div>
      ${i.variation ? `<div style="font-size: 11px;">- ${i.variation.name || i.variation}</div>` : ""}
      ${i.extras ? `<div style="font-size: 11px;">+ ${i.extras.join(", ")}</div>` : ""}
      ${i.observation ? `<div style="font-size: 11px; margin-top: 2px;">Obs: ${i.observation}</div>` : ""}
      <div style="text-align: right; font-weight: bold; border-top: 1px dotted #ccc; margin-top: 2px;">Total do item: R$ ${totalPrice.toFixed(2)}</div>
    </div>`
  }).join("")

  const typeLabel = order.delivery?.type === 'delivery' ? 'Delivery' : (order.delivery?.type === 'retirada' || order.delivery?.type === 'pickup') ? 'Pra Retirar' : 'Na Mesa'
  const orderCode = order.code || order.id?.slice(-4).toUpperCase()
  const isDelivery = order.delivery?.type === 'delivery'

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <title>Pedido #${orderCode}</title>
  <style>
    body{font-family:monospace;width:80mm;margin:0;padding:8px;font-size:12px;line-height:1.2;color:#000;}
    .header{text-align:center;font-weight:bold;margin-bottom:4px;}
    .sep{border:none;border-top:1px dashed #000;margin:8px 0}
    .total-box{border: 1px dashed #000; padding: 4px;}
    .flex-between{display: flex; justify-content: space-between;}
  </style></head><body>
  <div class="header">**** PEDIDO #${orderCode} ****</div>
  <div class="header">${typeLabel}</div>
  <div class="header" style="font-size: 14px; margin-top: 8px;">${order.merchant_name || 'NOME DO ESTABELECIMENTO'}</div>
  
  <p style="margin:4px 0">Data do Pedido: ${format(parseOrderDate(order.createdAt || order.created_at || new Date().toISOString()), "dd/MM/yyyy HH:mm")}</p>
  <p style="margin:4px 0">Cliente: ${order.customer?.name || order.customerName || order.cliente_name || order.nomeCliente || order.cliente?.nome || "NOME DO CLIENTE"}</p>
  <p style="margin:4px 0">Telefone: ${order.customer?.phone || "NÃO INFORMADO"}</p>
  
  <div class="sep"></div>
  <div style="font-weight: bold; text-align: center; margin-bottom: 8px;">ITENS DO PEDIDO</div>
  ${items}
  
  <div class="sep"></div>
  <div style="text-align: center; font-weight: bold; margin-bottom: 4px;">TOTAL</div>
  <div class="total-box">
    <div class="flex-between"><span>Valor total dos itens</span><span>R$ ${Number(order.subtotal || 0).toFixed(2)}</span></div>
    <div class="flex-between"><span>Taxa de Entrega</span><span>R$ ${Number(order.delivery?.fee || 0).toFixed(2)}</span></div>
    <div class="flex-between"><span>Desconto</span><span>- R$ ${Number(order.discount || 0).toFixed(2)}</span></div>
    <div class="flex-between" style="font-size: 14px; font-weight: bold; margin-top: 4px; border-top: 1px solid #000; padding-top: 4px;">
      <span>VALOR TOTAL</span><span>R$ ${Number(order.total).toFixed(2)}</span>
    </div>
  </div>
 
  <div class="sep"></div>
  <div style="text-align: center; font-weight: bold; margin-bottom: 4px;">FORMAS DE PAGAMENTO</div>
  <div class="total-box">
    <div class="flex-between">
      <span>${order.payment?.method || 'NÃO INFORMADO'}</span>
      <span>R$ ${Number(order.total).toFixed(2)}</span>
    </div>
    ${order.payment?.changeFor ? `<div class="flex-between"><span>Troco para</span><span>R$ ${Number(order.payment.changeFor).toFixed(2)}</span></div>` : ""}
  </div>
 
  ${order.customer_cpf ? `
  <div class="sep"></div>
  <div style="font-weight: bold;">Informações Adicionais</div>
  <p style="margin:4px 0">Incluir CPF na nota fiscal: ${order.customer_cpf}</p>
  ` : ""}
 
  ${isDelivery ? `
  <div class="sep"></div>
  <div class="header">ENTREGA PEDIDO #${orderCode}</div>
  <p style="margin:4px 0"><b>Endereço:</b> ${order.delivery?.address || 'N/A'}, ${order.delivery?.number || ''} - ${order.delivery?.neighborhood || ''}</p>
  ${order.delivery?.reference ? `<p style="margin:4px 0"><b>Ref:</b> ${order.delivery.reference}</p>` : ""}
  ` : ""}
 
  <div class="sep"></div>
  <p style="text-align:center; font-size: 10px;">IMPRESSO POR DOCE GESTÃO</p>
  </body></html>`
}

export function OrderDetailsPanel({ order, isOpen, onClose, onUpdateStatus }: OrderDetailsPanelProps) {
  const queryClient = useQueryClient()
  const [printMenuOpen, setPrintMenuOpen] = useState(false)
  const [couriers, setCouriers] = useState<any[]>([])
  const [assignedCourier, setAssignedCourier] = useState<any | null>(null)
  const [loadingCouriers, setLoadingCouriers] = useState(false)
  const [showCourierDropdown, setShowCourierDropdown] = useState(false)

  const isDelivery = order?.delivery?.type === 'delivery' || order?.order_type === 'delivery' || order?.tipo_pedido === 'delivery' || order?.tipo_pedido === 'entrega'

  // Fetch couriers and assigned courier when drawer opens
  useEffect(() => {
    if (isOpen && order?.id) {
      fetchAssignedCourier()
      if (isDelivery && order.tenant_id) {
        fetchAvailableCouriers()
      }
    } else {
      setAssignedCourier(null)
      setCouriers([])
      setShowCourierDropdown(false)
    }
  }, [isOpen, order?.id, order?.tenant_id])

  if (!order) return null

  const rawStatus = order.status || "novo"
  const status = (rawStatus === 'pronto' && assignedCourier) ? 'assigned' : rawStatus
  const whatsappNumber = order.customer?.phone?.replace(/\D/g, "")
  const whatsappUrl = `https://wa.me/55${whatsappNumber}`
  const orderDate = parseOrderDate(order.createdAt || order.created_at || new Date().toISOString())
  const orderCode = order.code || `#${order.id?.slice(-4).toUpperCase()}`

  async function fetchAssignedCourier() {
    try {
      // First try to load from orders/pedidos driver_id column
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .select('driver_id')
        .eq('id', order.id)
        .maybeSingle()

      if (!orderErr && orderData?.driver_id) {
        const { data: driverData, error: driverErr } = await supabase
          .from('delivery_drivers')
          .select('*')
          .eq('id', orderData.driver_id)
          .maybeSingle()
        
        if (!driverErr && driverData) {
          setAssignedCourier(driverData)
          return
        }
      }

      // Legacy fallback
      const { data, error } = await supabase
        .from('entregas')
        .select('*, entregadores(*)')
        .eq('pedido_id', order.id)
        .maybeSingle()
      
      if (error) throw error
      if (data && data.entregadores) {
        setAssignedCourier(data.entregadores)
      } else {
        setAssignedCourier(null)
      }
    } catch (err) {
      console.error("Erro ao buscar entregador designado:", err)
    }
  }

  async function fetchAvailableCouriers() {
    try {
      setLoadingCouriers(true)
      const { data, error } = await supabase
        .from('delivery_drivers')
        .select('*')
        .eq('company_id', order.tenant_id)
      
      if (error) throw error
      setCouriers(data || [])
    } catch (err) {
      console.error("Erro ao buscar entregadores:", err)
    } finally {
      setLoadingCouriers(false)
    }
  }

  async function handleAssignCourier(courierId: string) {
    try {
      // 1. Update orders table with driver_id (do NOT update status to 'assigned' to avoid check constraint)
      const { error: updateOrderErr } = await supabase
        .from('orders')
        .update({ 
          driver_id: courierId
        })
        .eq('id', order.id)
      
      if (updateOrderErr) throw updateOrderErr

      // 2. Update pedidos table as well (for compatibility)
      await supabase
        .from('pedidos')
        .update({ 
          driver_id: courierId
        })
        .eq('id', order.id)

      // 3. Update legacy entregas table just in case it is queried elsewhere
      await criarEntregaSeNaoExistir(supabase, {
        id: order.id,
        tenant_id: order.tenant_id
      })
      await supabase
        .from('entregas')
        .update({ 
          status: 'assigned',
          entregador_id: courierId
        })
        .eq('pedido_id', order.id)

      // Notify status change to parent/UI using the actual raw status to avoid trigger failures
      await onUpdateStatus(order.id, order.status || 'pronto')
      
      toast.success("Entregador designado com sucesso!")
      setShowCourierDropdown(false)
      
      // Refresh local assignment details
      await fetchAssignedCourier()
      
      // Invalidate queries
      if (order.tenant_id) {
        queryClient.invalidateQueries({ queryKey: ["orders", order.tenant_id] })
      }
    } catch (err) {
      console.error("Erro ao designar entregador:", err)
      toast.error("Erro ao designar entregador")
    }
  }


  const handleCopyAddress = () => {
    const addr = `${order.delivery?.address || ''}${order.delivery?.number ? `, ${order.delivery.number}` : ''} - ${order.delivery?.neighborhood || ''}`
    navigator.clipboard.writeText(addr)
    toast.success("Endereço copiado para a área de transferência!")
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.delivery?.address || ''}${order.delivery?.number ? `, ${order.delivery.number}` : ''} - ${order.delivery?.neighborhood || ''}`)}`

  // Action buttons by status
  const getActionButton = () => {
    switch (status.toLowerCase()) {
      case "novo": case "pendente":
        return { label: "✓ ACEITAR PEDIDO", nextStatus: "preparo", className: "bg-[#16a34a] hover:bg-[#15803d] text-white" }
      case "preparo":
        return { label: "🍳 MARCAR COMO PRONTO", nextStatus: "pronto", className: "bg-[#1a56db] hover:bg-[#1e40af] text-white" }
      case "pronto":
        if (isDelivery && !assignedCourier) {
          return { label: "🛵 DESIGNAR ENTREGADOR PRIMEIRAMENTE", nextStatus: "", className: "bg-slate-300 text-slate-500 cursor-not-allowed", disabled: true }
        }
        if (isDelivery) {
          return { label: "🚀 DESPACHAR PEDIDO", nextStatus: "on_route", className: "bg-[#f97316] hover:bg-[#ea580c] text-white" }
        }
        return { label: "✓ FINALIZAR PEDIDO", nextStatus: "finalizado", className: "bg-[#15803d] hover:bg-[#166534] text-white" }
      case "assigned":
        return { label: "🚀 DESPACHAR PEDIDO", nextStatus: "on_route", className: "bg-[#f97316] hover:bg-[#ea580c] text-white" }
      case "on_route": case "a_caminho":
        return { label: "✓ MARCAR COMO ENTREGUE", nextStatus: "delivered", className: "bg-[#16a34a] hover:bg-[#15803d] text-white" }
      default: return null
    }
  }

  const statusLabel: Record<string, { label: string; color: string }> = {
    novo:         { label: "Pendente",        color: "bg-orange-100 text-[#f97316]" },
    pendente:     { label: "Pendente",        color: "bg-orange-100 text-[#f97316]" },
    preparo:      { label: "Em Preparação",   color: "bg-green-100 text-[#16a34a]" },
    pronto:       { label: "Pronto",          color: "bg-blue-100 text-[#1a56db]" },
    a_caminho:    { label: "A Caminho",       color: "bg-purple-100 text-purple-700" },
    chegou:       { label: "Chegou no Local", color: "bg-indigo-100 text-indigo-700" },
    finalizado:   { label: "Finalizado",      color: "bg-slate-100 text-slate-500" },
    cancelado:    { label: "Cancelado",       color: "bg-red-100 text-[#dc2626]" },
    assigned:     { label: "Entregador Atribuído", color: "bg-blue-50 text-blue-600" },
    on_route:     { label: "Saiu para Entrega", color: "bg-purple-100 text-purple-700 animate-pulse" },
    delivered:    { label: "Entregue",         color: "bg-slate-100 text-slate-500" }
  }

  const currentStatus = statusLabel[status.toLowerCase()] || statusLabel[status] || { label: status, color: "bg-slate-100 text-slate-600" }
  const actionBtn = getActionButton()

  const openPrintWindow = (html: string) => {
    const w = window.open("", "_blank", "width=400,height=600")
    if (!w) return
    w.document.write(html)
    w.document.close()
    setTimeout(() => { w.print(); w.close() }, 300)
  }

  const handlePrintKitchen = () => {
    openPrintWindow(generateKitchenTicket(order))
    setPrintMenuOpen(false)
  }

  const handlePrintClient = () => {
    openPrintWindow(generateClientTicket(order))
    setPrintMenuOpen(false)
  }

  const handleDownloadPDF = () => {
    const w = window.open("", "_blank")
    if (!w) return
    w.document.write(generateClientTicket(order))
    w.document.close()
    setPrintMenuOpen(false)
  }

  const TimerDisplay = () => {
    const timer = useInternalTimer(order.createdAt || order.created_at, order.accepted_at || order.acceptedAt)
    const colorClass = timer.isVeryLate 
      ? "bg-red-50 text-red-600 border border-red-200" 
      : timer.isLate 
        ? "bg-amber-50 text-amber-600 border border-amber-200" 
        : "bg-emerald-50 text-emerald-600 border border-emerald-200"

    return (
      <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full font-black text-[10px] uppercase italic tracking-wider shadow-sm", colorClass)}>
        <span className={cn("size-1.5 rounded-full animate-pulse", timer.isVeryLate ? "bg-red-600" : timer.isLate ? "bg-amber-600" : "bg-emerald-600")} />
        {timer.display}
      </span>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/35 z-40 backdrop-blur-[1px]"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[420px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden"
            onClick={() => setPrintMenuOpen(false)}
          >

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-[#1a56db] text-sm">{orderCode}</span>
                <div className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase",
                  isDelivery ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
                )}>
                  {isDelivery ? <Truck size={9} /> : <ShoppingBag size={9} />}
                  {isDelivery ? "Delivery" : "Retirada"}
                </div>
                <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase", currentStatus.color)}>
                  {currentStatus.label}
                </span>
              </div>
              <button onClick={onClose} className="size-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
                <X size={15} />
              </button>
            </div>

            {/* Meta tags & Timer display */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-slate-400 uppercase">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Store size={9} />
                  PDV
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={9} />
                  {format(orderDate, "dd/MM/yy HH:mm", { locale: ptBR })}
                </div>
              </div>
              <TimerDisplay />
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">

              {/* Customer Info */}
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                  <User size={9} /> Cliente
                </p>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="font-black text-slate-800 text-sm uppercase tracking-tight leading-none mb-1">
                      {order.customer?.name || order.customerName || order.cliente_name || order.nomeCliente || order.cliente?.nome || "Cliente não identificado"}
                    </p>
                    {order.customer?.phone && (
                      <div className="flex flex-col gap-1">
                        <a href={`tel:${order.customer?.phone}`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-all font-bold">
                          <Phone size={12} className="text-slate-400" />
                          <span>{order.customer?.phone}</span>
                        </a>
                      </div>
                    )}
                  </div>
                  {whatsappNumber && (
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-[#16a34a] hover:bg-[#148a3e] text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-md shadow-green-100"
                    >
                      <MessageCircle size={11} fill="currentColor" /> WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* Delivery Info */}
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                  <MapPin size={9} /> Endereço / Entrega
                </p>
                {isDelivery ? (
                  order.delivery?.address ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin size={13} className="text-blue-600 mt-0.5 shrink-0" />
                        <div className="space-y-0.5">
                          <p className="text-xs font-black text-slate-700 uppercase leading-none tracking-tight">
                            {order.delivery.address}{order.delivery.number ? `, ${order.delivery.number}` : ''}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase italic leading-none">
                            {order.delivery.neighborhood || 'Bairro não informado'}
                          </p>
                          {order.delivery.reference && (
                            <p className="text-[10px] font-medium text-slate-400 italic leading-none mt-1">
                              Ref: {order.delivery.reference}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quick address operations */}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleCopyAddress}
                          className="h-8 rounded-lg border-slate-200 text-slate-500 font-bold uppercase text-[9px] tracking-wider gap-1 hover:bg-slate-50"
                        >
                          <Copy size={11} /> Copiar Endereço
                        </Button>
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 rounded-lg border-slate-200 text-slate-500 font-bold uppercase text-[9px] tracking-wider gap-1 hover:bg-slate-50"
                          >
                            <ExternalLink size={11} /> Rota no Maps
                          </Button>
                        </a>
                      </div>

                      {/* Courier dropdown integration */}
                      <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Entregador Designado</span>
                          {assignedCourier ? (
                            <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black uppercase tracking-wider px-2 py-0.5">
                              🛵 EM ROTA
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-50 text-amber-600 border-none text-[8px] font-black uppercase tracking-wider px-2 py-0.5">
                              ⚠️ AGUARDANDO
                            </Badge>
                          )}
                        </div>

                        {assignedCourier ? (
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                              {(assignedCourier.photo || assignedCourier.foto_url) ? (
                                <img src={assignedCourier.photo || assignedCourier.foto_url} alt={assignedCourier.name || assignedCourier.nome} className="size-full object-cover" />
                              ) : (
                                <User size={16} className="text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-slate-800 uppercase italic leading-none mb-1">
                                {(() => {
                                  try {
                                    const parsed = JSON.parse(assignedCourier.nome || assignedCourier.name)
                                    return parsed.nome || parsed.name
                                  } catch (e) {
                                    return assignedCourier.name || assignedCourier.nome
                                  }
                                })()}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">
                                {assignedCourier.phone || assignedCourier.telefone}
                                {(() => {
                                  try {
                                    const parsed = JSON.parse(assignedCourier.nome || assignedCourier.name)
                                    if (parsed.veiculo || parsed.placa) {
                                      return ` • ${parsed.veiculo || ''} [${parsed.placa || ''}]`
                                    }
                                  } catch (e) {}
                                  if (assignedCourier.vehicle || assignedCourier.veiculo || assignedCourier.plate || assignedCourier.placa) {
                                    return ` • ${assignedCourier.vehicle || assignedCourier.veiculo || ''} [${assignedCourier.plate || assignedCourier.placa || ''}]`
                                  }
                                  return ''
                                })()}
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setShowCourierDropdown(!showCourierDropdown)}
                              className="text-[#1a56db] font-black uppercase text-[9px] hover:bg-slate-100 px-2 py-1 h-fit rounded-lg"
                            >
                              Alterar
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Button 
                              variant="outline" 
                              onClick={() => setShowCourierDropdown(!showCourierDropdown)}
                              className="w-full h-10 rounded-xl border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-wider flex items-center justify-between px-3 hover:bg-slate-100"
                            >
                              <span>Designar Entregador</span>
                              <ChevronDown size={14} />
                            </Button>
                          </div>
                        )}

                        {showCourierDropdown && (
                          <div className="bg-white border border-slate-200 rounded-xl p-1.5 max-h-36 overflow-y-auto space-y-1 shadow-sm mt-1">
                            {loadingCouriers ? (
                              <p className="text-[9px] font-bold text-slate-400 text-center py-2 uppercase animate-pulse">Carregando...</p>
                            ) : couriers.length === 0 ? (
                              <p className="text-[9px] font-bold text-slate-400 text-center py-2 uppercase">Nenhum entregador disponível</p>
                            ) : (
                              couriers.map((courier) => {
                                let name = courier.name || courier.nome
                                let vehicle = courier.vehicle || courier.veiculo || ''
                                let plate = courier.plate || courier.placa || ''
                                try {
                                  const parsed = JSON.parse(courier.nome || courier.name)
                                  name = parsed.nome || parsed.name
                                  vehicle = parsed.veiculo || vehicle
                                  plate = parsed.placa || plate
                                } catch (e) {}
                                return (
                                  <button
                                    key={courier.id}
                                    onClick={() => handleAssignCourier(courier.id)}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-700 transition-colors"
                                  >
                                    <span>{name} {vehicle ? `(${vehicle})` : ''}</span>
                                    <span className="text-[8px] font-mono bg-slate-100 text-slate-500 px-1 py-0.5 rounded uppercase">
                                      {plate || 'OK'}
                                    </span>
                                  </button>
                                )
                              })
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-300 text-xs italic font-bold">Endereço não informado</p>
                  )
                ) : (
                  <div className="flex items-center gap-2 text-orange-600">
                    <ShoppingBag size={13} />
                    <p className="text-xs font-black uppercase italic tracking-widest">
                      {order.delivery?.type === 'retirada' ? 'Retirada no balcão' : 'Consumo no local'}
                    </p>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    <Package size={9} /> Produtos
                  </p>
                  <button className="text-[9px] font-black text-[#1a56db] uppercase flex items-center gap-1 hover:underline">
                    <UtensilsCrossed size={9} /> Cozinha
                  </button>
                </div>
                <div className="space-y-2">
                  {(order.items || []).length === 0 ? (
                    <p className="text-slate-300 text-xs italic font-bold">Nenhum item</p>
                  ) : (
                    (order.items || []).map((item: any, idx: number) => (
                      <div key={item.id || idx} className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-xl group">
                        <div className="size-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-[10px] shrink-0">
                          {item.quantity}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-800 leading-none group-hover:text-blue-600 transition-colors uppercase tracking-tighter">
                            {item.quantity}x {item.name}
                          </p>
                          {item.variation && (
                            <p className="text-[10px] font-bold text-slate-400 uppercase italic">
                              Tam: {item.variation.name}
                            </p>
                          )}
                          {item.extras && item.extras.length > 0 && (
                            <p className="text-[9px] font-medium text-slate-400 italic">
                              +{item.extras.map((e: any) => e.name).join(", ")}
                            </p>
                          )}
                          {item.observation && (
                            <div className="mt-1.5 p-1.5 bg-amber-50 rounded-lg border border-amber-100/50">
                              <p className="text-[9px] font-bold text-amber-700 italic leading-tight">
                                Obs: {item.observation}
                              </p>
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-black text-slate-600 italic whitespace-nowrap">
                          R$ {Number(item.total_price || item.totalPrice || (item.unit_price * item.quantity) || (item.price * item.quantity) || 0).toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                {order.notes && (
                  <div className="mt-2 p-2.5 bg-orange-50 rounded-xl">
                    <p className="text-[9px] font-black uppercase text-orange-400 mb-0.5">Obs. do pedido</p>
                    <p className="text-xs font-bold text-orange-600">{order.notes}</p>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="px-4 py-3 border-b border-slate-100 space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Subtotal Produtos ({(order.items || []).length})</span>
                  <span>R$ {Number(order.subtotal || 0).toFixed(2)}</span>
                </div>
                {Number(order.delivery_fee) > 0 && (
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Entrega</span>
                    <span>R$ {Number(order.delivery_fee).toFixed(2)}</span>
                  </div>
                )}
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-xs font-bold text-green-600">
                    <span>Desconto</span>
                    <span>- R$ {Number(order.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase",
                    order.payment_status === "paid" ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                  )}>
                    {order.payment_status === "paid" ? "Pago" : "Não pago"}
                  </span>
                  <span className="font-black text-slate-800 text-base">
                    TOTAL <span className="text-[#1a56db]">R$ {Number(order.total).toFixed(2)}</span>
                  </span>
                </div>
                {order.payment?.method?.toLowerCase().includes("dinheiro") && order.payment?.changeFor && (
                  <div className="p-2 bg-amber-50 rounded-xl text-xs font-bold text-amber-700 flex items-center gap-2">
                    <DollarSign size={11} />
                    Troco: R$ {Math.max(0, Number(order.payment.changeFor) - Number(order.total)).toFixed(2)}
                  </div>
                )}
              </div>

              {/* Payment Details */}
              <div className="px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                  <CreditCard size={9} /> Pagamento
                </p>
                <div className="flex items-center gap-2">
                  <DollarSign size={13} className="text-slate-400" />
                  <span className="text-xs font-black text-slate-600 uppercase">
                    {(() => {
                      const labels: any = {
                        dinheiro: 'Dinheiro',
                        cash: 'Dinheiro',
                        credito: 'Cartão de Crédito',
                        credit: 'Cartão de Crédito',
                        debito: 'Cartão de Débito',
                        debit: 'Cartão de Débito',
                        pix: 'PIX'
                      };
                      const base = labels[order.payment?.method?.toLowerCase()] || order.payment?.method || 'Não informado'
                      if (order.payment?.method?.toLowerCase().includes('dinheiro') && order.payment?.changeFor) {
                        return `${base} — Troco para R$ ${Number(order.payment.changeFor).toFixed(2)}`
                      }
                      return base
                    })()}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <div className={cn(
                    "size-2 rounded-full",
                    order.payment?.status === 'paid' ? "bg-green-500" : "bg-orange-500"
                  )} />
                  <span className="text-[10px] font-bold text-slate-400 uppercase italic">
                    {order.payment?.status === 'paid' ? 'Pagamento Aprovado' : 'Aguardando Pagamento'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions footer */}
            <div className="px-4 py-3 border-t border-slate-100 bg-white space-y-2">
              {actionBtn && (
                <Button
                  disabled={actionBtn.disabled}
                  className={cn("w-full h-11 rounded-xl font-black uppercase tracking-widest text-xs", actionBtn.className)}
                  onClick={() => { onUpdateStatus(order.id, actionBtn.nextStatus); onClose() }}
                >
                  {actionBtn.label}
                </Button>
              )}

              <div className="flex gap-2">
                {/* Print tickets */}
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-xl border-slate-200 text-slate-500"
                    onClick={(e) => { e.stopPropagation(); setPrintMenuOpen(v => !v) }}
                  >
                    <Printer size={14} />
                  </Button>
                  <AnimatePresence>
                    {printMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="absolute bottom-full left-0 mb-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-10"
                        onClick={e => e.stopPropagation()}
                      >
                        <button onClick={handlePrintKitchen}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors text-left font-sans">
                          <UtensilsCrossed size={14} className="text-slate-400" />
                          Ticket de cozinha
                        </button>
                        <button onClick={handleDownloadPDF}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors text-left border-t border-slate-50 font-sans">
                          <Download size={14} className="text-slate-400" />
                          Baixar ticket em PDF
                        </button>
                        <button onClick={handlePrintClient}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors text-left border-t border-slate-50 font-sans">
                          <Receipt size={14} className="text-slate-400" />
                          Ticket do cliente
                        </button>
                        <button onClick={() => { setPrintMenuOpen(false) }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-400 hover:bg-slate-50 transition-colors text-left border-t border-slate-50 font-sans">
                          <FileText size={14} className="text-slate-300" />
                          Emitir nota fiscal
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* WhatsApp call */}
                {whatsappNumber && (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline"
                      className="w-full h-9 rounded-xl border-[#16a34a] text-[#16a34a] font-black uppercase text-[9px] tracking-widest gap-1.5 hover:bg-green-50">
                      <MessageCircle size={13} fill="currentColor" /> Chat WA
                    </Button>
                  </a>
                )}

                {/* Cancel order */}
                <Button variant="outline"
                  className="flex-1 h-9 rounded-xl border-red-500 text-red-500 font-black uppercase text-[9px] tracking-widest gap-1.5 hover:bg-red-50"
                  onClick={() => { onUpdateStatus(order.id, "cancelado"); onClose() }}
                >
                  <X size={13} /> Cancelar
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
