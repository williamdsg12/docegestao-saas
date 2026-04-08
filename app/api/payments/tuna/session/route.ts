import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getTunaSession } from '@/lib/payments/tuna';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const tenant_id = searchParams.get('tenant_id');

        if (!tenant_id) {
            return NextResponse.json({ error: 'Missing tenant_id' }, { status: 400 });
        }

        // 1. Get Session from Tuna
        const session_id = await getTunaSession(tenant_id);

        return NextResponse.json({ session_id });
    } catch (error: any) {
        console.error('Tuna Session Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
