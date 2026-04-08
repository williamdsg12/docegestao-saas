
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
    console.log('--- Database Table Audit ---');
    // Supabase doesn't have a direct "list tables" method in the JS client without RPC or direct SQL
    // But we can try to query the information_schema via a trick or just test if common names work
    
    const tablesToTest = [
        'users', 'profiles', 'usuarios',
        'companies', 'empresas', 'tenants',
        'orders', 'pedidos', 'vendas',
        'subscriptions', 'assinaturas', 'planos',
        'payments', 'pagamentos', 'financeiro'
    ];

    for (const table of tablesToTest) {
        const { error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .limit(1);
        
        if (!error) {
            console.log(`[EXISTE] ${table} (${count} registros)`);
        } else if (error.code === '42P01') {
            // Table doesn't exist
            // console.log(`[MISSING] ${table}`);
        } else {
            console.log(`[ERROR] ${table}: ${error.message} (${error.code})`);
        }
    }
}

listAllTables();
