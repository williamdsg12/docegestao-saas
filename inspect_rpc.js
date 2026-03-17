const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectRPC() {
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT routine_definition FROM information_schema.routines WHERE routine_name = 'refresh_dashboard_stats' AND routine_schema = 'public'" 
  });
  
  if (error) {
    console.error("Error inspecting RPC:", error.message);
  } else {
    console.log("RPC Definition:");
    console.log(data?.[0]?.routine_definition || "Not found");
  }
}

inspectRPC();
