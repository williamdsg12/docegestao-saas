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

        // 1. Buscar empresas 
        const { data: empresas, error: empresaError } = await supabaseAdmin
            .from('empresas')
            .select(`
                id,
                name,
                email,
                telefone,
                whatsapp,
                status,
                created_at,
                owner_id
            `)
            .order('created_at', { ascending: false })

        if (empresaError) throw empresaError

        // 2. Buscar as assinaturas para vincular o plano
        const { data: subscriptions } = await supabaseAdmin
            .from('subscriptions')
            .select('company_id, plans!plan_id(name)')
            .eq('status', 'active')

        // 3. Buscar os perfis (owners) para vincular manualmente
        const ownerIds = empresas.map(e => e.owner_id).filter(Boolean)
        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, owner_name, email')
            .in('id', ownerIds)

        // 4. Mapear dados
        const planMap = new Map()
        subscriptions?.forEach(sub => {
            if (sub.company_id) planMap.set(sub.company_id, sub.plans)
        })

        const profileMap = new Map()
        profiles?.forEach(p => profileMap.set(p.id, p))

        const formattedData = empresas.map(emp => ({
            ...emp,
            plans: planMap.get(emp.id) || null,
            profiles: profileMap.get(emp.owner_id) || null
        }))

        return NextResponse.json(formattedData || [])

    } catch (error: any) {
        console.error('Critical Error [Admin Companies]:', error.message, error.details)
        return NextResponse.json({ 
            error: 'Erro ao carregar empresas reais',
            details: error.message 
        }, { status: 500 })
    }
}
