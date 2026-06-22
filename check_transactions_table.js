const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  const tables = ['transactions', 'financial_transactions', 'payments', 'orders', 'vendas'];
  
  for (const table of tables) {
    console.log(`\n=== Checking Table: ${table} ===`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table '${table}' error or does not exist:`, error.message);
    } else {
      console.log(`Table '${table}' exists. Columns:`, Object.keys(data[0] || {}));
    }
  }

  // Check RLS policies via pg_policies view using a custom query if available
  // Since run_sql is not available, let's try querying pg_policies through PostgREST 
  // (usually it is not exposed, but let's check).
  console.log("\n=== Checking pg_policies via PostgREST ===");
  const { data: policies, error: polErr } = await supabase.from('pg_policies').select('*').limit(5);
  if (polErr) {
    console.log("pg_policies is not exposed via API (expected under PostgREST).");
  } else {
    console.log("Policies count:", policies.length);
  }
}

inspect();
