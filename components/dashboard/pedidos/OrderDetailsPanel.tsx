"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, Check, Truck, ShoppingBag, MapPin,
  MessageCircle, Clock, CreditCard, DollarSign, Package,
  User, Calendar, Store, Printer, ChevronDown,
  FileText, UtensilsCrossed, Download, Receipt
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface OrderDetailsPanelProps {
  order: any | null
  isOpen: boolean
  onClose: () => void
  onUpdateStatus: (orderId: string, status: string) => void
}

// ── Helper: formata created_at respeitando UTC ────────────────────────────────
function parseOrderDate(raw: string): Date {
  if (!raw) return new Date()
  // Se não tem timezone explicito, assume UTC (Supabase salva em UTC sem 'Z')
  const fixed = raw.includes("Z") || raw.includes("+") ? raw : raw + "Z"
  return new Date(fixed)
}

// ── Timer crescente interno (sem hook externo para não perder referência) ─────
function useInternalTimer(createdAt: string) {
  const [seconds, setSeconds] = useState(0)
  const [display, setDisplay] = useState("00:00 seg")

  useEffect(() => {
    if (!createdAt) return
    const update = () => {
      const created = parseOrderDate(createdAt).getTime()
      const secs = Math.max(0, Math.floor((Date.now() - created) / 1000))
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
  }, [createdAt])

  return { display, seconds, isLate: seconds > 900, isVeryLate: seconds > 1800 }
}

// ── Gerador HTML da comanda de cozinha ────────────────────────────────────────
function generateKitchenTicket(order: any): string {
  const items = (order.items || []).map((i: any) =>
    `<tr>
      <td style="padding:2px 8px 2px 0;font-size:13px;"><b>${i.quantity}x</b></td>
      <td style="padding:2px 0;font-size:13px;">${i.name}${i.observation ? `<br/><span style="font-size:11px;color:#555">⚠ ${i.observation}</span>` : ""}</td>
    </tr>`
  ).join("")

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <title>Ticket Cozinha #${order.code || order.id?.slice(-4).toUpperCase()}</title>
  <style>
    body{font-family:monospace;width:80mm;margin:0;padding:8px;font-size:13px;}
    h2{text-align:center;font-size:16px;margin:0 0 4px}
    .sep{border:none;border-top:1px dashed #000;margin:6px 0}
    table{width:100%;border-collapse:collapse}
    .badge{display:inline-block;border:1px solid #000;padding:1px 6px;font-size:11px;margin:2px 0}
  </style></head><body>
  <h2>TICKET COZINHA</h2>
  <p style="text-align:center;font-size:20px;font-weight:bold;margin:0">
    #${order.code || order.id?.slice(-4).toUpperCase()}
  </p>
  <hr class="sep"/>
  <p style="margin:2px 0"><b>Tipo:</b> ${order.order_type === "delivery" ? "🚚 Delivery" : "🏪 Retirada"}</p>
  <hr class="sep"/>
  <table>${items}</table>
  ${order.notes ? `<hr class="sep"/><p style="margin:2px 0;font-size:11px">⚠ OBS: ${order.notes}</p>` : ""}
  <hr class="sep"/>
  <p style="text-align:center;font-size:10px;margin:4px 0">
    ${format(parseOrderDate(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
  </p>
  </body></html>`
}

// ── Gerador HTML do ticket do cliente ────────────────────────────────────────
function generateClientTicket(order: any): string {
  const items = (order.items || []).map((i: any) =>
    `<tr>
      <td style="padding:2px 8px 2px 0">${i.quantity}x ${i.name}</td>
      <td style="text-align:right">R$ ${Number(i.unit_price || i.price || 0).toFixed(2)}</td>
    </tr>`
  ).join("")

  const isDelivery = order.order_type === "delivery"
  const addr = buildAddress(order)

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <title>Pedido #${order.code || order.id?.slice(-4).toUpperCase()}</title>
  <style>
    body{font-family:monospace;width:80mm;margin:0;padding:8px;font-size:12px;}
    h2{text-align:center;font-size:15px;margin:0 0 4px}
    .sep{border:none;border-top:1px dashed #000;margin:5px 0}
    table{width:100%;border-collapse:collapse}
    .total{font-size:14px;font-weight:bold}
  </style></head><body>
  <h2>${order.customer?.name || "PEDIDO"}</h2>
  <p style="text-align:center;font-size:18px;font-weight:bold;margin:0">
    #${order.code || order.id?.slice(-4).toUpperCase()}
  </p>
  <hr class="sep"/>
  <p style="margin:2px 0"><b>Tipo:</b> ${isDelivery ? "🚚 Delivery" : "🏪 Retirada"}</p>
  ${isDelivery && addr ? `<p style="margin:2px 0"><b>Endereço:</b> ${addr}</p>` : ""}
  <p style="margin:2px 0"><b>Pagamento:</b> ${order.payment_method || "—"} · ${order.payment_status === "paid" ? "✓ Pago" : "Não pago"}</p>
  <hr class="sep"/>
  <table>${items}</table>
  <hr class="sep"/>
  ${Number(order.delivery_fee) > 0 ? `<p style="margin:2px 0;text-align:right">Entrega: R$ ${Number(order.delivery_fee).toFixed(2)}</p>` : ""}
  ${Number(order.discount) > 0 ? `<p style="margin:2px 0;text-align:right">Desconto: -R$ ${Number(order.discount).toFixed(2)}</p>` : ""}
  <p class="total" style="text-align:right">TOTAL: R$ ${Number(order.total).toFixed(2)}</p>
  <hr class="sep"/>
  <p style="text-align:center;font-size:10px">
    ${format(parseOrderDate(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
  </p>
  </body></html>`
}

// ── Monta string de endereço a partir dos dados do pedido ────────────────────
function buildAddress(order: any): string {
  // 1. Tenta objeto address (join do Supabase)
  if (order.address && typeof order.address === "object") {
    const a = order.address
    return [
      a.street,
      a.number ? `#${a.number}` : "",
      a.complement,
      a.neighborhood,
      a.city,
    ].filter(Boolean).join(", ")
  }
  // 2. Tenta string direta
  if (order.address && typeof order.address === "string") return order.address
  // 3. Tenta campos soltos
  if (order.customer_address) return order.customer_address
  if (order.endereco_entrega) return order.endereco_entrega
  return ""
}

// ── Verifica se é delivery ────────────────────────────────────────────────────
function isDeliveryOrder(order: any): boolean {
  const t = (order.order_type || "").toLowerCase()
  return t === "delivery" || t === "entrega"
}

export function OrderDetailsPanel({ order, isOpen, onClose, onUpdateStatus }: OrderDetailsPanelProps) {
  const [printMenuOpen, setPrintMenuOpen] = useState(false)

  if (!order) return null

  const isDelivery = isDeliveryOrder(order)
  const status = order.order_status || order.status || "novo"
  const address = buildAddress(order)
  const whatsappNumber = (order.customer_phone || order.customer?.phone || order.customer?.whatsapp || "").replace(/\D/g, "")
  const whatsappUrl = `https://wa.me/55${whatsappNumber}`
  const orderDate = parseOrderDate(order.created_at)
  const orderCode = order.code || `#${order.id?.slice(-4).toUpperCase()}`

  // Ações por status
  const getActionButton = () => {
    switch (status) {
      case "novo": case "pendente":
        return { label: "✓ ACEITAR PEDIDO", nextStatus: "preparo", className: "bg-[#16a34a] hover:bg-[#15803d] text-white" }
      case "preparo":
        return { label: "🍳 MARCAR COMO PRONTO", nextStatus: "pronto", className: "bg-[#1a56db] hover:bg-[#1e40af] text-white" }
      case "pronto":
        return { label: "✓ FINALIZAR PEDIDO", nextStatus: "finalizado", className: "bg-[#15803d] hover:bg-[#166534] text-white" }
      default: return null
    }
  }

  const statusLabel: Record<string, { label: string; color: string }> = {
    novo:      { label: "Pendente",       color: "bg-orange-100 text-[#f97316]" },
    pendente:  { label: "Pendente",       color: "bg-orange-100 text-[#f97316]" },
    preparo:   { label: "Em Preparação",  color: "bg-green-100 text-[#16a34a]" },
    pronto:    { label: "Pronto",         color: "bg-blue-100 text-[#1a56db]" },
    finalizado:{ label: "Finalizado",     color: "bg-blue-100 text-[#1a56db]" },
    cancelado: { label: "Cancelado",      color: "bg-red-100 text-[#dc2626]" },
  }

  const currentStatus = statusLabel[status] || { label: status, color: "bg-slate-100 text-slate-600" }
  const actionBtn = getActionButton()

  // ── Funções de impressão ────────────────────────────────────────────────────
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
    // Abre o ticket do cliente em nova aba para o usuário salvar como PDF
    const w = window.open("", "_blank")
    if (!w) return
    w.document.write(generateClientTicket(order))
    w.document.close()
    setPrintMenuOpen(false)
  }

  // ── Timer interno ───────────────────────────────────────────────────────────
  const TimerDisplay = () => {
    const timer = useInternalTimer(order.created_at)
    return (
      <span className={cn(
        "flex items-center gap-1 font-black text-[10px]",
        timer.isVeryLate ? "text-[#dc2626]" : timer.isLate ? "text-[#f97316]" : "text-[#1a56db]"
      )}>
        <span className={cn(
          "size-1.5 rounded-full animate-pulse",
          timer.isVeryLate ? "bg-[#dc2626]" : timer.isLate ? "bg-[#f97316]" : "bg-[#1a56db]"
        )} />
        {timer.display}
      </span>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
          />

          {/* Painel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[420px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden"
            onClick={() => setPrintMenuOpen(false)}
          >

            {/* ── HEADER ─────────────────────────────────────────────────── */}
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

            {/* ── META: DATA REAL + CANAL + TIMER ────────────────────────── */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400 uppercase">
              <div className="flex items-center gap-1">
                <Store size={9} />
                PDV
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={9} />
                {/* Data e hora reais em horário local */}
                {format(orderDate, "dd/MM/yy HH:mm", { locale: ptBR })}
              </div>
              {/* Timer crescente */}
              <TimerDisplay />
              {order.id && (
                <span className="text-[9px] text-slate-300 font-mono truncate max-w-[140px]">
                  {order.id}
                </span>
              )}
            </div>

            {/* ── SCROLLABLE CONTENT ──────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">

              {/* CLIENTE */}
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                  <User size={9} /> Cliente
                </p>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5">
                    <p className="font-black text-slate-800 text-sm uppercase tracking-tight">
                      {order.customer_name || order.customer?.name || "Cliente"}
                    </p>
                    {whatsappNumber && (
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[#16a34a] font-bold text-xs hover:underline"
                      >
                        <MessageCircle size={12} fill="currentColor" />
                        {order.customer_phone || order.customer?.phone || whatsappNumber}
                      </a>
                    )}
                  </div>
                  {whatsappNumber && (
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-[#16a34a] text-white rounded-xl text-[10px] font-black uppercase"
                    >
                      <MessageCircle size={11} fill="currentColor" /> WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* ENDEREÇO */}
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                  <MapPin size={9} /> Endereço / Entrega
                </p>
                {isDelivery ? (
                  address ? (
                    <div className="flex items-start gap-2">
                      <MapPin size={13} className="text-[#1a56db] mt-0.5 shrink-0" />
                      <span className="text-xs font-bold text-slate-600 uppercase">{address}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 italic font-bold">Endereço não informado</p>
                  )
                ) : (
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                    <ShoppingBag size={13} className="text-slate-400" />
                    Retirada no balcão
                  </div>
                )}

                <button className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#bfdbfe] bg-[#eff6ff] text-[#1a56db] font-black text-[9px] uppercase tracking-widest hover:bg-blue-100 transition-colors">
                  {isDelivery ? "🛵 Escolher entregador" : "🍽️ Atribuir Mesa"}
                  <ChevronDown size={9} />
                </button>
              </div>

              {/* ITENS */}
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
                      <div key={item.id || idx} className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-xl">
                        <div className="size-7 rounded-lg bg-[#1a56db] text-white flex items-center justify-center font-black text-[10px] shrink-0">
                          {item.quantity}x
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-700 text-xs uppercase truncate">{item.name}</p>
                          {item.variation && typeof item.variation === "object" && Object.keys(item.variation).length > 0 && (
                            <p className="text-[10px] text-slate-400 font-bold">
                              {Object.values(item.variation).join(", ")}
                            </p>
                          )}
                          {item.extras && (Array.isArray(item.extras) ? item.extras.length > 0 : item.extras) && (
                            <p className="text-[10px] text-slate-400 font-bold">
                              + {Array.isArray(item.extras) ? item.extras.join(", ") : item.extras}
                            </p>
                          )}
                          {(item.observation || item.notes) && (
                            <p className="text-[10px] text-orange-500 font-bold">⚠ {item.observation || item.notes}</p>
                          )}
                        </div>
                        <span className="font-black text-slate-700 text-xs shrink-0">
                          R$ {Number(item.total_price || (item.unit_price || item.price || 0) * item.quantity).toFixed(2)}
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

              {/* TOTAIS */}
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
                {order.payment_method?.toLowerCase().includes("dinheiro") && order.change_for && (
                  <div className="p-2 bg-amber-50 rounded-xl text-xs font-bold text-amber-700 flex items-center gap-2">
                    <DollarSign size={11} />
                    Troco: R$ {Math.max(0, Number(order.change_for) - Number(order.total)).toFixed(2)}
                  </div>
                )}
              </div>

              {/* PAGAMENTO */}
              <div className="px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                  <CreditCard size={9} /> Pagamento
                </p>
                <div className="flex items-center gap-2">
                  <DollarSign size={13} className="text-slate-400" />
                  <span className="text-xs font-black text-slate-600 uppercase">
                    {order.payment_method || "Não informado"}
                  </span>
                </div>
              </div>
            </div>

            {/* ── FOOTER — AÇÕES ──────────────────────────────────────────── */}
            <div className="px-4 py-3 border-t border-slate-100 bg-white space-y-2">
              {actionBtn && (
                <Button
                  className={cn("w-full h-11 rounded-xl font-black uppercase tracking-widest text-xs", actionBtn.className)}
                  onClick={() => { onUpdateStatus(order.id, actionBtn.nextStatus); onClose() }}
                >
                  {actionBtn.label}
                </Button>
              )}

              <div className="flex gap-2">
                {/* Imprimir — dropdown igual OlaClick */}
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
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors text-left">
                          <UtensilsCrossed size={14} className="text-slate-400" />
                          Ticket de cozinha
                        </button>
                        <button onClick={handleDownloadPDF}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors text-left border-t border-slate-50">
                          <Download size={14} className="text-slate-400" />
                          Baixar ticket em PDF
                        </button>
                        <button onClick={handlePrintClient}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors text-left border-t border-slate-50">
                          <Receipt size={14} className="text-slate-400" />
                          Ticket do cliente
                        </button>
                        <button onClick={() => { setPrintMenuOpen(false) }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-400 hover:bg-slate-50 transition-colors text-left border-t border-slate-50">
                          <FileText size={14} className="text-slate-300" />
                          Emitir nota fiscal
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* WhatsApp */}
                {whatsappNumber && (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline"
                      className="w-full h-9 rounded-xl border-[#16a34a] text-[#16a34a] font-black uppercase text-[9px] tracking-widest gap-1.5 hover:bg-green-50">
                      <MessageCircle size={13} fill="currentColor" /> WhatsApp
                    </Button>
                  </a>
                )}

                {/* Cancelar */}
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
