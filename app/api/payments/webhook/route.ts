import { NextResponse } from 'next/server';
import { getPaymentClient } from '@/lib/mercadopago';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, data } = body;

        // Mercado Pago sends 'payment' type only
        if (type === 'payment') {
            const paymentId = data.id;
            const paymentClient = getPaymentClient();
            const result = await paymentClient.get({ id: paymentId });

            if (result.status === 'approved') {
                const pedidoId = result.external_reference;

                // 1. Update Order Status in 'orders' table
                const { error: orderError } = await supabaseAdmin
                    .from('orders')
                    .update({ 
                        order_status: 'novo',
                        payment_status: 'paid',
                        paid: true,
                        payment_confirmed_at: new Date().toISOString()
                    }) // 'novo' is the start of production
                    .eq('id', pedidoId);

                if (orderError) console.error('Error updating order to novo:', orderError);

                // 2. Update Payment record in 'payments' table
                const { error: paymentError } = await supabaseAdmin
                    .from('payments')
                    .update({ 
                        status: 'approved', 
                        updated_at: new Date().toISOString() 
                    })
                    .eq('external_id', paymentId.toString());

                if (paymentError) console.error('Error updating payment record:', paymentError);

                console.log(`Payment approved for order ${pedidoId}`);
            }
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
