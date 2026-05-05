const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkOrders() {
  console.log("Fetching last 5 orders...");
  const { data, error } = await supabase.from('orders').select('id, tenant_id, order_status, created_at').order('created_at', { ascending: false }).limit(5);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Recent Orders:", data);
  }

  console.log("\nFetching tenants...");
  const { data: tenants } = await supabase.from('tenants').select('id, name').limit(5);
  console.log("Tenants:", tenants);
}

checkOrders();
