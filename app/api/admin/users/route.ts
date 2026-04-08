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

        // 1. Buscar perfis (profiles)
        const { data: profiles, error: profilesError } = await supabaseAdmin
            .from('profiles')
            .select(`
                id,
                owner_name,
                email,
                role,
                created_at,
                business_name,
                company_id,
                plan,
                trial_ends_at,
                subscription_status,
                is_admin
            `)
            .order('created_at', { ascending: false })

        if (profilesError) throw profilesError

        // 2. Buscar nomes das empresas vinculadas
        const empresaIds = profiles.map(p => p.company_id).filter(Boolean)
        const { data: companies } = await supabaseAdmin
            .from('empresas')
            .select('id, name')
            .in('id', empresaIds)

        const companyMap = new Map()
        companies?.forEach(c => companyMap.set(c.id, c.name))

        // 3. Mapear dados
        const formattedData = profiles.map(profile => ({
            ...profile,
            empresas: { name: companyMap.get(profile.company_id) || 'Nenhuma' }
        }))

        return NextResponse.json(formattedData || [])

    } catch (error: any) {
        console.error('Critical Error [Admin Users]:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    try {
        const user = await getServerUser()
        if (!isSuperAdmin(user)) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        const { userId, plan, trial_ends_at, subscription_status } = await req.json()

        if (!userId) {
            return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 })
        }

        const updates: any = {}
        if (plan) updates.plan = plan
        if (trial_ends_at) updates.trial_ends_at = trial_ends_at
        if (subscription_status) updates.subscription_status = subscription_status

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update(updates)
            .eq('id', userId)

        if (error) throw error

        // 4. Log the action in system_logs
        if (user) {
            try {
                await supabaseAdmin.from('system_logs').insert({
                    user_id: userId, // O registro afetado
                    action: 'USER_METADATA_UPDATE',
                    metadata: {
                        admin_email: user.email,
                        updates,
                        timestamp: new Date().toISOString()
                    },
                    level: 'info'
                })
            } catch (logErr) {
                console.error('[Admin Log Error]:', logErr)
            }
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('PATCH Error [Admin Users]:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
