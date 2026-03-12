import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single()

        if (!profile?.is_admin) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        const { data, error } = await supabaseAdmin
            .from('payments')
            .select(`
                *,
                subscriptions (
                    companies ( name ),
                    plans ( name )
                )
            `)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json(data || [])

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
