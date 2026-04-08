
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

async function inspectMore() {
    const tables = ['invoices', 'billing', 'tenants', 'transactions'];
    console.log('--- More Table Inspection ---');
    
    for (const table of tables) {
        try {
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: false })
                .limit(1);
            
            if (error) {
                console.log(`[${table}] Error: ${error.message}`);
                continue;
            }
            
            console.log(`[${table}] Count: ${count}`);
            if (data && data.length > 0) {
                console.log(`[${table}] Columns: ${Object.keys(data[0]).join(', ')}`);
            } else {
                console.log(`[${table}] No data to inspect columns.`);
            }
        } catch (e) {
            console.log(`[${table}] Exception: ${e.message}`);
        }
    }
}

inspectMore();
