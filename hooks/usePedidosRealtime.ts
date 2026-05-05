import { useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { usePedidoStore } from "@/store/pedidoStore"
import { useBusiness } from "@/hooks/useBusiness"
import { toast } from "sonner"
import { sendBrowserNotification, startAlert } from "@/lib/notifications"

export function usePedidosRealtime() {
    const { profile } = useBusiness()
    const addPedido = usePedidoStore(state => state.addPedido)
    const updatePedido = usePedidoStore(state => state.updatePedido)

    useEffect(() => {
        const tenantId = profile?.tenant_id || profile?.company_id
        if (!tenantId) return

        const channel = supabase
            .channel(`pedidos-realtime-${tenantId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "orders",
                    filter: `tenant_id=eq.${tenantId}`
                },
                (payload) => {
                    const rawOrder = payload.new as any
                    // Normalize order_status to status for frontend consistency
                    const newOrder = {
                        ...rawOrder,
                        status: rawOrder.order_status || rawOrder.status || 'pending'
                    }
                    
                    addPedido(newOrder)
                    
                    if (newOrder.status === 'novo' || newOrder.status === 'pending') {
                        startAlert()
                        sendBrowserNotification(newOrder)
                        toast.success("Novo pedido recebido! 🚀", {
                            description: `Pedido de R$ ${newOrder.total?.toFixed(2)}`,
                            duration: 10000,
                        })
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "orders",
                    filter: `tenant_id=eq.${tenantId}`
                },
                (payload) => {
                    const rawOrder = payload.new as any
                    const updatedOrder = {
                        ...rawOrder,
                        status: rawOrder.order_status || rawOrder.status
                    }
                    updatePedido(updatedOrder.id, updatedOrder)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [profile, addPedido, updatePedido])
}
