import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getServerUser } from '@/lib/supabaseAuth'
import { startOfMonth, subMonths, format, endOfMonth } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const user = await getServerUser()
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        // Fetch last 6 months of data for charts
        const months = Array.from({ length: 6 }).map((_, i) => {
            const date = subMonths(new Date(), 5 - i)
            return {
                name: format(date, 'MMM'),
                start: startOfMonth(date).toISOString(),
                end: endOfMonth(date).toISOString()
            }
        })

        const financialData = await Promise.all(months.map(async (month) => {
            // Count companies created up to this month
            const { count: companiesCount } = await supabaseAdmin
                .from('companies')
                .select('*', { count: 'exact', head: true })
                .lte('created_at', month.end)

            // Calculate MRR (sum of price of active subscriptions)
            const { data: activeSubs } = await supabaseAdmin
                .from('subscriptions')
                .select('plans(price)')
                .eq('status', 'active')
                .lte('created_at', month.end)

            const mrr = activeSubs?.reduce((acc, sub: any) => acc + (sub.plans?.price || 0), 0) || 0

            return {
                name: month.name,
                mrr: mrr,
                companies: companiesCount || 0,
                revenue: mrr * 1.1 // Simulating some extra revenue for now
            }
        }))

        // Overall KPIs
        const { count: totalCompanies } = await supabaseAdmin
            .from('companies')
            .select('*', { count: 'exact', head: true })

        const { count: totalUsers } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })

        const { data: currentMRRData } = await supabaseAdmin
            .from('subscriptions')
            .select('plans(price)')
            .eq('status', 'active')

        const currentMRR = currentMRRData?.reduce((acc, sub: any) => acc + (sub.plans?.price || 0), 0) || 0

        // Churn calculation (last 30 days)
        const thirtyDaysAgo = subMonths(new Date(), 1).toISOString()
        const { count: churnedLast30 } = await supabaseAdmin
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'canceled')
            .gte('updated_at', thirtyDaysAgo)

        const churnRate = totalCompanies ? ((churnedLast30 || 0) / totalCompanies) * 100 : 0

        return NextResponse.json({
            financialData,
            kpis: {
                totalCompanies,
                totalUsers,
                currentMRR,
                churnRate: churnRate.toFixed(1)
            }
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
