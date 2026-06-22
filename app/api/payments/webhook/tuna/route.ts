import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log('Tuna Webhook received:', JSON.stringify(body, null, 2));

        // Tuna sends notifications with different structures.
        // Usually: { status: number, paymentId: string, partnerOrderId: string }
        // status 1 = Started, 2 = Authorized, 3 = Captured, 4 = Refunded, 5 = Voided, 6 = Error
        
        const { status, paymentId, partnerOrderId } = body;

        if (!partnerOrderId) {
            return NextResponse.json({ error: 'Missing partnerOrderId' }, { status: 400 });
        }

        // status 2 (Authorized) or 3 (Captured) usually mean successful payment in most flows
        // For PIX, it's usually 3 (Captured)
        const isApproved = status === 2 || status === 3;

        if (isApproved) {
            // 1. Update Order Status in 'orders' table
            const { error: orderError } = await supabaseAdmin
                .from('orders')
                .update({ 
                    order_status: 'novo',
                    payment_status: 'paid',
                    paid: true,
                    payment_confirmed_at: new Date().toISOString()
                }) // 'novo' is the start of production in this system
                .eq('id', partnerOrderId)
                .eq('order_status', 'pendente_pagamento'); // Safety check

            if (orderError) console.error('Error updating order to novo from Tuna:', orderError);

            // 2. Update Payment record in 'payments' table
            const { error: paymentError } = await supabaseAdmin
                .from('payments')
                .update({ 
                    status: 'approved', 
                    updated_at: new Date().toISOString() 
                })
                .eq('order_id', partnerOrderId);

            if (paymentError) console.error('Error updating payment record from Tuna:', paymentError);

            console.log(`Tuna Payment approved for order ${partnerOrderId}`);
        } else if (status === 6) { // Error / Canceled
             await supabaseAdmin
                .from('payments')
                .update({ 
                    status: 'rejected', 
                    updated_at: new Date().toISOString() 
                })
                .eq('order_id', partnerOrderId);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Tuna Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
