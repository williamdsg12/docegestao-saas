import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { stripe } from "@/lib/stripe"

export const dynamic = 'force-dynamic'
import { headers } from "next/headers"

/**
 * POST /api/webhook/stripe
 * Stripe Webhook Handler
 */
export async function POST(req: Request) {
    const body = await req.text()
    const sig = (await headers()).get('stripe-signature') as string

    let event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET || ''
        )
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`)
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
    }

    console.log("Stripe Event received:", event.type)

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as any
                const { userId, planId, subscriptionId } = session.metadata

                if (subscriptionId) {
                    // 1. Get Plan to see duration
                    const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).single()
                    const daysToAdd = plan?.billing_cycle === 'annually' ? 365 : 30

                    // 2. Resolve Payment Method Name
                    const methodUsed = session.payment_method_types?.[0] === 'pix' ? 'PIX' : 'CREDIT_CARD'

                    // 2. Activate Subscription
                    await supabase
                        .from('subscriptions')
                        .update({
                            status: 'active',
                            plan_id: planId,
                            stripe_subscription_id: session.subscription, // Important for future cancellation
                            current_period_end: new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString()
                        })
                        .eq('id', subscriptionId)

                    // 3. Record Payment
                    await supabase
                        .from('payments')
                        .insert({
                            subscription_id: subscriptionId,
                            amount: session.amount_total / 100,
                            payment_method: methodUsed,
                            status: 'RECEIVED',
                            gateway: 'Stripe',
                            gateway_payment_id: session.id
                        })

                    console.log(`[Webhook] Payment processed successfully for user ${userId}. Method: ${methodUsed}`)
                }
                break
            }

            case 'customer.subscription.deleted': {
                const stripeSub = event.data.object as any
                // Handle cancellation logic...
                await supabase
                    .from('subscriptions')
                    .update({ status: 'canceled' })
                    .eq('stripe_subscription_id', stripeSub.id) // We should save this ID in activation
                break
            }
        }

        return NextResponse.json({ received: true }, { status: 200 })
    } catch (error: any) {
        console.error("Webhook processing error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
