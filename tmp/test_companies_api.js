
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testCompaniesAPI() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing env vars');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('--- Testing Companies Fetch ---');
    const { data, error } = await supabase
        .from('companies')
        .select(`
            id,
            name,
            email,
            phone,
            status,
            created_at,
            plan_id,
            plans (
                name
            ),
            profiles:owner_id (
                owner_name,
                email
            )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching companies:', error);
    } else {
        console.log('Success! Fetched companies:');
        console.dir(data, { depth: null });
    }
}

testCompaniesAPI();
