const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log('--- RELATIONS IN PUBLIC ---');
  // Try to list tables and their types using a different method if rpc fails
  // Since rpc('exec_sql') failed before, I'll try to find the real table name by trying 'empresas'
  
  const tables = ['companies', 'empresas', 'profiles', 'tenants'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table "${t}" error:`, error.message);
    } else {
      console.log(`Table "${t}" found! Rows:`, data.length);
      if (data.length > 0) console.log(`Keys:`, Object.keys(data[0]));
    }
  }
}

check();
