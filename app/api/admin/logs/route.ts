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
            .from('system_logs')
            .select(`
                *,
                profiles:user_id ( owner_name ),
                empresas!company_id ( name )
            `)
            .order('created_at', { ascending: false })
            .limit(200)

        if (error) throw error

        return NextResponse.json(data || [])

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
