const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log("Listing more possible tables...");
    const tables = ['product_ingredients', 'recipe_items', 'production_items', 'stock', 'inventory', 'insumos_estoque', 'materiais'];
    
    for (const table of tables) {
        const { error } = await supabase.from(table).select('count').limit(0);
        if (!error) {
            console.log(`Table '${table}' EXISTS`);
        } else {
            // console.log(`Table '${table}' NOT FOUND (${error.message})`);
        }
    }
}

listTables();
