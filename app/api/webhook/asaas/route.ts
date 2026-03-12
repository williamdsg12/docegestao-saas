import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const dynamic = 'force-dynamic'

/**
 * Asaas Webhook Handler
 * Documentation: https://docs.asaas.com/docs/webhook-para-pagamentos
 */
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const asaasToken = req.headers.get("asaas-access-token")

        // In production, verify the Asaas Token for security
        // if (asaasToken !== process.env.ASAAS_WEBHOOK_TOKEN) {
        //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        // }

        console.log("Asaas Webhook received:", body.event)

        const { event, payment } = body

        // Event: PAYMENT_RECEIVED or PAYMENT_CONFIRMED
        if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
            const externalId = payment.id
            const subscriptionId = payment.externalReference // We should pass subscription ID as externalReference in checkout

            if (subscriptionId) {
                // 1. Get Subscription and Plan Info
                const { data: sub } = await supabase
                    .from("subscriptions")
                    .select("*, plans(*)")
                    .eq("id", subscriptionId)
                    .single()

                const isAnnual = sub?.plans?.billing_cycle === 'annually'
                const daysToAdd = isAnnual ? 365 : 30

                // 2. Update Payment Status
                await supabase
                    .from("payments")
                    .update({ status: "RECEIVED" })
                    .eq("gateway_payment_id", externalId)

                // 3. Activate Subscription
                const { error: subError } = await supabase
                    .from("subscriptions")
                    .update({
                        status: "active",
                        current_period_end: new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString()
                    })
                    .eq("id", subscriptionId)

                if (subError) throw subError

                return NextResponse.json({ message: "Subscription activated" }, { status: 200 })
            }
        }

        return NextResponse.json({ message: "Received" }, { status: 200 })
    } catch (error) {
        console.error("Webhook Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
