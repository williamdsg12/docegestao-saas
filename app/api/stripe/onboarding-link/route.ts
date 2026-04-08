import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getServerUser } from '@/lib/supabaseAuth'

export async function POST(req: Request) {
    try {
        const user = await getServerUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { account_id } = await req.json()
        if (!account_id) {
            return NextResponse.json({ error: 'account_id is required' }, { status: 400 })
        }

        const { ensureHttps } = await import('@/lib/stripe-helpers')
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        
        const accountLink = await stripe.accountLinks.create({
            account: account_id,
            refresh_url: ensureHttps(`${baseUrl}/stripe/refresh?account_id=${account_id}`),
            return_url: ensureHttps(`${baseUrl}/stripe/success`),
            type: 'account_onboarding',
        })

        return NextResponse.json({ url: accountLink.url })

    } catch (error: any) {
        console.error('[Stripe Connect] Erro ao gerar link:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
