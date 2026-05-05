import { supabase } from "@/lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { criarEntregaSeNaoExistir } from "@/lib/services/delivery"

export function useOrders(companyId: string | undefined) {
    const queryClient = useQueryClient()

    const fetchOrders = async () => {
        if (!companyId) return []

        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                customers!customer_id(name, phone),
                order_items(*)
            `)
            .eq('tenant_id', companyId)
            .order('created_at', { ascending: false })
            .limit(100)

        if (error) {
            console.error("❌ [useOrders] Error fetching orders:", error)
            throw error
        }

        return data?.map((o: any) => ({
            ...o,
            id: o.id,
            customer_name: o.customers?.name || 'Cliente',
            customer_phone: o.customers?.phone || '',
            address: o.address || 'Retirada',
            customer_cep: '',
            delivery_fee: Number(o.delivery_fee || 0),
            total: Number(o.total || 0),
            payment_method: o.payment_method || 'Não inf.',
            payment_status: o.payment_status || 'waiting_payment',
            status: o.order_status || 'novo',
            order_type: o.order_type || 'balcao',
            notes: o.notes || '',
            created_at: o.created_at,
            items: (o.order_items || []).map((i: any) => ({
                id: i.id,
                name: i.name || 'Produto',
                quantity: i.quantity || 0,
                price: i.unit_price || 0,
                variation: i.variation,
                extras: i.extras,
                observation: i.observation
            }))
        })) || []
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
                .update({ order_status: newStatus })
                .eq('id', orderId)

            if (updateError) throw updateError

            if (newStatus === "pronto") {
                await criarEntregaSeNaoExistir(supabase, {
                    id: orderId,
                    empresa_id: companyId
                });
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
