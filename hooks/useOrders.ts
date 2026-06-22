import { supabase } from "@/lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { criarEntregaSeNaoExistir } from "@/lib/services/delivery"

export function useOrders(companyId: string | undefined) {
    const queryClient = useQueryClient()

    const fetchOrders = async () => {
        if (!companyId) return []

        console.log('Tenant Atual:', companyId)

        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                customers (*),
                addresses!address_id(*),
                order_items(*),
                payments(
                    *,
                    payment_cash(*)
                ),
                delivery_drivers:driver_id(*)
            `)
            .eq('tenant_id', companyId)
            .order('created_at', { ascending: false })
            .limit(100)

        console.log('Pedidos Retornados:', data)
        console.log('Erro Supabase:', error)

        if (error) {
            console.error("❌ [useOrders] Error fetching orders:", error)
            throw error
        }

        const orderIds = data?.map((o: any) => o.id) || []
        const entregasMap: Record<string, string> = {}
        if (orderIds.length > 0) {
            const { data: entregasData } = await supabase
                .from('entregas')
                .select('pedido_id, status')
                .in('pedido_id', orderIds)
            if (entregasData) {
                entregasData.forEach((e: any) => {
                    entregasMap[e.pedido_id] = e.status
                })
            }
        }

        return data?.map((o: any) => {
            const payment = o.payments?.[0]
            const cash = payment?.payment_cash?.[0]
            
            const rawStatus = o.order_status || o.status || 'novo'
            let mappedStatus = rawStatus
            if (rawStatus === 'pronto') {
                if (entregasMap[o.id] && entregasMap[o.id] !== 'aguardando') {
                    mappedStatus = entregasMap[o.id]
                } else if (o.driver_id) {
                    mappedStatus = 'assigned'
                }
            }

            // Build nested structure for frontend convenience
            return {
                id: o.id,
                code: o.code,
                tenant_id: o.tenant_id || o.company_id || companyId,
                status: mappedStatus,

                total: Number(o.total || 0),
                subtotal: Number(o.subtotal || 0),
                discount: Number(o.discount || 0),
                createdAt: o.created_at,
                accepted_at: o.accepted_at,
                channel: o.channel || 'web',
                driver: o.delivery_drivers ? {
                    id: o.delivery_drivers.id,
                    name: o.delivery_drivers.name,
                    phone: o.delivery_drivers.phone
                } : null,
                
                customer: {
                    name: o.customers?.name || o.customers?.full_name || o.customers?.nome || o.customer_name || 'Cliente',
                    phone: o.customers?.phone || o.customers?.whatsapp || o.customer_phone || '',
                    cpf: o.customers?.cpf || o.customer_cpf || ''
                },

                delivery: {
                    type: (o.order_type === 'salao' && (o.notes || '').toLowerCase().includes('comanda:'))
                        ? 'comanda'
                        : (o.order_type === 'salao' ? 'mesa' : (o.order_type || 'balcao')),
                    fee: Number(o.delivery_fee || 0),
                    address: typeof o.addresses === 'string' ? o.addresses : (o.addresses?.street || o.customer_address || ''),
                    number: o.addresses?.number || '',
                    neighborhood: o.addresses?.neighborhood || '',
                    city: o.addresses?.city || '',
                    state: o.addresses?.state || '',
                    reference: o.addresses?.reference || o.address_reference || ''
                },

                payment: {
                    method: payment?.method || o.payment_method || 'Não inf.',
                    status: payment?.status || o.payment_status || 'waiting_payment',
                    changeFor: Number(cash?.change_for || o.change_for || 0)
                },

                payments: o.payments || [],

                items: (o.order_items || []).map((i: any) => ({
                    id: i.id,
                    productId: i.product_id,
                    name: i.name || 'Produto',
                    quantity: i.quantity || 0,
                    price: i.unit_price || 0,
                    totalPrice: i.total_price || 0,
                    variation: i.variation,
                    extras: i.extras,
                    observation: i.observation
                })),

                notes: o.notes || ''
            }
        }) || []
    }

    const query = useQuery({
        queryKey: ["orders", companyId],
        queryFn: fetchOrders,
        enabled: !!companyId,
        staleTime: 1000 * 30, // 30 seconds
    })

    const updateStatusMutation = useMutation({
        mutationFn: async ({ orderId, newStatus }: { orderId: string, newStatus: string }) => {
            const { error: updateError } = await supabase
                .from('orders')
                .update({ 
                    order_status: newStatus,
                    accepted_at: newStatus === 'preparo' ? new Date().toISOString() : undefined
                })
                .eq('id', orderId)

            if (updateError) throw updateError

            if (newStatus === "pronto") {
                await criarEntregaSeNaoExistir(supabase, {
                    id: orderId,
                    empresa_id: companyId
                });
            }

            if (newStatus === "finalizado") {
                const { data: orderData, error: fetchError } = await supabase
                    .from('orders')
                    .select('id, tenant_id, total, customer_id, payment_method, channel, code, customers(name)')
                    .eq('id', orderId)
                    .single()

                if (!fetchError && orderData) {
                    const orderTotal = Number(orderData.total || 0)
                    const paymentMethod = orderData.payment_method || 'dinheiro'
                    const customerName = (orderData.customers as any)?.name || 'Cliente'
                    const channelName = orderData.channel || 'web'
                    
                    const { error: txError } = await supabase
                        .from('financial_transactions')
                        .insert({
                            tenant_id: orderData.tenant_id,
                            order_id: orderData.id,
                            customer_id: orderData.customer_id,
                            amount: orderTotal,
                            net_amount: orderTotal,
                            fee_amount: 0,
                            platform_fee_amount: 0,
                            payment_method_key: paymentMethod,
                            payment_method_name: paymentMethod.toUpperCase(),
                            status: 'succeeded',
                            transaction_type: 'sale',
                            description: `Pedido #${orderData.code || orderData.id.slice(-4).toUpperCase()} - ${customerName} - Origem: ${channelName.toUpperCase()}`
                        })
                    
                    if (txError) {
                        console.error("Erro ao registrar transação financeira:", txError)
                    }
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders", companyId] })
            toast.success("Status atualizado!")
        },
        onError: (error: any) => {
            console.error("Error updating order status:", error)
            toast.error("Erro ao atualizar status")
        }
    })

    return {
        ...query,
        updateStatus: updateStatusMutation.mutateAsync
    }
}
