import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getServerUser } from '@/lib/supabaseAuth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { ensureHttps } from '@/lib/stripe-helpers';

/**
 * POST /api/stripe/connect/onboarding
 * 1. Verifica se o tenant já possui stripe_account_id
 * 2. Se não existir, valida a plataforma e cria a conta Express
 * 3. Gera o Account Link (Onboarding Link) da Stripe
 */
export async function POST() {
    try {
        const user = await getServerUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 1. Buscar o perfil para pegar o tenant_id
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single();

        if (!profile?.tenant_id) {
            return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
        }

        const tenantId = profile.tenant_id;

        // 2. Verificar se já existe uma conta Stripe vinculada
        const { data: settings } = await supabaseAdmin
            .from('payment_settings')
            .select('stripe_account_id')
            .eq('tenant_id', tenantId)
            .maybeSingle();

        let stripeAccountId = settings?.stripe_account_id;

        // 3. Criar conta se não existir
        if (!stripeAccountId) {
            // 3a. Validar conta da PLATAFORMA (Connect ativa na Stripe)
            try {
                const platformAccount = await stripe.accounts.retrieve();
                if (!platformAccount.capabilities?.card_payments || !platformAccount.capabilities?.transfers) {
                    return NextResponse.json({ 
                        error: 'É necessário finalizar a configuração da plataforma Stripe antes de ativar pagamentos.' 
                    }, { status: 400 });
                }
            } catch (e: any) {
                console.error('[Stripe Platform Guard] Erro:', e.message);
                return NextResponse.json({ 
                    error: 'É necessário finalizar a configuração da plataforma Stripe antes de ativar pagamentos.' 
                }, { status: 400 });
            }

            // 3b. Criar Connected Account (Express)
            const account = await stripe.accounts.create({
                type: 'express',
                country: 'BR',
                email: user.email,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                business_type: 'individual',
                tos_acceptance: { service_agreement: 'full' },
            });

            stripeAccountId = account.id;

            // 3c. Salvar no banco
            await supabaseAdmin
                .from('payment_settings')
                .upsert({
                    tenant_id: tenantId,
                    stripe_account_id: stripeAccountId,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'tenant_id' });
        }

        // 4. Gerar o Account Link para Onboarding (Hospedado na Stripe)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        
        try {
            const accountLink = await stripe.accountLinks.create({
                account: stripeAccountId,
                refresh_url: ensureHttps(`${baseUrl}/dashboard/financeiro/pagamentos?stripe_refresh=true`),
                return_url: ensureHttps(`${baseUrl}/dashboard/financeiro/pagamentos?stripe_success=true`),
                type: 'account_onboarding',
            });
            return NextResponse.json({ url: accountLink.url });
        } catch (linkError: any) {
            // Se a conta não existe mais ou não está conectada (ex: trocou de chave Test/Live)
            if (linkError.message.includes('not connected') || linkError.message.includes('No such account')) {
                console.warn('[Stripe Onboarding] Conta inválida no banco, tentando recriar...');
                
                // Recriar conta
                const newAccount = await stripe.accounts.create({
                    type: 'express',
                    country: 'BR',
                    email: user.email,
                    capabilities: {
                        card_payments: { requested: true },
                        transfers: { requested: true },
                    },
                    business_type: 'individual',
                    tos_acceptance: { service_agreement: 'full' },
                });

                // Atualizar banco
                await supabaseAdmin
                    .from('payment_settings')
                    .update({ 
                        stripe_account_id: newAccount.id,
                        updated_at: new Date().toISOString()
                    })
                    .eq('tenant_id', tenantId);

                // Gerar novo link
                const newLink = await stripe.accountLinks.create({
                    account: newAccount.id,
                    refresh_url: ensureHttps(`${baseUrl}/dashboard/financeiro/pagamentos?stripe_refresh=true`),
                    return_url: ensureHttps(`${baseUrl}/dashboard/financeiro/pagamentos?stripe_success=true`),
                    type: 'account_onboarding',
                });

                return NextResponse.json({ url: newLink.url });
            }
            throw linkError; // Relançar se for outro erro
        }

    } catch (error: any) {
        console.error('[Stripe Onboarding API] Erro:', error.message);

        // Tratar erro específico de configuração de Perdas (Liability)
        if (error.message.includes('managing losses')) {
            return NextResponse.json({ 
                error: '⚠️ Painel Stripe: Você precisa confirmar quem é responsável por perdas (Chargebacks).',
                action_url: 'https://dashboard.stripe.com/settings/connect/platform-profile'
            }, { status: 400 });
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
