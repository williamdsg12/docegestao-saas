
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

        // Query: Buscar pedidos de todas as empresas
        const { data, error } = await supabaseAdmin
            .from('orders')
            .select(`
                id,
                product_name,
                total_value,
                deposit_value,
                status,
                delivery_date,
                created_at,
                company_id,
                client_id,
                companies:company_id (
                    name
                ),
                clients:client_id (
                    name
                )
            `)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json(data || [])

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
