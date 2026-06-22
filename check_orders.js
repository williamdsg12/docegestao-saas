const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log("Checking table 'orders'...");
  const { data, error } = await supabase.from('orders').select('*').limit(1);
  if (error) {
    console.error("Error fetching orders:", error);
  } else {
    console.log("Orders columns:", Object.keys(data[0] || {}));
  }

  console.log("\nChecking publication for realtime...");
  const { data: pub, error: pubErr } = await supabase.rpc('check_realtime_status');
  if (pubErr) {
    // If RPC doesn't exist, try raw SQL if possible, but let's just check if we can subscribe
    console.log("RPC check_realtime_status not found. Trying to see if 'orders' is in supabase_realtime publication...");
    const { data: rel, error: relErr } = await supabase.from('pg_publication_tables').select('*').eq('pubname', 'supabase_realtime').eq('tablename', 'orders');
    if (relErr) console.error("Error checking publication:", relErr);
    else console.log("Publication status for 'orders':", rel);
  } else {
    console.log("Realtime status:", pub);
  }
}

check();
