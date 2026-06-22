const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: policies, error } = await supabaseAdmin.rpc('run_sql', {
    sql_query: "SELECT tablename, policyname, roles, cmd, qual, with_check FROM pg_policies WHERE tablename IN ('orders', 'customers', 'addresses');"
  });
  
  if (error) {
    // If run_sql is not found, we can try querying using a REST query fallback or checking information_schema
    console.log("RPC run_sql failed:", error.message);
    
    // We can list policies by querying a custom view or another way if we have psql. 
    // Since we don't have direct SQL run, we can write a node pg script if we had connection parameters.
    // Wait, let's look at the output of the query from supabase system tables if possible.
  } else {
    console.log("Policies:", JSON.stringify(policies, null, 2));
  }
}

check();
