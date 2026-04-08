const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    const list = ['customers', 'addresses', 'products', 'orders', 'order_items', 'pedidos', 'itens_pedido', 'menu_products', 'menu_orders'];
    console.log("Checking table existence and basic structure...");
    
    for (const table of list) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`Table '${table}': NOT FOUND or error: ${error.message}`);
        } else {
            console.log(`Table '${table}': EXISTS`);
            if (data && data.length > 0) {
                console.log(`  Columns found: ${Object.keys(data[0]).join(', ')}`);
            }
        }
    }
}

checkTables();
