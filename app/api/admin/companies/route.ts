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
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        // Query: Buscar empresas com planos e donos
        const { data, error } = await supabaseAdmin
            .from('companies')
            .select(`
                id,
                name,
                email,
                phone,
                status,
                created_at,
                plan_id,
                plans (
                    name
                ),
                profiles:owner_id (
                    owner_name,
                    email
                )
            `)
            .order('created_at', { ascending: false })

        if (error) throw error

        // Em uma implementação real com tabelas de usuários vinculadas por company_id:
        // let { data: userCounts } = await supabaseAdmin.from('profiles').select('company_id')... group by
        
        return NextResponse.json(data || [])

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
