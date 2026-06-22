"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { useDashboardStats } from "@/hooks/useDashboardStats"

export function useSalesMachine() {
    const { profile } = useBusiness()
    const { pedidos } = useDashboardStats()
    const [leads, setLeads] = useState<any[]>([])
    const [stats, setStats] = useState({
        totalLeads: 0,
        conversions: 0,
        conversionRate: 0,
        recoveredAmount: 0
    })
    const [loading, setLoading] = useState(true)

    const tenantId = profile?.tenant_id || profile?.company_id

    const fetchSalesData = useCallback(async () => {
        if (!tenantId) return

        try {
            // 1. Fetch Leads
            const { data: leadsData } = await supabase
                .from('leads')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false })

            if (leadsData) setLeads(leadsData)

            // 2. Calculate Metrics
            const totalLeads = leadsData?.length || 0
            const conversions = leadsData?.filter(l => l.status === 'cliente').length || 0
            const conversionRate = totalLeads > 0 ? (conversions / totalLeads) * 100 : 0

            // Calculate recovered amount (simulation based on finalizados that were recovered)
            const recovered = (pedidos || [])
                .filter((p: any) => p.status === 'finalizado')
                .reduce((acc, p) => acc + (p.total || 0), 0)

            setStats({
                totalLeads,
                conversions,
                conversionRate,
                recoveredAmount: recovered * 0.15 // Simulated 15% recovery
            })
        } catch (e) {
            console.error("Error fetching sales machine data:", e)
        } finally {
            setLoading(false)
        }
    }, [tenantId, pedidos])

    const registerLead = async (phone: string, name?: string) => {
        if (!tenantId) return
        const { data, error } = await supabase.from('leads').insert({
            tenant_id: tenantId,
            phone,
            name,
            status: 'novo'
        }).select().single()

        if (!error && data) {
            fetchSalesData()
            return data.id
        }
        return null
    }

    const confirmPayment = async (orderId: string) => {
        const { error } = await supabase.from('orders').update({
            payment_status: 'pago',
            payment_confirmed_at: new Date().toISOString()
        }).eq('id', orderId)

        if (!error) {
            fetchSalesData()
            return true
        }
        return false
    }

    useEffect(() => {
        if (tenantId) {
            fetchSalesData()
        }
    }, [tenantId, fetchSalesData])

    return {
        leads,
        stats,
        loading,
        registerLead,
        confirmPayment,
        refreshSales: fetchSalesData
    }
}
