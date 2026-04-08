import { NextResponse } from 'next/server';
import { getPaymentClient } from '@/lib/mercadopago';
import { supabaseAdmin } from '@/lib/supabase-admin';
import 'dotenv/config';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { 
            token, 
            issuer_id, 
            payment_method_id, 
            transaction_amount, 
            installments, 
            payer,
            order_id,
            tenant_id
        } = body;

        if (!token || !transaction_amount || !order_id || !tenant_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const effectiveEmail = payer?.email || `customer-${order_id}@docegestao.com.br`;

        // 1. Create Payment in Mercado Pago
        const payment = getPaymentClient();
        const paymentData = {
            body: {
                transaction_amount: parseFloat(transaction_amount),
                token,
                description: `Pedido #${order_id.slice(0, 8)} - DocesGestão`,
                installments: parseInt(installments || '1'),
                payment_method_id,
                issuer_id,
                payer: {
                    email: effectiveEmail,
                    identification: payer?.identification,
                },
                external_reference: order_id,
                metadata: {
                    order_id,
                    tenant_id
                }
            }
        };

        const result = await payment.create(paymentData);

        // 2. Save Payment Info in our Database (Upsert)
        const { error: dbError } = await supabaseAdmin
            .from('payments')
            .upsert({
                order_id,
                tenant_id,
                amount: transaction_amount,
                status: result.status === 'approved' ? 'approved' : result.status || 'pending',
                payment_method: 'card',
                external_id: result.id?.toString(),
            }, { onConflict: 'order_id' });

        if (dbError) {
            console.error('Database error saving payment:', dbError);
        }

        // 3. Update Order Payment Status if approved
        if (result.status === 'approved') {
            await supabaseAdmin
                .from('orders')
                .update({ payment_status: 'paid' })
                .eq('id', order_id);
        }

        return NextResponse.json({
            id: result.id,
            status: result.status,
            status_detail: result.status_detail
        });

    } catch (error: any) {
        console.error('Credit Card Payment Error:', error);
        return NextResponse.json({ 
            error: error.message || 'Internal Server Error'
        }, { status: 500 });
    }
}
