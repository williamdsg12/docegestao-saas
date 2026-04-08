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

        // IN A PRODUCTION APP:
        // 1. Validate data properly (zod was used in frontend, but backend should too)
        // 2. Call Tuna Merchant API to create the account
        // 3. Receive account_id, status, and tokens from Tuna
        
        // MOCK TUNA RESPONSE
        const tunaResponse = {
            account_id: `tuna_acc_${Math.random().toString(36).substring(7)}`,
            status: 'pending', // Initially pending for analysis
            access_token: `tuna_tok_${Math.random().toString(36).substring(7)}`,
            refresh_token: `tuna_ref_${Math.random().toString(36).substring(7)}`
        };

        // 4. Save/Update tuna_accounts in our database
        const { error: upsertError } = await supabaseAdmin
            .from('tuna_accounts')
            .upsert({
                tenant_id,
                tuna_account_id: tunaResponse.account_id,
                access_token: tunaResponse.access_token,
                refresh_token: tunaResponse.refresh_token,
                status: tunaResponse.status,
                connected: true,
                updated_at: new Date().toISOString()
            }, { 
                onConflict: 'tenant_id' 
            });

        if (upsertError) {
            console.error('Error saving tuna onboarding:', upsertError);
            throw upsertError;
        }

        // 5. Log the onboarding data (In a real app, maybe store full profile in a separate table)
        console.log(`Tuna Onboarding successfully initialized for ID: ${tunaResponse.account_id}`);

        return NextResponse.json({ 
            success: true, 
            account_id: tunaResponse.account_id,
            status: tunaResponse.status
        });

    } catch (error: any) {
        console.error('Tuna Onboarding Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
