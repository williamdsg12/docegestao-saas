import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id'); // Payment ID or Order ID? User said status?id=${payment_id}

        if (!id) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        }

        const { data: payData, error } = await supabaseAdmin
            .from('payments')
            .select('*')
            .or(`external_id.eq.${id},order_id.eq.${id}`)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            return NextResponse.json({ status: 'not_found' });
        }

        return NextResponse.json({ 
            status: payData.status,
            payment_method: payData.payment_method
        });

    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
