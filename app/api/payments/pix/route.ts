import { NextResponse } from 'next/server';
import { payment } from '@/lib/mercadopago';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { pedidoId, companyId, total, customerEmail, customerName } = body;

        if (!pedidoId || !companyId || !total) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Create Payment in Mercado Pago
        // In a real marketplace scenario, we would use the company's access token or application fee (split)
        // For now, we use the platform token and simulate the 'iFood' style with metadata
        
        const paymentData = {
            body: {
                transaction_amount: parseFloat(total),
                description: `Pedido #${pedidoId.slice(0, 8)} - DoceGestão`,
                payment_method_id: 'pix',
                payer: {
                    email: customerEmail || 'cliente@docegestao.com.br',
                    first_name: customerName?.split(' ')[0] || 'Cliente',
                    last_name: customerName?.split(' ').slice(1).join(' ') || 'SaaS',
                },
                external_reference: pedidoId,
                metadata: {
                    pedido_id: pedidoId,
                    company_id: companyId
                },
                // ℹ️ Para Split real (Mercado Pago Marketplace):
                // application_fee: (total * 0.10).toFixed(2), // Exemplo 10%
            }
        };

        const result = await payment.create(paymentData);

        if (!result.point_of_interaction?.transaction_data) {
            throw new Error('Failed to generate PIX point of interaction');
        }

        const pixData = result.point_of_interaction.transaction_data;

        // 2. Save Payment Info in our Database
        const { error: dbError } = await supabaseAdmin
            .from('pagamentos')
            .insert({
                pedido_id: pedidoId,
                company_id: companyId,
                gateway: 'mercadopago',
                valor: total,
                status: 'pendente',
                qr_code: pixData.qr_code,
                qr_code_base64: pixData.qr_code_base64,
                payment_id: result.id?.toString(),
                external_reference: pedidoId
            });

        if (dbError) {
            console.error('Database error saving payment:', dbError);
        }

        return NextResponse.json({
            id: result.id,
            qr_code: pixData.qr_code,
            qr_code_base64: pixData.qr_code_base64,
            ticket_url: pixData.ticket_url
        });

    } catch (error: any) {
        console.error('PIX Generation Error:', error);
        return NextResponse.json({ 
            error: error.message || 'Internal Server Error',
            details: error.cause || null
        }, { status: 500 });
    }
}
