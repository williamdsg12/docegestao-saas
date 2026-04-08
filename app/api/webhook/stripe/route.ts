import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { headers } from 'next/headers'

export async function POST(req: Request) {
    const body = await req.text()
    const signature = (await headers()).get('stripe-signature') as string

    let event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ''
        )
    } catch (err: any) {
        console.error(`[Stripe Webhook] Erro de assinatura: ${err.message}`)
        return NextResponse.json({ error: 'Webhook Error' }, { status: 400 })
    }

    // Processar o evento
    try {
        switch (event.type) {
            case 'account.updated': {
                const account = event.data.object as any
                const { error } = await supabaseAdmin
                    .from('payment_settings')
                    .update({
                        stripe_charges_enabled: account.charges_enabled,
                        stripe_payouts_enabled: account.payouts_enabled,
                        stripe_onboarding_complete: account.details_submitted,
                        stripe_account_status: (account.charges_enabled && account.payouts_enabled) ? 'ativo' : (account.details_submitted ? 'restrito' : 'pendente'),
                        updated_at: new Date().toISOString()
                    })
                    .eq('stripe_account_id', account.id)
                break
            }

            case 'charge.dispute.created': {
                const dispute = event.data.object as any
                const paymentIntentId = dispute.payment_intent
                
                // 1. Buscar pedido no banco
                const { data: order } = await supabaseAdmin
                    .from('orders')
                    .select('*')
                    .eq('stripe_payment_intent_id', paymentIntentId)
                    .single()

                if (order) {
                    // 2. Criar registro de disputa
                    await supabaseAdmin.from('payment_disputes').insert({
                        tenant_id: order.tenant_id,
                        order_id: order.id,
                        stripe_dispute_id: dispute.id,
                        stripe_payment_intent_id: paymentIntentId,
                        amount: dispute.amount,
                        reason: dispute.reason,
                        status: 'needs_response'
                    })

                    // 3. REVERTER TRANSFERÊNCIA (Transfer Reversal)
                    // Como a Stripe debita a plataforma, nós retiramos do lojista
                    if (order.stripe_transfer_id) {
                        try {
                            await stripe.transfers.createReversal(order.stripe_transfer_id, {
                                amount: dispute.amount,
                                description: `Reversão automática por disputa: ${dispute.id}`,
                            })
                        } catch (e: any) {
                            console.error(`[Webhook] Erro ao reverter transferência ${order.stripe_transfer_id}:`, e.message)
                        }
                    }
                }
                break
            }

            case 'charge.refunded': {
                const charge = event.data.object as any
                const paymentIntentId = charge.payment_intent
                
                // Reverter parte da transferência proporcional ao reembolso
                const { data: order } = await supabaseAdmin
                    .from('orders')
                    .select('*')
                    .eq('stripe_payment_intent_id', paymentIntentId)
                    .single()

                if (order && order.stripe_transfer_id) {
                    try {
                        await stripe.transfers.createReversal(order.stripe_transfer_id, {
                            amount: charge.amount_refunded,
                            description: `Reversão por reembolso: ${charge.id}`,
                        })
                    } catch (e: any) {
                        console.error(`[Webhook] Erro ao reverter transferência por reembolso:`, e.message)
                    }
                }
                break
            }

            default:
                console.log(`[Stripe Webhook] Evento não processado: ${event.type}`)
        }

        return NextResponse.json({ received: true })

    } catch (error: any) {
        console.error('[Stripe Webhook] Erro interno:', error.message)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
