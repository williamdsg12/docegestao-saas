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
                customers!customer_id(nome, telefone),
                addresses(rua, numero, bairro, cidade, cep),
                order_items(*)
            `)
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(100) // Initial sanity limit for performance

        if (error) throw error
        
        return data?.map((o: any) => ({
            id: o.id,
            customer_name: o.customers?.nome || 'Cliente',
            customer_phone: o.customers?.telefone || '',
            customer_address: o.addresses ? `${o.addresses.rua}, ${o.addresses.numero} - ${o.addresses.bairro}` : 'Retirada',
            customer_cep: o.addresses?.cep || '',
            delivery_fee: o.delivery_fee || 0,
            total: o.total || 0,
            payment_method: o.payment_method || 'Não inf.',
            payment_status: o.payment_status || 'waiting_payment',
            status: o.status || 'novo',
            notes: o.notes || '',
            created_at: o.created_at,
            order_items: (o.order_items || []).map((i: any) => ({
                id: i.id,
                product_name: i.product_name || 'Produto',
                quantity: i.quantidade || 0,
                price: i.preco || 0
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
                .update({ status: newStatus })
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
