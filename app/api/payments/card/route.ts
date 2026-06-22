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
                    installments: Number(installments) || 1,
                    customer: {
                        name: customer_name || 'Cliente',
                        email: customer_email || 'cliente@docegestao.com.br'
                    }
                });

                const isApproved = tunaResult.status === 'approved' || tunaResult.status === 2 || tunaResult.status === 3;

                await supabaseAdmin
                    .from('payments')
                    .insert({
                        order_id,
                        tenant_id,
                        amount,
                        status: isApproved ? 'approved' : 'pending',
                        payment_method: 'credit_card',
                        provider: 'tuna',
                        external_id: tunaResult.external_id
                    });

                if (isApproved) {
                    console.log('Pagamento aprovado');
                    await supabaseAdmin
                        .from('orders')
                        .update({ 
                            payment_status: 'paid',
                            order_status: 'novo',
                            paid: true,
                            payment_confirmed_at: new Date().toISOString()
                        })
                        .eq('id', order_id);
                } else {
                    console.log('Pagamento recusado');
                }

                return NextResponse.json({
                    id: tunaResult.id,
                    status: isApproved ? 'approved' : 'pending',
                    detail: tunaResult.status
                });
            } catch (tunaError: any) {
                console.error('Tuna Card Error:', tunaError);
                console.log('Pagamento recusado');
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
                installments: Number(installments) || 1,
                payer: {
                    email: customer_email || 'cliente@docegestao.com.br',
                },
                external_reference: order_id
            }
        };

        const paymentClient = getPaymentClient();
        const result = await paymentClient.create(paymentData);

        const isApproved = result.status === 'approved';

        await supabaseAdmin
            .from('payments')
            .insert({
                order_id,
                tenant_id,
                amount,
                status: isApproved ? 'approved' : 'pending',
                payment_method: 'credit_card',
                provider: 'mercadopago',
                external_id: result.id?.toString()
            });

        if (isApproved) {
            console.log('Pagamento aprovado');
            await supabaseAdmin
                .from('orders')
                .update({ 
                    payment_status: 'paid',
                    order_status: 'novo',
                    paid: true,
                    payment_confirmed_at: new Date().toISOString()
                })
                .eq('id', order_id);
        } else {
            console.log('Pagamento recusado');
        }

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
