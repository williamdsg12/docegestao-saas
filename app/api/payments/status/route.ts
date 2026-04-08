import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getPaymentClient } from '@/lib/mercadopago';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        }

        // 1. Check Order Status first (it might have been updated by Webhook)
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('status')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // If order is already processed/paid, return success
        if (order.status !== 'pendente_pagamento') {
            return NextResponse.json({ 
                status: 'approved', // Mapping the system status to a "success" for the frontend
                order_status: order.status
            });
        }

        // 2. If still pending, check our 'payments' table
        const { data: payment, error: paymentError } = await supabaseAdmin
            .from('payments')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (paymentError || !payment) {
            // No payment record yet, but order exists. Probably just generated.
            return NextResponse.json({ status: 'pending' });
        }

        // If DB says approved, we are good
        if (payment.status === 'approved') {
            return NextResponse.json({ status: 'approved' });
        }

        // 3. Fallback: Query Provider directly if still pending in DB
        // This handles cases where Webhook skipped or is delayed
        if (payment.status === 'pending' && payment.external_id) {
            try {
                if (payment.payment_method === 'tuna') {
                    const { getTunaPaymentStatus } = await import('@/lib/payments/tuna');
                    const tunaStatus = await getTunaPaymentStatus(payment.external_id, payment.tenant_id);
                    
                    if (tunaStatus === 'approved') {
                        await supabaseAdmin.from('orders').update({ status: 'novo' }).eq('id', orderId);
                        await supabaseAdmin.from('payments').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', payment.id);
                        return NextResponse.json({ status: 'approved' });
                    }
                    return NextResponse.json({ status: tunaStatus });
                } else {
                    const paymentClient = getPaymentClient();
                    const mpResult = await paymentClient.get({ id: payment.external_id });

                    if (mpResult.status === 'approved') {
                        await supabaseAdmin.from('orders').update({ status: 'novo' }).eq('id', orderId);
                        await supabaseAdmin.from('payments').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', payment.id);
                        return NextResponse.json({ status: 'approved' });
                    }
                    return NextResponse.json({ status: mpResult.status });
                }
            } catch (error) {
                console.error('Error querying provider:', error);
            }
        }

        return NextResponse.json({ 
            status: payment.status,
            payment_method: payment.payment_method
        });

    } catch (error: any) {
        console.error('Payment Status API Error:', error);
        return NextResponse.json({ 
            error: error.message || 'Internal Server Error' 
        }, { status: 500 });
    }
}
