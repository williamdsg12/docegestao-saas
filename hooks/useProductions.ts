import { supabase } from "@/lib/supabase"
import { useQuery } from "@tanstack/react-query"

export function useProductions(tenantId: string | undefined) {
    return useQuery({
        queryKey: ["productions", tenantId],
        queryFn: async () => {
            if (!tenantId) return []
            const { data, error } = await supabase
                .from('producoes')
                .select('*, receitas(nome, image_url)')
                .eq('tenant_id', tenantId)
                .order('data_producao', { ascending: false })

            if (error) throw error
            return data || []
        },
        enabled: !!tenantId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}
