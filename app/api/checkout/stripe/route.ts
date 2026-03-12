import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const dynamic = 'force-dynamic'
import { stripe } from "@/lib/stripe"

/**
 * POST /api/checkout/stripe
 * Body: { planId: string, billingCycle: 'monthly' | 'annually' }
 */
export async function POST(req: Request) {
    try {
        const { planId, billingCycle } = await req.json()

        // 1. Get User Session
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 2. Get Plan Details
        const { data: plan, error: planError } = await supabase
            .from('plans')
            .select('*')
            .eq('id', planId)
            .single()

        if (planError || !plan) {
            return NextResponse.json({ error: "Plan not found" }, { status: 404 })
        }

        // 3. Get or Create Subscription/Company for the user
        // We use Service Role to bypass RLS during checkout initialization
        const { createClient } = await import('@supabase/supabase-js')
        const serviceSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        let { data: sub, error: subError } = await serviceSupabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle()

        if (subError) {
            console.error("Error fetching existing sub:", subError)
        }

        if (!sub) {
            let { data: company, error: companyError } = await serviceSupabase
                .from('companies')
                .select('id')
                .eq('owner_id', user.id)
                .maybeSingle()

            if (companyError) {
                console.error("Error fetching company:", companyError)
            }

            if (!company) {
                const { data: newCompany, error: createCompanyError } = await serviceSupabase
                    .from('companies')
                    .insert({
                        name: user.user_metadata?.store_name || "Minha Confeitaria",
                        owner_id: user.id
                    })
                    .select()
                    .single()

                if (createCompanyError) {
                    console.error("Error creating company:", createCompanyError)
                }
                company = newCompany
            }

            if (company) {
                const { data: newSub, error: createSubError } = await serviceSupabase
                    .from('subscriptions')
                    .insert({
                        user_id: user.id,
                        company_id: company.id,
                        plan_id: planId,
                        status: 'trial',
                        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
                    })
                    .select()
                    .single()

                if (createSubError) {
                    console.error("Error creating subscription:", createSubError)
                }
                sub = newSub
            }
        }

        if (!sub) {
            return NextResponse.json({
                error: "Falha ao encontrar ou criar assinatura local",
                details: "Não foi possível inicializar os dados da empresa e assinatura."
            }, { status: 500 })
        }

        // 4. Get or Create Stripe Price ID Automatically
        let priceId = billingCycle === 'annually' ? plan.stripe_price_id_annual : plan.stripe_price_id_monthly

        if (!priceId) {
            console.log(`[Stripe Migration] ID de preço ausente para ${plan.name} (${billingCycle}). Criando no Stripe...`)

            // 4a. Create or Find Product
            const product = await stripe.products.create({
                name: `DoceGestão Pro - ${plan.name}`,
                description: `Acesso completo ao plano ${plan.name}`,
                metadata: { planId: plan.id }
            })

            // 4b. Create Price
            const amount = billingCycle === 'annually' ? plan.price * 0.8 * 12 : plan.price
            const price = await stripe.prices.create({
                unit_amount: Math.round(amount * 100),
                currency: 'brl',
                recurring: {
                    interval: billingCycle === 'annually' ? 'year' : 'month',
                },
                product: product.id,
            })

            priceId = price.id

            // 4c. Update DB with Service Role
            const { createClient } = await import('@supabase/supabase-js')
            const serviceSupabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            )

            await serviceSupabase
                .from('plans')
                .update({
                    [billingCycle === 'annually' ? 'stripe_price_id_annual' : 'stripe_price_id_monthly']: priceId
                })
                .eq('id', plan.id)
        }

        const session = await stripe.checkout.sessions.create({
            billing_address_collection: 'required',
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${req.headers.get('origin')}/dashboard/billing?success=true`,
            cancel_url: `${req.headers.get('origin')}/dashboard/billing?canceled=true`,
            metadata: {
                userId: user.id,
                planId: plan.id,
                subscriptionId: sub?.id || ''
            },
            customer_email: user.email,
        })

        return NextResponse.json({ url: session.url })

    } catch (error: any) {
        console.error("Stripe Checkout Error:", error)
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}
