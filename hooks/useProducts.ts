import { supabase } from "@/lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export interface Product {
  id: string
  name: string
  category: string
  price: number
  active: boolean
  image_url?: string
  description?: string
  preparation_time?: number
  order_position?: number
  ai_score?: number
  ai_optimized?: boolean
  marketing_data?: any
  original_data?: any
  tenant_id: string
}

export function useProducts(tenantId: string | undefined) {
    const queryClient = useQueryClient()

    const query = useQuery({
        queryKey: ["products", tenantId],
        queryFn: async () => {
            if (!tenantId) return []
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('order_position', { ascending: true })

            if (error) throw error
            return data as Product[] || []
        },
        enabled: !!tenantId,
        staleTime: 1000 * 60 * 10, // 10 minutes
    })

    const toggleStatus = useMutation({
        mutationFn: async ({ id, active }: { id: string, active: boolean }) => {
            const { error } = await supabase.from('products').update({ active }).eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products", tenantId] })
        }
    })

    const deleteProduct = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('products').delete().eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products", tenantId] })
        }
    })

    return { ...query, toggleStatus, deleteProduct }
}
