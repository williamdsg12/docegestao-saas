
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

async function compareTables() {
    console.log('--- Comparison: orders vs pedidos ---');
    const { data: orders } = await supabase.from('orders').select('*').limit(1);
    const { data: pedidos } = await supabase.from('pedidos').select('*').limit(1);
    console.log('Orders cols:', Object.keys(orders?.[0] || {}));
    console.log('Pedidos cols:', Object.keys(pedidos?.[0] || {}));

    console.log('\n--- Comparison: companies vs empresas ---');
    const { data: companies } = await supabase.from('companies').select('*').limit(1);
    const { data: empresas } = await supabase.from('empresas').select('*').limit(1);
    console.log('Companies cols:', Object.keys(companies?.[0] || {}));
    console.log('Empresas cols:', Object.keys(empresas?.[0] || {}));
}

compareTables();
