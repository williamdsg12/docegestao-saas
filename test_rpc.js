const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Calling execute_sql with test query...");
  const res1 = await supabase.rpc('execute_sql', { sql_query: "SELECT 1 as test;" });
  console.log("execute_sql response:", JSON.stringify(res1, null, 2));

  console.log("Calling exec_sql with test query...");
  const res2 = await supabase.rpc('exec_sql', { sql_query: "SELECT 1 as test;" });
  console.log("exec_sql response:", JSON.stringify(res2, null, 2));

  console.log("Calling run_sql with test query...");
  const res3 = await supabase.rpc('run_sql', { sql_query: "SELECT 1 as test;" });
  console.log("run_sql response:", JSON.stringify(res3, null, 2));
}

test();
