import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"

export interface ProfileStats {
  receitas: number
  pedidos: number
  clientes: number
  faturamento: number
  avaliacao: number
  loading: boolean
}

export function useProfileStats() {
  const { profile } = useBusiness()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ProfileStats>({
    receitas: 0,
    pedidos: 0,
    clientes: 0,
    faturamento: 0,
    avaliacao: 4.9, // Fixed high rating for aesthetics
    loading: true
  })

  const fetchStats = useCallback(async () => {
    const tenantId = profile?.tenant_id || profile?.company_id
    if (!tenantId) return

    try {
      // Parallel fetching for performance
      const [
        { count: recipesCount },
        { count: ordersCount },
        { count: customersCount },
        { data: revenueData }
      ] = await Promise.all([
        supabase.from('receitas').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('customers').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).is('deleted_at', null),
        supabase.from('orders').select('total').eq('tenant_id', tenantId).in('status', ['delivered', 'finalizado'])
      ])

      const totalRevenue = revenueData?.reduce((acc, order) => acc + (Number(order.total) || 0), 0) || 0

      setStats({
        receitas: recipesCount || 0,
        pedidos: ordersCount || 0,
        clientes: customersCount || 0,
        faturamento: totalRevenue,
        avaliacao: 4.9,
        loading: false
      })
    } catch (error) {
      console.error("Error fetching profile stats:", error)
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    const tenantId = profile?.tenant_id || profile?.company_id
    if (tenantId) {
      fetchStats()

      // Real-time subscriptions
      const tables = ['receitas', 'orders', 'customers']
      const channels = tables.map(table => 
        supabase
          .channel(`profile-stats-${table}-${tenantId}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table, filter: `tenant_id=eq.${tenantId}` },
            () => fetchStats()
          )
          .subscribe()
      )

      return () => {
        channels.forEach(channel => supabase.removeChannel(channel))
      }
    }
  }, [profile, fetchStats])

  return { ...stats, refresh: fetchStats }
}
