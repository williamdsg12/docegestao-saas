import { NextResponse } from 'next/server';
import { getPaymentClient } from '@/lib/mercadopago';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createTunaPixPayment } from '@/lib/payments/tuna';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const tenant_id = searchParams.get('tenant_id');
        const check_only = searchParams.get('check_only');

        if (!tenant_id) {
            return NextResponse.json({ error: 'Missing tenant_id' }, { status: 400 });
        }

        if (check_only === 'true') {
            // Check if Tuna PIX is active for this tenant
            const { data: tunaAccount } = await supabaseAdmin
                .from('tuna_accounts')
                .select('*')
                .eq('tenant_id', tenant_id)
                .eq('connected', true)
                .eq('pix_enabled', true)
                .single();

            return NextResponse.json({ 
                provider: tunaAccount ? 'tuna' : 'mercadopago' 
            });
        }

        return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
    } catch (error: any) {
        console.error('PIX GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { order_id, tenant_id, amount, customer_email, customer_name, customer_cpf } = body;

        if (!order_id || !tenant_id || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Check for Active Payment Provider
        // First check Tuna
        const { data: tunaAccount } = await supabaseAdmin
            .from('tuna_accounts')
            .select('*')
            .eq('tenant_id', tenant_id)
            .eq('connected', true)
            .eq('pix_enabled', true)
            .single();

        if (tunaAccount) {
            // Process via Tuna
            try {
                const tunaResult = await createTunaPixPayment(tenant_id, {
                    amount: parseFloat(amount),
                    orderId: order_id,
                    customer: {
                        name: customer_name || 'Cliente',
                        email: customer_email || 'cliente@docegestao.com.br',
                        document: customer_cpf || '000.000.000-00' // Tuna requires document
                    }
                });

                // Save to DB
                await supabaseAdmin
                    .from('payments')
                    .insert({
                        order_id,
                        tenant_id,
                        amount,
                        status: 'pending',
                        payment_method: 'pix',
                        provider: 'tuna',
                        qr_code: tunaResult.qr_code,
                        qr_code_base64: tunaResult.qr_code_base64,
                        external_id: tunaResult.external_id
                    });

                return NextResponse.json(tunaResult);
            } catch (tunaError: any) {
                console.error('Tuna PIX Error:', tunaError);
                // Fallback or error
                return NextResponse.json({ error: tunaError.message }, { status: 500 });
            }
        }

        // 2. Default to Mercado Pago
        const paymentData = {
            body: {
                transaction_amount: parseFloat(amount),
                description: `Pedido #${order_id.slice(0, 8)}`,
                payment_method_id: 'pix',
                payer: {
                    email: customer_email || 'cliente@docegestao.com.br',
                    first_name: customer_name?.split(' ')[0] || 'Cliente',
                },
                external_reference: order_id
            }
        };

        const paymentClient = getPaymentClient();
        const result: any = await paymentClient.create(paymentData);
        const pixData = result?.point_of_interaction?.transaction_data;

        if (!pixData) {
            console.error('Mercado Pago PIX Error: No transaction data', result);
            return NextResponse.json({ error: 'Erro ao gerar PIX com Mercado Pago' }, { status: 500 });
        }

        await supabaseAdmin
            .from('payments')
            .insert({
                order_id,
                tenant_id,
                amount,
                status: 'pending',
                payment_method: 'pix',
                provider: 'mercadopago',
                qr_code: pixData.qr_code,
                qr_code_base64: pixData.qr_code_base64,
                external_id: result.id?.toString(),
                ticket_url: pixData.ticket_url
            });

        return NextResponse.json({
            id: result.id,
            payment_id: result.id,
            order_id: order_id,
            qr_code: pixData.qr_code,
            pix_code: pixData.qr_code,
            qr_code_base64: pixData.qr_code_base64,
            ticket_url: pixData.ticket_url,
            expires_at: new Date(Date.now() + 3600000).toISOString()
        });

    } catch (error: any) {
        console.error('PIX Route Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
