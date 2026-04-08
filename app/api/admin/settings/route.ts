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

        const { data, error } = await supabaseAdmin
            .from('global_settings')
            .select('*')
            .eq('id', 1)
            .single()

        if (error) {
            if (error.code === 'PGRST116' || error.message.includes('not found')) {
                // Table doesn't exist yet or row missing
                return NextResponse.json({ 
                    error: 'Configurações não encontradas', 
                    needs_migration: true,
                    details: 'A tabela global_settings precisa ser criada no Supabase.'
                }, { status: 200 }) // Return 200 so UI can show the migration warning
            }
            throw error
        }

        return NextResponse.json(data)

    } catch (error: any) {
        console.error('Error [GET /api/admin/settings]:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const user = await getServerUser()
        if (!isSuperAdmin(user)) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        const body = await request.json()
        
        // Remove ID and updated_at to let DB handle them
        const { id, updated_at, ...updateData } = body

        const { data, error } = await supabaseAdmin
            .from('global_settings')
            .upsert({ id: 1, ...updateData, updated_at: new Date().toISOString() })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)

    } catch (error: any) {
        console.error('Error [POST /api/admin/settings]:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
