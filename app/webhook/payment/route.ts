import { NextResponse } from 'next/server';
import { getPaymentClient } from '@/lib/mercadopago';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log('Webhook recebido');
        
        // 1. Check if it is a Mercado Pago standard notification
        const { action, type, data } = body;
        if (type === 'payment' || action === 'payment.created' || action === 'payment.updated') {
            const paymentId = data?.id || body.data?.id;
            if (paymentId) {
                const paymentClient = getPaymentClient();
                const mpPayment = await paymentClient.get({ id: paymentId });
                const status = mpPayment.status; // 'approved', 'rejected', 'cancelled', 'pending', etc.
                const order_id = mpPayment.external_reference;
                
                if (order_id) {
                    await supabaseAdmin
                        .from('payments')
                        .update({ 
                            status: status,
                            updated_at: new Date().toISOString()
                        })
                        .eq('external_id', paymentId.toString());

                    if (status === 'approved') {
                        await supabaseAdmin
                            .from('orders')
                            .update({ 
                                payment_status: 'paid',
                                order_status: 'novo',
                                paid: true,
                                payment_confirmed_at: new Date().toISOString()
                            })
                            .eq('id', order_id);
                    }
                }
                return NextResponse.json({ received: true });
            }
        }

        // 2. Otherwise handle direct/mock payload for testing
        const { order_id, status } = body;
        if (order_id) {
            const targetStatus = status || 'paid';
            const { error: orderError } = await supabaseAdmin
                .from('orders')
                .update({ 
                    order_status: 'novo',
                    payment_status: targetStatus,
                    paid: targetStatus === 'paid',
                    payment_confirmed_at: targetStatus === 'paid' ? new Date().toISOString() : null
                })
                .eq('id', order_id);

            if (orderError) {
                return NextResponse.json({ error: orderError.message }, { status: 500 });
            }

            await supabaseAdmin
                .from('payments')
                .update({ 
                    status: targetStatus === 'paid' ? 'approved' : targetStatus, 
                    updated_at: new Date().toISOString() 
                })
                .eq('order_id', order_id);

            return NextResponse.json({ success: true, message: `Status updated for order ${order_id}` });
        }

        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
