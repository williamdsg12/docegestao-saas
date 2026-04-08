
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function parseEnv() {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
        }
    });
    return env;
}

const env = parseEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('--- Payments Data ---');
    const { data: payments } = await supabase.from('payments').select('*');
    console.log(JSON.stringify(payments, null, 2));
    
    console.log('--- Subscriptions Data ---');
    const { data: subs } = await supabase.from('subscriptions').select('*');
    console.log(JSON.stringify(subs, null, 2));

    console.log('--- Profiles/Admin check ---');
    const { data: admins } = await supabase.from('profiles').select('id, email, is_admin, role').eq('is_admin', true);
    console.log('Admins found:', admins?.length || 0);
}

checkData();
