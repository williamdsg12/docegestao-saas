import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { orderId, total, customerEmail } = body;

        if (!orderId || !total) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Create PaymentIntent for PIX
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(total * 100),
            currency: 'brl',
            payment_method_types: ['pix'],
            metadata: {
                orderId: orderId,
                type: 'store_order'
            },
            // PIX requires specific setup in some cases, but 'pix' in payment_method_types is the core
            payment_method_options: {
                pix: {
                    expires_after_seconds: 3600, // 1 hour
                },
            },
        });

        // 2. Update Order with Payment Intent ID (Initial state is 'pending' / 'waiting_payment')
        const { error: updateError } = await supabase
            .from('orders')
            .update({ 
                payment_intent_id: paymentIntent.id,
                payment_status: 'waiting_payment'
            })
            .eq('id', orderId);

        if (updateError) {
            console.error('Error updating order with payment intent:', updateError);
        }

        // 3. Return client secret for the frontend or the PIX data
        // For PIX, the client side can use the client_secret to display the QR code
        // or we can extract the next_action from the intent if we confirm it immediately
        
        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });

    } catch (error: any) {
        console.error('Stripe PIX Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
