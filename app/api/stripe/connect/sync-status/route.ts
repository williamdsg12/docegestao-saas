import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getServerUser } from '@/lib/supabaseAuth';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/stripe/connect/sync-status
 * 1. Recupera o status atual da conta na Stripe
 * 2. Sincroniza os novos campos arquiteturais (charges, payouts, details)
 * 3. Retorna o status amigável para o Dashboard
 */
export async function POST() {
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }

    const { data: settings } = await supabaseAdmin
      .from('payment_settings')
      .select('stripe_account_id')
      .eq('tenant_id', profile.tenant_id)
      .maybeSingle();

    if (!settings?.stripe_account_id) {
      return NextResponse.json({ status: 'pendente' });
    }

    // 1. Recuperar conta na Stripe
    let account;
    try {
      account = await stripe.accounts.retrieve(settings.stripe_account_id);
    } catch (retrieveError: any) {
      if (retrieveError.message.includes('not connected') || retrieveError.message.includes('No such account')) {
        console.warn('[Stripe Sync] Conta não encontrada na Stripe:', settings.stripe_account_id);
        return NextResponse.json({ status: 'pendente' });
      }
      throw retrieveError;
    }

    // 2. Lógica de Status Amigável
    let status = 'incompleto';
    let details = '';

    const chargesEnabled = account.charges_enabled;
    const payoutsEnabled = account.payouts_enabled;
    const detailsSubmitted = account.details_submitted;
    const currentlyDue = account.requirements?.currently_due || [];
    const pendingVerification = account.requirements?.pending_verification || [];

    if (chargesEnabled && payoutsEnabled) {
      status = 'ativo';
    } else if (currentlyDue.length > 0) {
      status = 'restrito';
    } else if (pendingVerification.length > 0) {
      status = 'em análise';
      details = 'A Stripe está analisando seus documentos.';
    } else if (detailsSubmitted) {
      status = 'pendente'; 
    }

    // 3. Sincronização com o Banco de Dados
    await supabaseAdmin
      .from('payment_settings')
      .update({
        stripe_charges_enabled: chargesEnabled,
        stripe_payouts_enabled: payoutsEnabled,
        stripe_details_submitted: detailsSubmitted,
        stripe_onboarding_complete: detailsSubmitted && currentlyDue.length === 0,
        stripe_account_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_account_id', account.id);

    return NextResponse.json({
      status,
      details,
      account, // Mantendo o objeto account para compatibilidade com o mapper no frontend
      requirements: account.requirements
    });

  } catch (error: any) {
    console.error('[Stripe Sync API] Erro:', error.message);
    
    // Tratamento de Erro de 'managing losses' (Liability)
    if (error.message.includes('managing losses')) {
      return NextResponse.json({ 
        status: 'erro_configuracao',
        error: 'Painel Stripe: Pendência de configuração de responsabilidade financeira.',
        action_url: 'https://dashboard.stripe.com/settings/connect/platform-profile'
      });
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
