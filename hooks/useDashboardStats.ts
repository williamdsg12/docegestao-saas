import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"

export function useDashboardStats() {
    const { profile } = useBusiness()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalHoje: 0,
        totalMes: 0,
        pedidosAtivos: 0,
        ticketMedio: 0,
        receitaEstimada: 0,
        pedidos: [] as any[]
    })

    async function fetchStats() {
        const tenantId = profile?.tenant_id || profile?.company_id
        if (!tenantId) return

        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

        try {
            // Use 'orders' table and filter strictly for completed sales as requested
            const { data: rawOrders, error } = await supabase
                .from("orders")
                .select("*")
                .eq('tenant_id', tenantId)
                .gte("created_at", inicioMes.toISOString())

            if (error) throw error

            // 1. Convert possible string values to numbers defensively
            const orders = (rawOrders || []).map(o => ({
                ...o,
                total: Number(o.total || o.valor_total || 0)
            }))

            // 2. Filter for sales (only delivered or finalizado)
            const sales = orders.filter(o => o.status === 'delivered' || o.status === 'finalizado')

            // 3. Filter for active monitoring counts
            const ativos = orders.filter(o => !['finalizado', 'cancelado', 'arquivado', 'pendente_pagamento', 'delivered'].includes(o.status)).length

            const hojeSales = sales.filter(o => new Date(o.created_at) >= hoje)
            const mesSales = sales

            const totalHoje = hojeSales.reduce((acc, p) => acc + p.total, 0)
            const totalMes = mesSales.reduce((acc, p) => acc + p.total, 0)

            const ticketMedio = mesSales.length > 0 ? totalMes / mesSales.length : 0

            // Receita Estimada projection
            const diasPassados = hoje.getDate()
            const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()
            const mediaDiaria = totalMes / (diasPassados || 1)
            const receitaEstimada = mediaDiaria * diasNoMes

            setStats({
                totalHoje,
                totalMes,
                pedidosAtivos: ativos,
                ticketMedio,
                receitaEstimada,
                pedidos: orders // Returning all for charts/recent logs
            })
        } catch (e) {
            console.error("Error fetching stats:", e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!profile) return
        fetchStats()

        const channel = supabase
            .channel("dashboard-stats-live")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "orders" },
                () => fetchStats()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [profile])

    return { ...stats, loading, refresh: fetchStats }
}
