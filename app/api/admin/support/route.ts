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

        // 1. Buscar tickets de suporte
        const { data: tickets, error: ticketsError } = await supabaseAdmin
            .from('support_tickets')
            .select('*')
            .order('created_at', { ascending: false })

        if (ticketsError) throw ticketsError

        // 2. Coletar IDs para buscas auxiliares
        const empresaIds = tickets.map(t => t.company_id).filter(Boolean)
        const userIds = tickets.map(t => t.user_id).filter(Boolean)

        // 3. Buscar Empresas e Perfis de forma independente
        const [
            { data: empresas },
            { data: profiles }
        ] = await Promise.all([
            supabaseAdmin.from('empresas').select('id, name').in('id', empresaIds),
            supabaseAdmin.from('profiles').select('id, owner_name').in('id', userIds)
        ])

        // 4. Mapear dados
        const empresaMap = new Map()
        empresas?.forEach(e => empresaMap.set(e.id, e.name))

        const profileMap = new Map()
        profiles?.forEach(p => profileMap.set(p.id, p.owner_name))

        const formattedData = tickets.map(ticket => ({
            ...ticket,
            empresas: { name: empresaMap.get(ticket.company_id) || 'Desconhecida' },
            profiles: { owner_name: profileMap.get(ticket.user_id) || 'Usuário' }
        }))

        return NextResponse.json(formattedData || [])

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
