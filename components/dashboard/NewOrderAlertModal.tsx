"use client"

import { usePedidoStore } from "@/store/pedidoStore"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, VolumeX, Check, X, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { stopAlert } from "@/lib/notifications"
import { toast } from "sonner"

export function NewOrderAlertModal() {
  const router = useRouter()
  const popupQueue = usePedidoStore(s => s.popupQueue)
  const removeFromQueue = usePedidoStore(s => s.removeFromQueue)
  const selecionarPedido = usePedidoStore(s => s.selecionarPedido)

  if (popupQueue.length === 0) return null

  const order = popupQueue[0]

  const getOriginLabel = (channel: string | null | undefined) => {
    if (!channel) return "Cardápio Digital"
    const lower = channel.toLowerCase()
    if (lower.includes("whatsapp")) return "WhatsApp"
    if (lower.includes("pdv")) return "PDV Web"
    if (lower.includes("api")) return "API"
    return "Cardápio Digital"
  }

  const orderCode = order.code || order.id?.slice(-4).toUpperCase()
  const customerName = order.customer?.name || order.customer_name || "Cliente"
  const formattedTotal = Number(order.total || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  })
  
  const createdTime = order.created_at 
    ? new Date(order.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

  const handleAccept = async () => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          order_status: "preparo",
          accepted_at: new Date().toISOString()
        })
        .eq("id", order.id)

      if (error) throw error

      const phone = order.customer?.phone || order.customer_phone
      if (phone) {
        fetch("/api/chatbot/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: order.tenant_id || order.company_id,
            phone: phone.replace(/\D/g, ""),
            type: "received",
            orderData: {
              codigo: orderCode,
              nome: customerName,
              total: order.total,
              tempo: 30,
              tipo_entrega: order.order_type === "delivery" ? "Delivery" : "Retirada",
              endereco: order.delivery_address || ""
            }
          })
        }).catch(e => console.error("Error sending WhatsApp notification:", e))
      }

      toast.success(`Pedido #${orderCode} aceito! 🚀`)
    } catch (e) {
      toast.error("Erro ao aceitar o pedido")
    } finally {
      stopAlert()
      removeFromQueue(order.id)
    }
  }

  const handleReject = async () => {
    const confirmed = window.confirm("Deseja realmente recusar e cancelar este pedido?")
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from("orders")
        .update({ order_status: "cancelado" })
        .eq("id", order.id)

      if (error) throw error

      const phone = order.customer?.phone || order.customer_phone
      if (phone) {
        fetch("/api/chatbot/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: order.tenant_id || order.company_id,
            phone: phone.replace(/\D/g, ""),
            type: "cancelled",
            orderData: {
              codigo: orderCode,
              nome: customerName,
              total: order.total,
              tempo: 30,
              tipo_entrega: order.order_type === "delivery" ? "Delivery" : "Retirada",
              endereco: order.delivery_address || ""
            }
          })
        }).catch(e => console.error("Error sending WhatsApp notification:", e))
      }

      toast.error(`Pedido #${orderCode} recusado/cancelado.`)
    } catch (e) {
      toast.error("Erro ao recusar o pedido")
    } finally {
      stopAlert()
      removeFromQueue(order.id)
    }
  }

  const handleViewOrder = () => {
    stopAlert()
    removeFromQueue(order.id)
    // Normalize properties for the orderDetails panel
    const normalizedOrder = {
      ...order,
      customer: order.customer || { name: customerName, phone: order.customer_phone || "" },
      delivery: order.delivery || {
        type: order.order_type || "retirada",
        address: order.delivery_address || "",
        number: order.delivery_number || ""
      }
    }
    selecionarPedido(normalizedOrder)
    router.push("/dashboard/pedidos")
  }

  const handleMute = () => {
    stopAlert()
    removeFromQueue(order.id)
    toast.info("Alerta sonoro interrompido")
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white dark:bg-slate-900 border-2 border-pink-500 rounded-3xl p-6 shadow-2xl max-w-md w-full relative overflow-hidden"
        >
          {/* Accent decoration */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-emerald-500" />
          
          <div className="flex flex-col items-center text-center">
            {/* Pulsing Alert Icon */}
            <div className="relative size-16 bg-pink-100 dark:bg-pink-950/50 rounded-full flex items-center justify-center text-pink-600 mb-4">
              <span className="absolute inset-0 rounded-full bg-pink-500/20 animate-ping" />
              <Bell className="size-8 animate-bounce" />
            </div>

            <h2 className="text-xl font-black italic uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              🔔 Novo Pedido Recebido!
            </h2>
            <p className="text-sm font-black text-pink-500 mt-1 tracking-wider">
              PEDIDO #{orderCode}
            </p>

            <div className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 my-5 space-y-2 text-left text-xs font-bold text-slate-700 dark:text-slate-300">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="uppercase text-[10px] tracking-wider text-slate-400">Cliente</span>
                <span className="font-black text-slate-900 dark:text-white">{customerName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="uppercase text-[10px] tracking-wider text-slate-400">Total</span>
                <span className="font-black text-emerald-600 text-sm">{formattedTotal}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="uppercase text-[10px] tracking-wider text-slate-400">Origem</span>
                <span className="font-black uppercase text-pink-600">{getOriginLabel(order.channel)}</span>
              </div>
              <div className="flex justify-between">
                <span className="uppercase text-[10px] tracking-wider text-slate-400">Horário</span>
                <span className="font-black text-slate-900 dark:text-white">{createdTime}</span>
              </div>
            </div>

            {/* Buttons Layout */}
            <div className="grid grid-cols-2 gap-3 w-full mb-3">
              <Button
                onClick={handleAccept}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all border border-emerald-500/20"
              >
                <Check size={14} />
                Aceitar
              </Button>
              <Button
                onClick={handleViewOrder}
                className="bg-pink-500 hover:bg-pink-600 text-white font-black uppercase text-[10px] tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-pink-500/10 hover:shadow-pink-500/20 transition-all border border-pink-400/20"
              >
                <Eye size={14} />
                Ver Pedido
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                variant="ghost"
                onClick={handleReject}
                className="hover:bg-rose-500/10 text-rose-500 font-bold uppercase text-[9px] tracking-wider py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                <X size={12} />
                Recusar Pedido
              </Button>
              <Button
                variant="ghost"
                onClick={handleMute}
                className="hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[9px] tracking-wider py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                <VolumeX size={12} />
                Parar Alerta
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
