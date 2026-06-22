import { supabase } from "@/lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export function useSales(tenantId: string | undefined) {
    const queryClient = useQueryClient()

    const query = useQuery({
        queryKey: ["sales", tenantId],
        queryFn: async () => {
            if (!tenantId) return []
            const { data, error } = await supabase
                .from('vendas')
                .select('*, receitas(nome)')
                .eq('tenant_id', tenantId)
                .order('data_venda', { ascending: false })

            if (error) throw error
            return data || []
        },
        enabled: !!tenantId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    const refresh = () => queryClient.invalidateQueries({ queryKey: ["sales", tenantId] })

    return { ...query, refresh }
}
