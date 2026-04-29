import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { 
            tenant_id, 
            documentType, 
            documentNumber, 
            fullName, 
            motherName, 
            birthDate, 
            occupation, 
            website,
            cep,
            state,
            city,
            neighborhood,
            address,
            number,
            complement,
            bank,
            accountType,
            branch,
            account,
            pixType,
            pixKey,
            email,
            phone
        } = body;

        if (!tenant_id) {
            return NextResponse.json({ error: 'Missing tenant_id' }, { status: 400 });
        }

        console.log(`Starting Tuna Onboarding for tenant ${tenant_id}...`);

        // --- REAL PERSISTENCE LOGIC (Module 6) ---
        
        // 1. Save/Update Payment Account (Profile)
        const { error: accountError } = await supabaseAdmin
            .from('payment_accounts')
            .upsert({
                tenant_id,
                document_type: documentType,
                document_number: documentNumber,
                full_name: fullName,
                mother_name: motherName,
                birth_date: birthDate,
                occupation: occupation,
                website: website,
                email: email,
                phone: phone,
                updated_at: new Date().toISOString()
            }, { onConflict: 'tenant_id' });

        if (accountError) throw accountError;

        // 2. Save/Update Billing Address
        const { error: addressError } = await supabaseAdmin
            .from('payment_billing_addresses')
            .upsert({
                tenant_id,
                cep,
                state,
                city,
                neighborhood,
                address,
                number,
                complement,
                updated_at: new Date().toISOString()
            }, { onConflict: 'tenant_id' });

        if (addressError) throw addressError;

        // 3. Save/Update Bank Account
        const { error: bankError } = await supabaseAdmin
            .from('bank_accounts')
            .upsert({
                tenant_id,
                bank_code: bank,
                bank_name: 'Selected Bank', // In a real app, look up from our banks constant
                account_type: accountType,
                branch: branch,
                account_number: account,
                pix_type: pixType,
                pix_key: pixKey,
                updated_at: new Date().toISOString()
            }, { onConflict: 'tenant_id' });

        if (bankError) throw bankError;

        // 4. Update Onboarding Progress
        const { error: onboardingError } = await supabaseAdmin
            .from('payment_onboarding')
            .upsert({
                tenant_id,
                status: 'validating',
                current_step: 4,
                agreed_at: new Date().toISOString(),
                last_completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, { onConflict: 'tenant_id' });

        if (onboardingError) throw onboardingError;

        // 5. Update/Initialize Gateway Account (Tuna)
        const tunaResponse = {
            account_id: `tuna_acc_${Math.random().toString(36).substring(7)}`,
            status: 'pending'
        };

        const { error: tunaError } = await supabaseAdmin
            .from('tuna_accounts')
            .upsert({
                tenant_id,
                account_id: tunaResponse.account_id,
                status: tunaResponse.status,
                conectado: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'tenant_id' });

        if (tunaError) throw tunaError;

        // 6. Log Status Change
        await supabaseAdmin.from('payment_status_logs').insert({
            tenant_id,
            new_status: 'validating',
            reason: 'Onboarding financeiro concluído pelo usuário'
        });

        return NextResponse.json({ 
            success: true, 
            account_id: tunaResponse.account_id,
            status: tunaResponse.status
        });

    } catch (error: any) {
        console.error('Payment Onboarding Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

