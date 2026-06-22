import { NextResponse } from 'next/server';
import { getPaymentClient } from '@/lib/mercadopago';
import { supabaseAdmin } from '@/lib/supabase-admin';
import 'dotenv/config';

export async function POST(req: Request) {
    console.log("PIX Route triggered. Token present in env:", !!process.env.MP_ACCESS_TOKEN);
    if (process.env.MP_ACCESS_TOKEN) {
        console.log("Token starts with:", process.env.MP_ACCESS_TOKEN.substring(0, 10) + "...");
    }

    try {
        const body = await req.json();
        const { amount, description, email, customer_email, order_id, tenant_id } = body;
        
        // PIX requires a valid email. If user didn't provide one, use a fallback.
        const effectiveEmail = email || customer_email || `customer-${order_id}@docegestao.com.br`;

        if (!amount || !order_id) {
            console.error('Missing required fields for PIX:', { amount, order_id });
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log('Generating PIX for:', { amount, order_id, effectiveEmail });

        // 1. Create Payment in Mercado Pago (V2 SDK)
        const payment = getPaymentClient();
        const paymentData = {
            body: {
                transaction_amount: Number(amount),
                description: description || `Pedido #${order_id.slice(0, 8)}`,
                payment_method_id: 'pix',
                payer: {
                    email: effectiveEmail
                },
                external_reference: order_id,
                metadata: {
                    order_id: order_id,
                    tenant_id: tenant_id
                }
            }
        };

        console.log('1. Calling Mercado Pago API...');
        const result = await payment.create(paymentData);
        console.log('2. Mercado Pago API Success. ID:', result.id);

        // 🧪 PASSO 1 — DEBUG BACKEND (Logging full body as requested)
        // console.log("MERCADO PAGO BODY:", JSON.stringify(result, null, 2));

        if (!result.point_of_interaction?.transaction_data) {
            console.error('❌ Mercado Pago Error - No transaction data:', result);
            return NextResponse.json({ 
                error: 'QR Code não gerado pelo Mercado Pago' 
            }, { status: 500 });
        }

        const pixData = result.point_of_interaction.transaction_data;
        const qrContent = pixData.qr_code;
        const qrBase64 = pixData.qr_code_base64;

        console.log('3. Saving to Supabase (manual upsert)...');
        // Manual Upsert (since we might not have a UNIQUE constraint on order_id)
        const paymentRecord = {
            order_id: order_id,
            tenant_id: tenant_id,
            amount: amount,
            status: 'pending',
            payment_method: 'pix',
            qr_code: qrContent,
            qr_code_base64: qrBase64,
            external_id: result.id?.toString(),
            ticket_url: pixData.ticket_url
        };

        const { data: existingPayment } = await supabaseAdmin
            .from('payments')
            .select('id')
            .eq('order_id', order_id)
            .maybeSingle();

        let dbError;
        if (existingPayment) {
            console.log('   - Updating existing payment record...');
            const { error } = await supabaseAdmin
                .from('payments')
                .update(paymentRecord)
                .eq('id', existingPayment.id);
            dbError = error;
        } else {
            console.log('   - Inserting new payment record...');
            const { error } = await supabaseAdmin
                .from('payments')
                .insert(paymentRecord);
            dbError = error;
        }
        
        console.log('4. Supabase Save Finished. Error:', dbError ? dbError.message : 'None');

        if (dbError) {
            console.error('Database error saving payment:', dbError);
            // Even if DB fails, we return the PIX data to the user so they can pay
        }

        console.log('5. Returning final response to client.');
        // 🧪 PASSO 2 — GARANTIR RETORNO CORRETO
        return NextResponse.json({
            qr_code: qrContent,
            pix_code: qrContent,
            qr_code_base64: qrBase64,
            payment_id: result.id,
            order_id: order_id,
            expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour expiry
        });

    } catch (error: any) {
        console.error('CRITICAL PIX ERROR:', error);
        return NextResponse.json({ 
            error: 'Erro ao gerar PIX',
            details: error.message 
        }, { status: 500 });
    }
}
