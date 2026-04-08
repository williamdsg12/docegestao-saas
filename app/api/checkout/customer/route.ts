import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createDestinationPayment, calculateDoceGestaoFee } from '@/lib/stripe-payments';

/**
 * POST /api/checkout/customer
 * Cria uma intenção de pagamento para o cliente final comprar do lojista
 */
export async function POST(req: Request) {
  try {
    const { orderId, tenantId } = await req.json();

    if (!orderId || !tenantId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Buscar dados do pedido e do lojista
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*, tenants(*)')
      .eq('id', orderId)
      .single();

    const { data: paymentSettings } = await supabaseAdmin
      .from('payment_settings')
      .select('stripe_account_id, stripe_account_status')
      .eq('tenant_id', tenantId)
      .single();

    if (!order || !paymentSettings?.stripe_account_id || paymentSettings.stripe_account_status !== 'ativo') {
      return NextResponse.json({ 
        error: 'Lojista não está habilitado para pagamentos online' 
      }, { status: 400 });
    }

    // 2. Calcular valores
    const amountInCents = Math.round(order.total * 100);
    const feeAmount = calculateDoceGestaoFee(amountInCents);

    // 3. Criar PaymentIntent via Helper
    const paymentIntent = await createDestinationPayment({
      amount: amountInCents,
      currency: 'brl',
      stripeAccountId: paymentSettings.stripe_account_id,
      applicationFeeAmount: feeAmount,
      orderId: order.id,
      metadata: {
        tenantId: tenantId,
        customerName: order.customer_name || 'Cliente'
      }
    });

    // 4. Atualizar pedido com o ID da transação para rastreamento futuro
    await supabaseAdmin
      .from('orders')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        stripe_fee_amount: feeAmount,
        net_amount: amountInCents - feeAmount,
      })
      .eq('id', orderId);

    // Retornamos o client_secret para o frontend finalizar o pagamento (Stripe Elements)
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    });

  } catch (error: any) {
    console.error('[Customer Checkout API] Erro:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
