const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectSchema() {
  console.log("--- INSPECTING CUSTOMERS TABLE ---");
  
  // List Columns
  const { data: cols, error: colErr } = await supabase.rpc('exec_sql', {
    sql_query: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'customers' AND table_schema = 'public'`
  });
  
  if (colErr) {
    console.error("Column RPC Error:", colErr.message);
  } else {
    console.log("Columns:", cols?.map(c => `${c.column_name} (${c.data_type})`).join(', '));
  }

  // List Constraints
  const { data: cons, error: conErr } = await supabase.rpc('exec_sql', {
    sql_query: `SELECT conname, pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid WHERE t.relname = 'customers' AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')`
  });

  if (conErr) {
    console.error("Constraint RPC Error:", conErr.message);
  } else {
    console.log("Constraints Found:");
    console.table(cons);
  }
}

inspectSchema();
