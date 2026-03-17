const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log("--- SEARCHING FOR 'empresa_id' IN DATABASE METADATA ---");

  const query = `
    SELECT 'policy' as type, policyname as name, tablename as context, definition as detail
    FROM pg_policies 
    WHERE definition ILIKE '%empresa_id%'
    UNION ALL
    SELECT 'trigger' as type, trigger_name as name, event_object_table as context, action_statement as detail
    FROM information_schema.triggers 
    WHERE action_statement ILIKE '%empresa_id%'
    UNION ALL
    SELECT 'function' as type, routine_name as name, routine_schema as context, routine_definition as detail
    FROM information_schema.routines 
    WHERE routine_definition ILIKE '%empresa_id%' AND routine_schema = 'public'
    UNION ALL
    SELECT 'column' as type, column_name as name, table_name as context, data_type as detail
    FROM information_schema.columns 
    WHERE column_name = 'empresa_id' AND table_schema = 'public'
  `;

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
  
  if (error) {
    console.error("Error executing inspection:", error.message);
  } else {
    if (data && data.length > 0) {
      console.log("FOUND LINGERING REFERENCES:");
      console.table(data);
    } else {
      console.log("No lingering references to 'empresa_id' found in policies, triggers, functions, or columns.");
    }
  }

  // Also check column names for 'pedidos' specifically
  const { data: cols, error: colErr } = await supabase.rpc('exec_sql', {
    sql_query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'pedidos' AND table_schema = 'public'`
  });
  
  if (cols) {
    console.log("\nCurrent columns in 'pedidos' table:");
    console.log(cols.map(c => c.column_name).join(', '));
  }
}

inspect();
