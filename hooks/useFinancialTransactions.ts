import { supabase } from "@/lib/supabase"
import { useQuery } from "@tanstack/react-query"

export function useFinancialTransactions(tenantId: string | undefined) {
    return useQuery({
        queryKey: ["financial-transactions", tenantId],
        queryFn: async () => {
            if (!tenantId) return { transactions: [], stats: { disponivel: 0, pendente: 0, total_recebido: 0, total_sacado: 0 } }
            
            const { data, error } = await supabase
                .from('financial_transactions')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false })
                .limit(200)

            if (error) throw error

            const transactions = data || []
            const stats = {
                disponivel: transactions.filter(t => t.status === 'succeeded').reduce((acc, t) => acc + Number(t.net_amount), 0),
                pendente: transactions.filter(t => t.status === 'pending').reduce((acc, t) => acc + Number(t.net_amount), 0),
                total_recebido: transactions.filter(t => t.transaction_type === 'sale').reduce((acc, t) => acc + Number(t.amount), 0),
                total_sacado: transactions.filter(t => t.transaction_type === 'payout').reduce((acc, t) => acc + Number(t.amount), 0)
            }

            return { transactions, stats }
        },
        enabled: !!tenantId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}
