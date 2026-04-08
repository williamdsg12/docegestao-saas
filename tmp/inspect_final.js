const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectFinal() {
  const tables = ['profiles', 'tenants', 'customers', 'orders', 'menu_orders'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
        console.log(`Table '${table}' error:`, error.message);
    } else if (data.length > 0) {
        console.log(`Table '${table}' columns:`, Object.keys(data[0]));
    } else {
        console.log(`Table '${table}' exists but is empty.`);
    }
  }
}

inspectFinal();
