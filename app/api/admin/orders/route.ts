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

        // 1. Buscar pedidos
        const { data: pedidos, error: pedidosError } = await supabaseAdmin
            .from('pedidos')
            .select('*')
            .order('created_at', { ascending: false })

        if (pedidosError) throw pedidosError

        // 2. Buscar nomes das empresas para vincular manualmente
        const empresaIds = pedidos.map(p => p.empresa_id).filter(Boolean)
        const { data: companies } = await supabaseAdmin
            .from('empresas')
            .select('id, name')
            .in('id', empresaIds)

        const companyMap = new Map()
        companies?.forEach(c => companyMap.set(c.id, c.name))

        const formattedData = pedidos.map(ped => ({
            ...ped,
            empresas: { name: companyMap.get(ped.empresa_id) || 'Desconhecida' }
        }))

        return NextResponse.json(formattedData || [])

    } catch (error: any) {
        console.error('Critical Error [Admin Orders]:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
