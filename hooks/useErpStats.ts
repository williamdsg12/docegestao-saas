import { supabase } from "@/lib/supabase"
import { useQuery } from "@tanstack/react-query"

export function useErpStats(tenantId: string | undefined) {
    return useQuery({
        queryKey: ["erp-stats", tenantId],
        queryFn: async () => {
            if (!tenantId) return null

            // 1. Valor em Estoque
            const { data: ingredients } = await supabase
                .from('ingredientes')
                .select('estoque_atual, custo_medio, estoque_minimo')
                .eq('tenant_id', tenantId)
            
            const valorTotal = ingredients?.reduce((acc, i) => acc + (Number(i.estoque_atual) * Number(i.custo_medio || 0)), 0) || 0
            const baixos = ingredients?.filter(i => i.estoque_atual <= i.estoque_minimo).length || 0

            // 2. Lucro Real e Vendas do Mês
            const startOfMonth = new Date()
            startOfMonth.setDate(1)
            startOfMonth.setHours(0,0,0,0)

            const { data: vendasExt } = await supabase
                .from('vendas')
                .select('lucro_total, valor_total')
                .eq('tenant_id', tenantId)
                .gte('data_venda', startOfMonth.toISOString())
            
            const lucroTotal = vendasExt?.reduce((acc, v) => acc + Number(v.lucro_total), 0) || 0

            // 3. Produção do Mês
            const { count: prodCount } = await supabase
                .from('producoes')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .gte('data_producao', startOfMonth.toISOString())

            return {
                valorEstoque: valorTotal,
                itensBaixos: baixos,
                lucroReal: lucroTotal,
                producaoMes: prodCount || 0
            }
        },
        enabled: !!tenantId,
        staleTime: 1000 * 60 * 10, // 10 minutes cache for ERP stats (less volatile than orders)
    })
}
