
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

async function listAllTables() {
    // Try to list all tables using a known technique: querying information_schema if enabled, 
    // or just checking common names.
    // Since we don't have exec_sql, we can't easily query information_schema.
    // I'll try to check if there are any other common names.
    const commonNames = [
        'invoices', 'billing', 'transactions', 'wallet', 'ledger',
        'affiliates', 'affiliate_requests', 'tickets', 'support_tickets',
        'usage_logs', 'audit_logs', 'admin_logs', 'tenants'
    ];
    
    console.log('--- Searching for more tables ---');
    for (const name of commonNames) {
        const { error } = await supabase.from(name).select('*', { count: 'exact', head: true }).limit(1);
        if (!error) {
            console.log(`Table found: ${name}`);
        }
    }
}

listAllTables();
