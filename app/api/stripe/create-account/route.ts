import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getServerUser } from '@/lib/supabaseAuth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
    try {
        const user = await getServerUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 1. Buscar o perfil para pegar o tenant_id
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (profileError || !profile?.tenant_id) {
            return NextResponse.json({ error: 'Perfil ou Tenant não encontrado' }, { status: 404 })
        }

        const tenantId = profile.tenant_id

        // 2a. Validar conta da PLATAFORMA (Connect ativa na Stripe)
        try {
            const platformAccount = await stripe.accounts.retrieve()
            if (!platformAccount.capabilities?.card_payments || !platformAccount.capabilities?.transfers) {
                return NextResponse.json({ 
                    error: 'É necessário finalizar a configuração da plataforma Stripe antes de ativar pagamentos.' 
                }, { status: 400 })
            }
        } catch (e: any) {
            console.error('[Stripe Platform] Erro ao validar plataforma:', e.message)
            return NextResponse.json({ 
                error: 'É necessário finalizar a configuração da plataforma Stripe antes de ativar pagamentos.' 
            }, { status: 400 })
        }

        // 2b. Verificar se já existe uma conta Stripe no payment_settings
        const { data: settings, error: settingsError } = await supabaseAdmin
            .from('payment_settings')
            .select('stripe_account_id')
            .eq('tenant_id', tenantId)
            .maybeSingle()

        if (settings?.stripe_account_id) {
            return NextResponse.json({ account_id: settings.stripe_account_id })
        }

        // 3. Criar conta Express na Stripe
        const account = await stripe.accounts.create({
            type: 'express',
            country: 'BR',
            email: user.email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            business_type: 'individual',
            tos_acceptance: {
                service_agreement: 'full',
            },
        })

        // 4. Salvar no banco (UPSERT para garantir que exista o registro)
        const { error: upsertError } = await supabaseAdmin
            .from('payment_settings')
            .upsert({
                tenant_id: tenantId,
                stripe_account_id: account.id,
                stripe_onboarding_complete: false,
                stripe_charges_enabled: false,
                updated_at: new Date().toISOString()
            }, { onConflict: 'tenant_id' })

        if (upsertError) {
            console.error('[Stripe Connect] Erro ao salvar account_id:', upsertError)
            return NextResponse.json({ error: 'Erro ao salvar dados da conta' }, { status: 500 })
        }

        return NextResponse.json({ account_id: account.id })

    } catch (error: any) {
        console.error('[Stripe Connect] Erro ao criar conta:', error.message)
        
        // Tratar erro específico de configuração de Perdas (Liability)
        if (error.message.includes('managing losses')) {
            return NextResponse.json({ 
                error: '⚠️ Bloqueio de Configuração: Você precisa confirmar quem é responsável por perdas (Chargebacks) no seu Painel Stripe.',
                action_url: 'https://dashboard.stripe.com/settings/connect/platform-profile',
                instruction: 'Acesse o link acima e selecione que as "Contas Conectadas" são responsáveis por perdas.'
            }, { status: 400 })
        }

        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
