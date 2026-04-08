const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const tables = ['payments', 'subscriptions', 'pedidos', 'empresas', 'billing', 'invoices'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table '${table}': ERROR - ${error.message}`);
    } else {
      console.log(`Table '${table}': EXISTS (${data.length} records)`);
      if (data.length > 0) {
        console.log(`Columns: ${Object.keys(data[0]).join(', ')}`);
      }
    }
  }
}

checkTables();
