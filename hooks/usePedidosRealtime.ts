import { useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { usePedidoStore } from "@/store/pedidoStore"
import { useBusiness } from "@/hooks/useBusiness"
import { toast } from "sonner"
import { sendBrowserNotification, startAlert, stopAlert } from "@/lib/notifications"
import { useQueryClient } from "@tanstack/react-query"

export function usePedidosRealtime() {
    const { profile } = useBusiness()
    const addPedido = usePedidoStore(state => state.addPedido)
    const updatePedido = usePedidoStore(state => state.updatePedido)
    const queryClient = useQueryClient()

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
                    
                    // Invalidate caches immediately
                    queryClient.invalidateQueries({ queryKey: ["orders", tenantId] })
                    queryClient.invalidateQueries({ queryKey: ["dashboard-stats", tenantId] })

                    // Fetch customer metadata for complete payload
                    supabase
                        .from('customers')
                        .select('name, phone')
                        .eq('id', rawOrder.customer_id)
                        .maybeSingle()
                        .then(({ data: customer }) => {
                            const newOrder = {
                                ...rawOrder,
                                status: rawOrder.order_status || rawOrder.status || 'novo',
                                customer: {
                                    name: customer?.name || rawOrder.customer_name || 'Cliente',
                                    phone: customer?.phone || rawOrder.customer_phone || ''
                                },
                                customers: customer ? { name: customer.name, phone: customer.phone } : undefined
                            }
                            
                            // Add order to Zustand store and popup queue
                            addPedido(newOrder)
                            
                            // Play iFood looping alert sound if enabled and it's a delivery order
                            const soundEnabled = localStorage.getItem("order_sound_enabled") !== "false"
                            const isDelivery = newOrder.order_type === 'delivery' || newOrder.delivery?.type === 'delivery'
                            if (soundEnabled && isDelivery && (newOrder.status === 'novo' || newOrder.status === 'pending')) {
                                startAlert()
                            }
                            
                            // Push Browser notification
                            sendBrowserNotification(newOrder)
                            
                            toast.success("Novo pedido recebido! 🚀", {
                                description: `Cliente: ${newOrder.customer.name} - R$ ${Number(newOrder.total || 0).toFixed(2)}`,
                                duration: 10000,
                            })
                        })
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
                    
                    // Invalidate caches
                    queryClient.invalidateQueries({ queryKey: ["orders", tenantId] })
                    queryClient.invalidateQueries({ queryKey: ["dashboard-stats", tenantId] })

                    // If order status is accepted/rejected, stop audio alert and clear from visual queue
                    if (updatedOrder.status !== 'novo' && updatedOrder.status !== 'pending') {
                        const queue = usePedidoStore.getState().popupQueue
                        if (queue.some(p => p.id === updatedOrder.id)) {
                            usePedidoStore.getState().removeFromQueue(updatedOrder.id)
                            
                            const updatedQueue = usePedidoStore.getState().popupQueue.filter(p => p.id !== updatedOrder.id)
                            if (updatedQueue.length === 0) {
                                stopAlert()
                            }
                        }
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "orders",
                    filter: `tenant_id=eq.${tenantId}`
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["orders", tenantId] })
                    queryClient.invalidateQueries({ queryKey: ["dashboard-stats", tenantId] })
                }
            )
            .subscribe()

        const callsChannel = supabase
            .channel(`restaurant-table-calls-${tenantId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "restaurant_table_calls",
                    filter: `company_id=eq.${tenantId}`
                },
                (payload) => {
                    const newCall = payload.new as any
                    if (newCall.status === 'pending') {
                        // Table calls do not trigger the looping alarm to avoid non-stop ringing
                        const actionLabel = newCall.type === 'bill' ? "🧾 Pedido de Conta" : "🛎️ Chamar Garçom"
                        
                        const handleAttend = async () => {
                            await supabase
                                .from('restaurant_table_calls')
                                .update({ status: 'attended' })
                                .eq('id', newCall.id)
                            stopAlert()
                            toast.dismiss(newCall.id)
                        }

                        toast.warning(`${actionLabel} na Mesa ${newCall.table_number}!`, {
                            id: newCall.id,
                            description: "Mesa está aguardando atendimento.",
                            duration: 60000,
                            action: {
                                label: "Atender",
                                onClick: handleAttend
                            }
                        })
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
            supabase.removeChannel(callsChannel)
        }
    }, [profile, addPedido, updatePedido, queryClient])
}

