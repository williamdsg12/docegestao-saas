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
            .channel("pedidos-realtime-global")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "orders",
                    filter: `tenant_id=eq.${tenantId}`
                },
                (payload) => {
                    const newOrder = payload.new as any
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
                    updatePedido(payload.new.id, payload.new as any)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [profile, addPedido, updatePedido])
}
