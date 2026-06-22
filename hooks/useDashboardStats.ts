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
        const startOfYear = new Date(hoje.getFullYear(), 0, 1)
        const sixtyDaysAgo = new Date()
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
        const queryStartDate = startOfYear < sixtyDaysAgo ? startOfYear : sixtyDaysAgo
        queryStartDate.setHours(0, 0, 0, 0)

        // 1. Fetch Orders from last 60 days or since start of year
        const { data: rawOrders, error: orderError } = await supabase
            .from("orders")
            .select(`
                id, 
                total, 
                valor_total, 
                status, 
                order_status, 
                payment_status,
                paid,
                created_at, 
                customer_id,
                customers(name),
                order_items(id, name, quantity, unit_price)
            `)
            .eq('tenant_id', tenantId)
            .gte("created_at", queryStartDate.toISOString())

        if (orderError) throw orderError

        // 2. Fetch Menu Views from queryStartDate
        const { data: rawViews, error: viewsError } = await supabase
            .from("menu_views")
            .select("id, created_at")
            .eq('tenant_id', tenantId)
            .gte("created_at", queryStartDate.toISOString())

        if (viewsError) throw viewsError

        // 3. Fetch Abandoned Carts from queryStartDate
        const { data: rawCarts, error: cartsError } = await supabase
            .from("abandoned_carts")
            .select("id, created_at, total")
            .eq('tenant_id', tenantId)
            .gte("created_at", queryStartDate.toISOString())

        if (cartsError) throw cartsError

        // 4. Fetch unique customer count for tenant
        const { count: customerCount, error: customerError } = await supabase
            .from("customers")
            .select("*", { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .is('deleted_at', null)

        if (customerError) throw customerError

        const orders = (rawOrders || []).map(o => ({
            ...o,
            total: Number(o.total || o.valor_total || 0),
            status: o.order_status || o.status || 'pending'
        }))

        // Helper to check if an order is paid and not cancelled
        const isPaidOrder = (o: any) => 
            (o.payment_status === 'paid' || o.payment_status === 'pago' || o.paid === true || o.status === 'delivered' || o.status === 'finalizado') && 
            (o.status !== 'cancelled' && o.status !== 'cancelado')

        const sales = orders.filter(isPaidOrder)
        const ativos = orders.filter(o => !['finalizado', 'cancelado', 'arquivado', 'pendente_pagamento', 'delivered'].includes(o.status)).length

        // Monthly statistics (backwards compatibility)
        const hojeSales = sales.filter(o => new Date(o.created_at) >= hoje)
        const totalHoje = hojeSales.reduce((acc, p) => acc + p.total, 0)
        
        const mesSales = sales.filter(o => new Date(o.created_at) >= inicioMes)
        const totalMes = mesSales.reduce((acc, p) => acc + p.total, 0)
        const ticketMedio = mesSales.length > 0 ? totalMes / mesSales.length : 0

        // Calculate Star Products (Top 3 based on 60 days)
        const productStats: Record<string, { name: string, sales: number, revenue: number }> = {}
        orders.forEach(o => {
            (o.order_items || []).forEach((item: any) => {
                if (!productStats[item.name]) {
                    productStats[item.name] = { name: item.name, sales: 0, revenue: 0 }
                }
                productStats[item.name].sales += item.quantity || 1
                productStats[item.name].revenue += (item.quantity || 1) * (item.unit_price || 0)
            })
        })

        const topProducts = Object.values(productStats)
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 3)
            .map((p, i) => ({
                ...p,
                rank: i + 1,
                margin: '---'
            }))

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
            totalClientes: customerCount || 0,
            topProducts,
            pedidos: orders,
            menuViews: rawViews || [],
            abandonedCarts: rawCarts || []
        }
    }

    const { data, isLoading: loading, error } = useQuery({
        queryKey: ["dashboard-stats", tenantId],
        queryFn: fetchStats,
        enabled: !!tenantId,
        refetchOnWindowFocus: true,
        staleTime: 1000 * 30, // 30 seconds stale
        refetchInterval: 1000 * 30, // Polling fallback: every 30 seconds
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
            .on(
                "postgres_changes",
                { 
                    event: "*", 
                    schema: "public", 
                    table: "menu_views",
                    filter: `tenant_id=eq.${tenantId}`
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["dashboard-stats", tenantId] })
                }
            )
            .on(
                "postgres_changes",
                { 
                    event: "*", 
                    schema: "public", 
                    table: "abandoned_carts",
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
        totalClientes: data?.totalClientes || 0,
        topProducts: data?.topProducts || [],
        pedidos: data?.pedidos || [],
        menuViews: data?.menuViews || [],
        abandonedCarts: data?.abandonedCarts || [],
        loading,
        refresh: () => queryClient.invalidateQueries({ queryKey: ["dashboard-stats", tenantId] })
    }
}

