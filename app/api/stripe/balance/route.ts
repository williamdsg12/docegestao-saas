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
      .single();

    if (!settings?.stripe_account_id) {
      return NextResponse.json({ error: 'Stripe account not found' }, { status: 404 });
    }

    // 2. Buscar saldo na Stripe para a conta conectada
    const balance = await stripe.balance.retrieve({
      stripeAccount: settings.stripe_account_id,
    });

    return NextResponse.json({
      available: balance.available,
      pending: balance.pending,
    });
  } catch (error: any) {
    console.error('[Stripe Balance API] Erro:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
