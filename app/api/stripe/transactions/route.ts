import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getServerUser } from '@/lib/supabaseAuth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: settings } = await supabaseAdmin
      .from('payment_settings')
      .select('stripe_account_id')
      .eq('tenant_id', user.tenant_id)
      .single();

    if (!settings?.stripe_account_id) {
      return NextResponse.json({ error: 'Stripe account not found' }, { status: 404 });
    }

    // Listar as últimas 10 cobranças (charges)
    const charges = await stripe.charges.list({
      limit: 10,
      stripeAccount: settings.stripe_account_id,
    });

    return NextResponse.json({
      data: charges.data,
    });
  } catch (error: any) {
    console.error('[Stripe Transactions API] Erro:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
