const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log("Checking columns for recipes and ingredients...");
    const { data: rec, error: recErr } = await supabase.from('recipes').select('id, tenant_id').limit(1);
    const { data: ing, error: ingErr } = await supabase.from('ingredients').select('id, tenant_id').limit(1);
    
    if (recErr) console.log("Recipes Error:", recErr.message);
    else console.log("Recipes OK columns:", Object.keys(rec[0] || {}));
    
    if (ingErr) console.log("Ingredients Error:", ingErr.message);
    else console.log("Ingredients OK columns:", Object.keys(ing[0] || {}));
}

checkColumns();
