const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = ['orders', 'pedidos', 'order_items', 'customers', 'products', 'payments', 'companies', 'addresses'];

async function inspectTables() {
    for (const table of tables) {
        console.log(`--- Inspecting ${table} ---`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`Error fetching ${table}:`, error.message);
        } else if (data && data.length > 0) {
            console.log(`Columns for ${table}:`, Object.keys(data[0]));
        } else {
            // Try to find if table exists by doing a select limit 0
            const { error: existError } = await supabase.from(table).select('*').limit(0);
            if (existError) {
                console.log(`Table ${table} might not exist.`);
            } else {
                console.log(`Table ${table} exists but is empty.`);
            }
        }
    }
}

inspectTables();
