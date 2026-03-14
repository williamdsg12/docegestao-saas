import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getServerUser } from '@/lib/supabaseAuth'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const user = await getServerUser()
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('is_admin, role')
            .eq('id', user.id)
            .single()

        if (!profile?.is_admin && profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        // 2. Buscar métricas reais via Supabase Admin (IGNORANDO RLS)
        
        // Total empresas
        const { count: totalCompanies } = await supabaseAdmin
            .from('companies')
            .select('*', { count: 'exact', head: true })

        // Empresas ativas
        const { count: activeCompanies } = await supabaseAdmin
            .from('companies')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')

        // Total usuários
        const { count: totalUsers } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })

        // 3. Receita e MRR
        const { data: totalRevenueData } = await supabaseAdmin
            .from('payments')
            .select('amount')
            .eq('status', 'paid')
        
        const totalRevenue = totalRevenueData?.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0) || 0

        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const firstDayOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        
        const { data: monthlyRevenueData } = await supabaseAdmin
            .from('payments')
            .select('amount')
            .eq('status', 'paid')
            .gte('created_at', firstDayOfMonth)

        const mrr = monthlyRevenueData?.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0) || 0

        // 4. Novos Cadastros (Hoje e Mês)
        const { count: newUsersToday } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', firstDayOfToday)

        const { count: newUsersMonth } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', firstDayOfMonth)

        // 5. Pedidos Totais da Plataforma
        const { count: totalOrdersPlatform } = await supabaseAdmin
            .from('orders')
            .select('*', { count: 'exact', head: true })

        const { count: ordersToday } = await supabaseAdmin
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', firstDayOfToday)

        // 6. Assinaturas e Trials
        const { count: activeSubscriptions } = await supabaseAdmin
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')

        const { count: trialSubscriptions } = await supabaseAdmin
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'trial')

        const { count: canceledThisMonth } = await supabaseAdmin
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'canceled')
            .gte('updated_at', firstDayOfMonth)

        // 7. Tabelas Recentes
        const { data: latestProfiles } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)

        const { data: latestCompanies } = await supabaseAdmin
            .from('companies')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)

        const { data: latestOrders } = await supabaseAdmin
            .from('orders')
            .select('*, companies(name)')
            .order('created_at', { ascending: false })
            .limit(10)

        const { data: latestPayments } = await supabaseAdmin
            .from('payments')
            .select('*, companies(name)')
            .order('created_at', { ascending: false })
            .limit(10)

        // 8. Dados p/ Gráficos (Últimos 30 dias)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()

        const { data: dailyUsers } = await supabaseAdmin
            .from('profiles')
            .select('created_at')
            .gte('created_at', thirtyDaysAgoISO)
        
        const { data: dailyPayments } = await supabaseAdmin
            .from('payments')
            .select('created_at, amount')
            .eq('status', 'paid')
            .gte('created_at', thirtyDaysAgoISO)

        const { data: dailyOrders } = await supabaseAdmin
            .from('orders')
            .select('created_at')
            .gte('created_at', thirtyDaysAgoISO)

        // 9. SaaS Metrics (ARR, Conversion, Churn)
        const arr = mrr * 12
        const conversionRate = totalCompanies && totalCompanies > 0 
            ? ((activeSubscriptions || 0) / (totalCompanies)) * 100 
            : 0

        // 10. Distribuição de Planos
        const { data: planStats } = await supabaseAdmin
            .from('subscriptions')
            .select('plan_id, plans(name)')
            .eq('status', 'active')
        
        const planDistribution: Record<string, number> = {}
        planStats?.forEach((sub: any) => {
            const name = sub.plans?.name || 'Outro'
            planDistribution[name] = (planDistribution[name] || 0) + 1
        })

        return NextResponse.json({
            total_companies: totalCompanies || 0,
            active_companies: activeCompanies || 0,
            total_users: totalUsers || 0,
            total_revenue: totalRevenue,
            mrr: mrr,
            arr: arr,
            conversion_rate: parseFloat(conversionRate.toFixed(2)),
            new_users_today: newUsersToday || 0,
            new_users_month: newUsersMonth || 0,
            total_orders: totalOrdersPlatform || 0,
            orders_today: ordersToday || 0,
            active_subscriptions: activeSubscriptions || 0,
            trial_subscriptions: trialSubscriptions || 0,
            canceled_month: canceledThisMonth || 0,
            open_tickets: 0,
            latest_users: latestProfiles || [],
            latest_companies: latestCompanies || [],
            latest_orders: latestOrders || [],
            latest_payments: latestPayments || [],
            plan_distribution: planDistribution,
            chart_data: {
                users: dailyUsers || [],
                payments: dailyPayments || [],
                orders: dailyOrders || []
            }
        })

    } catch (error: any) {
        console.error('Error in Admin Dashboard API:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
