const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function enableRealtime() {
  console.log("Enabling Realtime for 'orders' table...");
  const { data, error } = await supabase.rpc('enable_realtime_for_table', { table_name: 'orders' });
  if (error) {
    console.error("Error enabling realtime via RPC:", error);
    console.log("Trying manual SQL via direct query if possible (usually not allowed via client, but some setups allow rpc 'exec_sql')...");
  } else {
    console.log("Realtime enabled successfully via RPC.");
  }

  // Also check if we can add it to the publication manually
  // This is often needed in Supabase
  console.log("Adding 'orders' to 'supabase_realtime' publication...");
  const { error: pubError } = await supabase.rpc('add_to_realtime_publication', { table_name: 'orders' });
  if (pubError) {
    console.log("Add to publication RPC failed, might already be there or requires manual SQL in Supabase dashboard.");
  } else {
    console.log("Added to publication successfully.");
  }
}

enableRealtime();
