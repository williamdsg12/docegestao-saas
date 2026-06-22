const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  console.log("=== Inspecting public.customers ===");
  const { data: custData, error: custErr } = await supabase
    .from('customers')
    .select('*')
    .limit(1);
  if (custErr) {
    console.error("Error customers:", custErr);
  } else {
    console.log("Customers rows count > 0:", custData.length > 0);
  }

  // Query database schema
  const { data: cols, error: colsErr } = await supabase
    .rpc('execute_sql', {
      sql_query: "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name IN ('customers', 'menu_products', 'orders') ORDER BY table_name, column_name;"
    });

  if (colsErr) {
    console.log("Could not run execute_sql. Trying to get columns via query...");
    const { data: cols2, error: colsErr2 } = await supabase
      .from('menu_products')
      .select('company_id')
      .limit(1);
    console.log("Querying company_id from menu_products:", colsErr2 ? colsErr2.message : "Success");
  } else {
    console.log("Columns from information_schema:");
    console.log(cols);
  }
}

inspect();
