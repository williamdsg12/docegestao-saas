import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getServerUser } from '@/lib/supabaseAuth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1a. Buscar o perfil para pegar o tenant_id
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }

    // 1b. Buscar stripe_account_id do tenant
    const { data: settings } = await supabaseAdmin
      .from('payment_settings')
      .select('stripe_account_id')
      .eq('tenant_id', profile.tenant_id)
      .maybeSingle();

    if (!settings?.stripe_account_id) {
      return NextResponse.json({ status: 'pendente' });
    }

    // 2. Buscar conta na Stripe diretamente
    const account = await stripe.accounts.retrieve(settings.stripe_account_id);

    // 3. Lógica de Status Automática
    let status = 'incompleto';
    let details = '';

    const chargesEnabled = account.charges_enabled;
    const payoutsEnabled = account.payouts_enabled;
    const currentlyDue = account.requirements?.currently_due || [];
    const pendingVerification = account.requirements?.pending_verification || [];

    if (chargesEnabled && payoutsEnabled) {
      status = 'ativo';
    } else if (currentlyDue.length > 0) {
      status = 'restrito';
      details = `Ação Requerida: ${currentlyDue.join(', ')}`;
    } else if (pendingVerification.length > 0) {
      status = 'em análise';
      details = 'A Stripe está analisando seus documentos.';
    } else if (account.details_submitted) {
      status = 'pendente'; // Processando ou falta algo minor
    }

    // Sincronizar com o banco de dados
    await supabaseAdmin
      .from('payment_settings')
      .update({
        stripe_charges_enabled: chargesEnabled,
        stripe_payouts_enabled: payoutsEnabled,
        stripe_account_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_account_id', account.id);

    return NextResponse.json({
      status,
      details,
      account_id: account.id,
      charges_enabled: chargesEnabled,
      payouts_enabled: payoutsEnabled,
      requirements: account.requirements
    });

  } catch (error: any) {
    console.error('[Stripe Status API] Erro:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
