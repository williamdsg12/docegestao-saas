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

        // 1. Total de Empresas (empresas)
        const { count: totalCompanies, error: err1 } = await supabaseAdmin
            .from('empresas')
            .select('*', { count: 'exact', head: true })
        if (err1) console.error('Supabase Error [empresas]:', err1.message, err1.details)

        // 2. Empresas Ativas
        const { count: activeCompanies, error: err2 } = await supabaseAdmin
            .from('empresas')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')
        if (err2) console.error('Supabase Error [active_empresas]:', err2.message, err2.details)

        // 3. Usuários Totais (profiles)
        const { count: totalUsers, error: err3 } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })
        if (err3) console.error('Supabase Error [profiles]:', err3.message, err3.details)

        // 4. Receita Total (payments)
        const { data: paymentsData, error: err4 } = await supabaseAdmin
            .from('payments')
            .select('amount')
            .eq('status', 'paid')
        if (err4) console.error('Supabase Error [payments]:', err4.message, err4.details)

        const totalRevenue = paymentsData?.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0) || 0
        
        // 5. Pedidos (pedidos)
        const { count: totalOrdersPlatform, error: err5 } = await supabaseAdmin
            .from('pedidos')
            .select('*', { count: 'exact', head: true })
        if (err5) console.error('Supabase Error [pedidos]:', err5.message, err5.details)

        const today = new Date()
        today.setHours(0,0,0,0)
        const { count: ordersToday, error: err6 } = await supabaseAdmin
            .from('pedidos')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString())
        if (err6) console.error('Supabase Error [pedidos_today]:', err6.message, err6.details)

        // 6. Assinaturas (subscriptions)
        const { count: activeSubscriptions, error: err7 } = await supabaseAdmin
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')
        if (err7) console.error('Supabase Error [subscriptions]:', err7.message, err7.details)

        // 7. Tabelas Recentes (Enriquecidas com Planos e Empresas de forma segura)
        const { data: latestProfiles } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)

        const { data: latestCompanies } = await supabaseAdmin
            .from('empresas')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)

        // Buscar assinaturas para estas entidades
        const recentUserIds = latestProfiles?.map(p => p.id) || []
        const recentCompanyIds = latestCompanies?.map(c => c.id) || []

        const { data: recentSubs } = await supabaseAdmin
            .from('subscriptions')
            .select('user_id, company_id, plans!plan_id(name)')
            .or(`user_id.in.(${recentUserIds.join(',')}),company_id.in.(${recentCompanyIds.join(',')})`)
            .eq('status', 'active')

        // Mapeamento de planos
        const userPlanMap = new Map()
        const companyPlanMap = new Map()
        recentSubs?.forEach((s: any) => {
            const planName = Array.isArray(s.plans) ? s.plans[0]?.name : s.plans?.name
            if (s.user_id) userPlanMap.set(s.user_id, planName)
            if (s.company_id) companyPlanMap.set(s.company_id, planName)
        })

        const enrichedUsers = latestProfiles?.map(p => ({
            ...p,
            plan: userPlanMap.get(p.id) || 'Free'
        })) || []

        const enrichedCompanies = latestCompanies?.map(c => ({
            ...c,
            plan: companyPlanMap.get(c.id) || 'Free'
        })) || []

        const { data: latestOrdersRaw } = await supabaseAdmin
            .from('pedidos')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)

        const { data: latestPaymentsRaw } = await supabaseAdmin
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)

        // Buscar nomes das empresas para as ordens recentes
        const orderCompanyIds = [...new Set([
            ...(latestOrdersRaw?.map(o => o.empresa_id) || []),
            ...(latestPaymentsRaw?.map(p => p.empresa_id) || [])
        ])].filter(Boolean)

        const { data: companyNames } = await supabaseAdmin
            .from('empresas')
            .select('id, name')
            .in('id', orderCompanyIds)

        const companyNameMap = new Map()
        companyNames?.forEach(c => companyNameMap.set(c.id, c.name))

        const enrichedOrders = latestOrdersRaw?.map(o => ({
            ...o,
            empresas: { name: companyNameMap.get(o.empresa_id) || 'Desconhecida' }
        })) || []

        const enrichedPayments = latestPaymentsRaw?.map(p => ({
            ...p,
            pedidos: { 
                empresas: { name: companyNameMap.get(p.empresa_id) || 'Desconhecida' } 
            }
        })) || []

        // 8. Dados p/ Gráficos (30 dias)
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
            .from('pedidos')
            .select('created_at')
            .gte('created_at', thirtyDaysAgoISO)

        // 9. Métricas SaaS
        const mrr = totalRevenue // Simplificação
        const arr = mrr * 12
        const conversionRate = totalCompanies && totalCompanies > 0 
            ? ((activeSubscriptions || 0) / (totalCompanies)) * 100 
            : 0

        // 10. Distribuição de Planos
        const { data: planStats } = await supabaseAdmin
            .from('subscriptions')
            .select('plan_id, plans!plan_id(name)')
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
            new_users_today: 0,
            new_users_month: 0,
            total_orders: totalOrdersPlatform || 0,
            orders_today: ordersToday || 0,
            active_subscriptions: activeSubscriptions || 0,
            trial_subscriptions: 0,
            canceled_month: 0,
            open_tickets: 0,
            latest_users: enrichedUsers,
            latest_companies: enrichedCompanies,
            latest_orders: enrichedOrders,
            latest_payments: enrichedPayments,
            plan_distribution: planDistribution,
            chart_data: {
                users: dailyUsers || [],
                payments: dailyPayments || [],
                orders: dailyOrders || []
            }
        })

    } catch (error: any) {
        console.error('Critical Error in Admin Dashboard API:', error.message, error.details)
        return NextResponse.json({ 
            error: error.message,
            details: error.details,
            hint: error.hint
        }, { status: 500 })
    }
}
