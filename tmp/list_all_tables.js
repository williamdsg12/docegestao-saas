const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log("Listing all tables in public schema...");
    // We can't query information_schema directly with Supabase client (usually)
    // But we can try to guess or use a common table.
    // Let's try to fetch from a known table and check if it exists first.
    
    const tables = ['tenants', 'profiles', 'customers', 'orders', 'products', 'product_categories', 'ingredients', 'recipes', 'receitas', 'ingredientes', 'insumos', 'estoque'];
    
    for (const table of tables) {
        const { error } = await supabase.from(table).select('count').limit(0);
        if (!error) {
            console.log(`Table '${table}' EXISTS`);
        } else {
            console.log(`Table '${table}' NOT FOUND (${error.message})`);
        }
    }
}

listTables();
