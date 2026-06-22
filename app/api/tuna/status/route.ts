import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const tenant_id = searchParams.get('tenant_id');

        if (!tenant_id) {
            return NextResponse.json({ error: 'Missing tenant_id' }, { status: 400 });
        }

        // 1. Fetch current status from database
        const { data: tunaAccount, error: fetchError } = await supabaseAdmin
            .from('tuna_accounts')
            .select('status, account_id, conectado')
            .eq('tenant_id', tenant_id)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "No rows found"
            console.error('Error fetching tuna status:', fetchError);
            throw fetchError;
        }

        return NextResponse.json({ 
            status: tunaAccount?.status || 'not_started',
            connected: tunaAccount?.conectado || false,
            account_id: tunaAccount?.account_id || null
        });

    } catch (error: any) {
        console.error('Tuna Status Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
