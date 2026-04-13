import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabaseAuth';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/stripe/connect/reset
 * Remove o vínculo com a conta Stripe atual no banco de dados.
 * Permite que o usuário reinicie o processo de onboarding do zero.
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

        // 2. Resetar todos os campos da Stripe no banco
        const { error } = await supabaseAdmin
            .from('payment_settings')
            .update({
                stripe_account_id: null,
                stripe_onboarding_complete: false,
                stripe_charges_enabled: false,
                stripe_payouts_enabled: false,
                stripe_details_submitted: false,
                stripe_account_status: null,
                updated_at: new Date().toISOString()
            })
            .eq('tenant_id', profile.tenant_id);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[Stripe Reset API] Erro:', error.message);
        return NextResponse.json({ error: 'Erro ao resetar configurações Stripe' }, { status: 500 });
    }
}
