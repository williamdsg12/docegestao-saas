const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log("--- Orders Sample ---");
    const { data: orders, error: oError } = await supabase.from('orders').select('*').limit(5);
    console.log(JSON.stringify(orders, null, 2));

    console.log("--- Order Items Sample ---");
    const { data: items, error: iError } = await supabase.from('order_items').select('*').limit(5);
    console.log(JSON.stringify(items, null, 2));

    console.log("--- Customers Sample ---");
    const { data: customers, error: cError } = await supabase.from('customers').select('*').limit(5);
    console.log(JSON.stringify(customers, null, 2));
}

checkData();
