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

        // 1. Buscar pagamentos
        const { data: payments, error: paymentsError } = await supabaseAdmin
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false })

        if (paymentsError) throw paymentsError

        // 2. Coletar IDs para buscas auxiliares
        const orderIds = payments.map(p => p.order_id).filter(Boolean)
        const empresaIds = payments.map(p => p.empresa_id).filter(Boolean)

        // 3. Buscar Pedidos, Empresas e Perfis de forma independente
        const [
            { data: pedidos },
            { data: empresas },
            { data: profiles }
        ] = await Promise.all([
            supabaseAdmin.from('pedidos').select('id, empresa_id, customer_id').in('id', orderIds),
            supabaseAdmin.from('empresas').select('id, name').in('id', empresaIds),
            supabaseAdmin.from('profiles').select('id, owner_name').in('id', payments.map(p => p.user_id).filter(Boolean))
        ])

        // 4. Mapear dados
        const empresaMap = new Map()
        empresas?.forEach(e => empresaMap.set(e.id, e.name))

        const profileMap = new Map()
        profiles?.forEach(p => profileMap.set(p.id, p.owner_name))

        const pedidoMap = new Map()
        pedidos?.forEach(ped => {
            pedidoMap.set(ped.id, {
                empresas: { name: empresaMap.get(ped.empresa_id) || 'Desconhecida' },
                profiles: { owner_name: profileMap.get(ped.customer_id) || 'Cliente' }
            })
        })

        const formattedData = payments.map(pay => ({
            ...pay,
            pedidos: pedidoMap.get(pay.order_id) || { 
                empresas: { name: empresaMap.get(pay.empresa_id) || 'Desconhecida' },
                profiles: { owner_name: profileMap.get(pay.user_id) || 'Usuário' }
            }
        }))

        return NextResponse.json(formattedData || [])

    } catch (error: any) {
        console.error('Critical Error [Admin Payments]:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    try {
        const user = await getServerUser()
        if (!isSuperAdmin(user)) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        const { paymentId, status } = await req.json()

        if (!paymentId || !status) {
            return NextResponse.json({ error: 'ID e Status são obrigatórios' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('payments')
            .update({ status })
            .eq('id', paymentId)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('PATCH Error [Admin Payments]:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
