import { useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { useQuery, useQueryClient } from "@tanstack/react-query"

export function useDashboardStats() {
    const { profile } = useBusiness()
    const queryClient = useQueryClient()
    const tenantId = profile?.tenant_id || profile?.company_id

    const fetchStats = async () => {
        if (!tenantId) return null

        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

        // Optimized query: Select only needed columns
        const { data: rawOrders, error } = await supabase
            .from("orders")
            .select("id, total, valor_total, status, created_at, customers(name)")
            .eq('tenant_id', tenantId)
            .gte("created_at", inicioMes.toISOString())

        if (error) throw error

        const orders = (rawOrders || []).map(o => ({
            ...o,
            total: Number(o.total || o.valor_total || 0)
        }))

        const sales = orders.filter(o => o.status === 'delivered' || o.status === 'finalizado')
        const ativos = orders.filter(o => !['finalizado', 'cancelado', 'arquivado', 'pendente_pagamento', 'delivered'].includes(o.status)).length

        const hojeSales = sales.filter(o => new Date(o.created_at) >= hoje)
        const totalHoje = hojeSales.reduce((acc, p) => acc + p.total, 0)
        const totalMes = sales.reduce((acc, p) => acc + p.total, 0)
        const ticketMedio = sales.length > 0 ? totalMes / sales.length : 0

        const diasPassados = hoje.getDate()
        const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()
        const mediaDiaria = totalMes / (diasPassados || 1)
        const receitaEstimada = mediaDiaria * diasNoMes

        return {
            totalHoje,
            totalMes,
            pedidosAtivos: ativos,
            ticketMedio,
            receitaEstimada,
            pedidos: orders
        }
    }

    const { data, isLoading: loading, error } = useQuery({
        queryKey: ["dashboard-stats", tenantId],
        queryFn: fetchStats,
        enabled: !!tenantId,
        refetchOnWindowFocus: true,
        staleTime: 1000 * 60 * 3, // 3 minutes stale
    })

    useEffect(() => {
        if (!tenantId) return

        const channel = supabase
            .channel(`dashboard-stats-live-${tenantId}`)
            .on(
                "postgres_changes",
                { 
                    event: "*", 
                    schema: "public", 
                    table: "orders",
                    filter: `tenant_id=eq.${tenantId}`
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["dashboard-stats", tenantId] })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [tenantId, queryClient])

    return {
        totalHoje: data?.totalHoje || 0,
        totalMes: data?.totalMes || 0,
        pedidosAtivos: data?.pedidosAtivos || 0,
        ticketMedio: data?.ticketMedio || 0,
        receitaEstimada: data?.receitaEstimada || 0,
        pedidos: data?.pedidos || [],
        loading,
        refresh: () => queryClient.invalidateQueries({ queryKey: ["dashboard-stats", tenantId] })
    }
}
