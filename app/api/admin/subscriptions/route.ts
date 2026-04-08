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

        // 1. Buscar assinaturas
        const { data: subscriptions, error: subsError } = await supabaseAdmin
            .from('subscriptions')
            .select('*')
            .order('created_at', { ascending: false })

        if (subsError) throw subsError

        // 2. Coletar IDs para buscas auxiliares
        const empresaIds = subscriptions.map(s => s.company_id).filter(Boolean)
        const profileIds = subscriptions.map(s => s.user_id).filter(Boolean)
        const planIds = subscriptions.map(s => s.plan_id).filter(Boolean)

        // 3. Buscar dados auxiliares de forma independente
        const [
            { data: empresas },
            { data: profiles },
            { data: plans }
        ] = await Promise.all([
            supabaseAdmin.from('empresas').select('id, name').in('id', empresaIds),
            supabaseAdmin.from('profiles').select('id, owner_name, email').in('id', profileIds),
            supabaseAdmin.from('plans').select('id, name, price').in('id', planIds)
        ])

        // 4. Mapear dados
        const empresaMap = new Map()
        empresas?.forEach(e => empresaMap.set(e.id, e))

        const profileMap = new Map()
        profiles?.forEach(p => profileMap.set(p.id, p))

        const planMap = new Map()
        plans?.forEach(pl => planMap.set(pl.id, pl))

        const formattedData = subscriptions.map(sub => ({
            ...sub,
            empresas: empresaMap.get(sub.company_id) || { name: 'Desconhecida' },
            profiles: profileMap.get(sub.user_id) || { owner_name: 'Usuário', email: '-' },
            plans: planMap.get(sub.plan_id) || { name: 'Sem Plano', price: 0 }
        }))

        return NextResponse.json(formattedData || [])

    } catch (error: any) {
        console.error('Critical Error [Admin Subscriptions]:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
