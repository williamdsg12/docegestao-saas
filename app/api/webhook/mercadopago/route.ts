import { NextResponse } from 'next/server';
import { getPaymentClient } from '@/lib/mercadopago';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log('Webhook recebido');
        const { action, type, data } = body;

        // Mercado Pago sends different types of notifications. 
        // We are interested in 'payment' and specifically 'payment.created', 'payment.updated'
        if (type === 'payment') {
            const paymentId = data.id;
            
            // 1. Fetch Payment details from Mercado Pago to verify
            const paymentClient = getPaymentClient();
            const mpPayment = await paymentClient.get({ id: paymentId });
            
            const status = mpPayment.status; // 'approved', 'rejected', 'cancelled', 'pending', etc.
            const order_id = mpPayment.external_reference;
            const tenant_id = mpPayment.metadata?.tenant_id;

            // 2. Update our Database
            const { error: updateError } = await supabaseAdmin
                .from('payments')
                .update({ 
                    status: status,
                    updated_at: new Date().toISOString()
                })
                .eq('external_id', paymentId.toString());

            if (updateError) {
                console.error('Error updating payment in webhook:', updateError);
            }

            // 3. Update Order Payment Status if approved
            if (status === 'approved' && order_id) {
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

    } catch (error: any) {
        console.error('Mercado Pago Webhook Error:', error);
        return NextResponse.json({ 
            error: error.message || 'Internal Server Error' 
        }, { status: 500 });
    }
}
