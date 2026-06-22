import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getServerUser, isSuperAdmin } from '@/lib/supabaseAuth'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getServerUser()
        if (!isSuperAdmin(user)) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        const { id } = await params

        // 1. Basic Company Info
        const { data: empresa, error: empresaError } = await supabaseAdmin
            .from('empresas')
            .select('*')
            .eq('id', id)
            .single()

        if (empresaError) throw empresaError

        // 1.1 Fetch Profile mapping explicitly
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', empresa.owner_id)
            .maybeSingle()
        
        // Merge profile into empresa for frontend compatibility
        const empresaWithProfile = { ...empresa, profiles: profile }

        // 2. Subscription Info
        const { data: subscription } = await supabaseAdmin
            .from('subscriptions')
            .select('*, plans!plan_id(*)')
            .eq('company_id', id)
            .maybeSingle()

        // 3. Usage Counts
        const { count: productsCount } = await supabaseAdmin
            .from('produtos')
            .select('*', { count: 'exact', head: true })
            .eq('empresa_id', id)

        const { count: ordersCount } = await supabaseAdmin
            .from('pedidos')
            .select('*', { count: 'exact', head: true })
            .eq('empresa_id', id)

        // 4. Latest Orders
        const { data: latestOrders } = await supabaseAdmin
            .from('pedidos')
            .select('*')
            .eq('empresa_id', id)
            .order('created_at', { ascending: false })
            .limit(10)

        return NextResponse.json({
            empresa: empresaWithProfile,
            subscription,
            metrics: {
                products: productsCount || 0,
                orders: ordersCount || 0
            },
            latestOrders: latestOrders || []
        })

    } catch (error: any) {
        console.error('Critical Error [Admin Company Detail]:', error.message)
        return NextResponse.json({ 
            error: 'Erro ao carregar detalhes da empresa',
            details: error.message 
        }, { status: 500 })
    }
}
