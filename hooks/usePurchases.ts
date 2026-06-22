import { supabase } from "@/lib/supabase"
import { useQuery } from "@tanstack/react-query"

export function usePurchases(tenantId: string | undefined) {
    return useQuery({
        queryKey: ["purchases", tenantId],
        queryFn: async () => {
            if (!tenantId) return []

            // We removed the join with profiles(full_name) as it represents a broken relationship
            // and uses an incorrect column name (should be owner_name).
            // For now, we fetch purchases directly to fix the dashboard crash.
            const { data, error } = await supabase
                .from('compras')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('data_compra', { ascending: false })

            if (error) {
                console.error("Purchases fetch error:", error)
                throw error
            }

            return data || []
        },
        enabled: !!tenantId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}
