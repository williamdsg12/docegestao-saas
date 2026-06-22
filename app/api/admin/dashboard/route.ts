import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getServerUser, isSuperAdmin } from '@/lib/supabaseAuth'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const user = await getServerUser()
        if (!isSuperAdmin(user)) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        // 1. Total Metrics
        const { count: totalCompanies } = await supabaseAdmin
            .from('empresas')
            .select('*', { count: 'exact', head: true })

        const { count: activeCompanies } = await supabaseAdmin
            .from('empresas')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')

        // 2. Daily Metrics
        const today = new Date()
        today.setHours(0,0,0,0)
        
        const { count: newToday } = await supabaseAdmin
            .from('empresas')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString())

        // 3. Subscriptions & MRR
        const { data: activeSubs } = await supabaseAdmin
            .from('subscriptions')
            .select('plans!plan_id(price)')
            .eq('status', 'active')

        const mrr = activeSubs?.reduce((acc, sub: any) => acc + (sub.plans?.price || 0), 0) || 0

        // 4. Churn (Canceled in last 30 days)
        const lastMonth = new Date()
        lastMonth.setDate(lastMonth.getDate() - 30)
        const { count: churnCount } = await supabaseAdmin
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'canceled')
            .gte('updated_at', lastMonth.toISOString())

        // 5. Total Orders Generated
        const { count: totalOrders } = await supabaseAdmin
            .from('pedidos')
            .select('*', { count: 'exact', head: true })

        // 6. Latest Companies (New Signups)
        const { data: latestCompanies } = await supabaseAdmin
            .from('empresas')
            .select(`
                id,
                name,
                created_at,
                owner_id
            `)
            .order('created_at', { ascending: false })
            .limit(5)

        // 7. Latest Payments
        let latestPayments = []
        try {
            const { data: payments, error: paymentsError } = await supabaseAdmin
                .from('payments')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5)
            
            if (!paymentsError) {
                latestPayments = payments || []
            }
        } catch (e) {
            console.warn("Table 'payments' might not exist yet")
        }

        // 8. Real Chart Data (Last 7 Days Revenue)
        const revenueChart = []
        for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setHours(0,0,0,0)
            d.setDate(d.getDate() - i)
            const nextDay = new Date(d)
            nextDay.setDate(d.getDate() + 1)

            const { data: daySubs } = await supabaseAdmin
                .from('subscriptions')
                .select('plans!plan_id(price)')
                .eq('status', 'active')
                .lte('created_at', nextDay.toISOString())
            
            const dayRev = daySubs?.reduce((acc, s: any) => acc + (s.plans?.price || 0), 0) || 0
            const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
            revenueChart.push({
                name: dayNames[d.getDay()],
                value: Math.floor(dayRev / 30) // Daily equivalent
            })
        }

        // 9. Real Chart Data (Last 5 Months Growth)
        const growthChart = []
        for (let i = 4; i >= 0; i--) {
            const d = new Date()
            d.setHours(0,0,0,0)
            d.setDate(1)
            d.setMonth(d.getMonth() - i)
            const nextMonth = new Date(d)
            nextMonth.setMonth(d.getMonth() + 1)

            const { count: monthTotal } = await supabaseAdmin
                .from('empresas')
                .select('*', { count: 'exact', head: true })
                .lte('created_at', nextMonth.toISOString())
            
            const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
            growthChart.push({
                name: monthNames[d.getMonth()],
                value: monthTotal || 0
            })
        }

        return NextResponse.json({
            total_companies: totalCompanies || 0,
            active_companies: activeCompanies || 0,
            inactive_companies: (totalCompanies || 0) - (activeCompanies || 0),
            new_today: newToday || 0,
            churn_last_month: churnCount || 0,
            mrr: mrr,
            arr: mrr * 12,
            total_orders: totalOrders || 0,
            latest_companies: latestCompanies || [],
            latest_payments: latestPayments,
            chart_data: {
                revenue: revenueChart,
                growth: growthChart
            }
        })

    } catch (error: any) {
        console.error('Critical Error [Admin Dashboard]:', error.message)
        return NextResponse.json({ 
            error: 'Erro ao carregar métricas do dashboard',
            details: error.message 
        }, { status: 500 })
    }
}
