import { NextResponse } from 'next/server';
import { payment } from '@/lib/mercadopago';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, data } = body;

        // Mercado Pago sends 'payment' type only
        if (type === 'payment') {
            const paymentId = data.id;
            const result = await payment.get({ id: paymentId });

            if (result.status === 'approved') {
                const pedidoId = result.external_reference;

                // 1. Update Order Status
                const { error: orderError } = await supabaseAdmin
                    .from('pedidos')
                    .update({ status: 'pago' })
                    .eq('id', pedidoId);

                if (orderError) console.error('Error updating order to paid:', orderError);

                // 2. Update Legacy Order Status (if exists)
                await supabaseAdmin
                    .from('orders')
                    .update({ status: 'pago' })
                    .eq('external_id', pedidoId); // Assume we store it if we need sync

                // 3. Update Payment record
                await supabaseAdmin
                    .from('pagamentos')
                    .update({ status: 'aprovado', updated_at: new Date().toISOString() })
                    .eq('payment_id', paymentId.toString());

                console.log(`Payment approved for order ${pedidoId}`);
            }
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
