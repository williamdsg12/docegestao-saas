import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const dynamic = 'force-dynamic'
import { getOrCreateAsaasCustomer, createAsaasPayment, createAsaasSubscription } from "@/lib/asaas"

/**
 * POST /api/checkout/asaas
 * Body: { planId: string, billingCycle: 'monthly' | 'annually' }
 */
export async function POST(req: Request) {
    try {
        const { planId, billingCycle } = await req.json()

        // 1. Get User from Session (In a real app, use getServerSession or equivalent)
        // Since we are using Supabase client directly, we need to verify the token
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: "User not found" }, { status: 401 })
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

        // 3. Get User's Subscription (or create if missing)
        let { data: sub } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .single()

        if (!sub) {
            // Get the company or create one
            let { data: company } = await supabase.from('companies').select('id').eq('owner_id', user.id).single()
            if (!company) {
                const { data: newCompany } = await supabase.from('companies').insert({
                    name: user.user_metadata?.store_name || 'Minha Confeitaria',
                    owner_id: user.id
                }).select().single()
                company = newCompany
            }

            if (company) {
                const { data: newSub } = await supabase.from('subscriptions').insert({
                    user_id: user.id,
                    company_id: company.id,
                    plan_id: planId,
                    status: 'trial',
                    trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
                }).select().single()
                sub = newSub
            }
        }

        if (!sub) {
            return NextResponse.json({ error: "Falha ao processar assinatura" }, { status: 500 })
        }

        // 4. Get or Create Asaas Customer
        const customer = await getOrCreateAsaasCustomer({
            email: user.email!,
            name: user.user_metadata?.full_name || user.email!,
            phone: user.user_metadata?.phone
        })

        // 5. Create Payment or Subscription in Asaas
        const price = billingCycle === 'annually' ? plan.price * 0.8 * 12 : plan.price
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 3)

        const payload = {
            customer: customer.id,
            billingType: 'UNDEFINED' as any,
            value: price,
            nextDueDate: dueDate.toISOString().split('T')[0],
            cycle: billingCycle === 'annually' ? 'YEARLY' : 'MONTHLY',
            externalReference: sub.id, // Use Subscription ID for webhook matching
            description: `Assinatura DoceGestão - Plano ${plan.name} (${billingCycle})`
        }

        // Create subscription
        const asaasSub = await createAsaasSubscription(payload as any)

        // 5. Return the invoice URL
        return NextResponse.json({
            invoiceUrl: asaasSub.invoiceUrl
        })

    } catch (error: any) {
        console.error("Checkout Error:", error)
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}
