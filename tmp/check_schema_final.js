const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log("Checking columns for receitas and ingredientes...");
    const { data: rec, error: recErr } = await supabase.from('receitas').select('id, tenant_id, company_id').limit(1);
    const { data: ing, error: ingErr } = await supabase.from('ingredientes').select('id, tenant_id, company_id').limit(1);
    
    if (recErr) console.log("Receitas Error:", recErr.message);
    else console.log("Receitas OK columns:", Object.keys(rec[0] || {}));
    
    if (ingErr) console.log("Ingredientes Error:", ingErr.message);
    else console.log("Ingredientes OK columns:", Object.keys(ing[0] || {}));
}

checkColumns();
