const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log("--- Products Sample ---");
    const { data: products, error: pError } = await supabase.from('products').select('*').limit(5);
    if (pError) console.error("Error fetching products:", pError.message);
    else console.log(JSON.stringify(products, null, 2));
}

checkData();
