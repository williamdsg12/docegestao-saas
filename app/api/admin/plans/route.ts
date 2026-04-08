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
            .from('plans')
            .select('*')
            .order('price', { ascending: true })

        if (error) throw error

        return NextResponse.json(data || [])

    } catch (error: any) {
        console.error('Error [GET /api/admin/plans]:', error.message)
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
        const { id, created_at, ...newData } = body

        const { data, error } = await supabaseAdmin
            .from('plans')
            .insert([newData])
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)

    } catch (error: any) {
        console.error('Error [POST /api/admin/plans]:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const user = await getServerUser()
        if (!isSuperAdmin(user)) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        const body = await request.json()
        const { id, created_at, ...updateData } = body

        if (!id) return NextResponse.json({ error: 'ID do plano é obrigatório' }, { status: 400 })

        const { data, error } = await supabaseAdmin
            .from('plans')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)

    } catch (error: any) {
        console.error('Error [PUT /api/admin/plans]:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await getServerUser()
        if (!isSuperAdmin(user)) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'ID do plano é obrigatório' }, { status: 400 })

        const { error } = await supabaseAdmin
            .from('plans')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Error [DELETE /api/admin/plans]:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
