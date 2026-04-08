import { NextResponse } from 'next/server';
import { getPaymentClient } from '@/lib/mercadopago';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createTunaCardPayment } from '@/lib/payments/tuna';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { order_id, tenant_id, amount, customer_email, customer_name, token, installments, issuer_id, payment_method_id } = body;

        if (!order_id || !tenant_id || !amount || !token) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Check for Active Payment Provider
        const { data: tunaAccount } = await supabaseAdmin
            .from('tuna_accounts')
            .select('*')
            .eq('tenant_id', tenant_id)
            .eq('connected', true)
            .eq('card_enabled', true)
            .single();

        if (tunaAccount) {
            try {
                const tunaResult = await createTunaCardPayment(tenant_id, {
                    amount: parseFloat(amount),
                    orderId: order_id,
                    token: token,
                    installments: installments || 1,
                    customer: {
                        name: customer_name || 'Cliente',
                        email: customer_email || 'cliente@docegestao.com.br'
                    }
                });

                await supabaseAdmin
                    .from('payments')
                    .insert({
                        order_id,
                        tenant_id,
                        amount,
                        status: tunaResult.status === 'approved' ? 'approved' : 'pending',
                        payment_method: 'credit_card',
                        provider: 'tuna',
                        external_id: tunaResult.external_id
                    });

                return NextResponse.json(tunaResult);
            } catch (tunaError: any) {
                console.error('Tuna Card Error:', tunaError);
                return NextResponse.json({ error: tunaError.message }, { status: 500 });
            }
        }

        // 2. Default to Mercado Pago
        const paymentData = {
            body: {
                transaction_amount: parseFloat(amount),
                token,
                description: `Pedido #${order_id.slice(0, 8)}`,
                payment_method_id,
                issuer_id,
                payer: {
                    email: customer_email || 'cliente@docegestao.com.br',
                },
                external_reference: order_id
            }
        };

        const paymentClient = getPaymentClient();
        const result = await paymentClient.create(paymentData);

        await supabaseAdmin
            .from('payments')
            .insert({
                order_id,
                tenant_id,
                amount,
                status: result.status === 'approved' ? 'approved' : 'pending',
                payment_method: 'credit_card',
                provider: 'mercadopago',
                external_id: result.id?.toString()
            });

        return NextResponse.json({
            id: result.id,
            status: result.status,
            detail: result.status_detail
        });

    } catch (error: any) {
        console.error('Card Route Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
