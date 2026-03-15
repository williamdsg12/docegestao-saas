const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  const tables = ['orders', 'menu_orders', 'menu_order_items', 'profiles', 'companies'];
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1).single();
      if (error) {
        console.log(`Table ${table} error:`, error.message);
      } else {
        console.log(`Columns in ${table}:`, Object.keys(data));
      }
    } catch (e) {
      console.log(`Table ${table} exception:`, e.message);
    }
  }
}

checkSchema();
