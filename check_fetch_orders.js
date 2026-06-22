const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testFetch() {
  console.log("Fetching orders with the exact frontend select query...");
  const { data, error } = await supabase
      .from('orders')
      .select(`
          *,
          customers (*),
          addresses!address_id(*),
          order_items(*),
          payments(
              *,
              payment_cash(*)
          )
      `)
      .eq('tenant_id', 'c6338126-ec7d-4808-966a-b9d7a3e2281a')
      .order('created_at', { ascending: false })
      .limit(100);

  if (error) {
    console.error("Error fetching orders:", JSON.stringify(error, null, 2));
  } else {
    console.log("Success! Fetched orders count:", data.length);
    console.log("Sample order:", JSON.stringify(data[0], null, 2));
  }
}

testFetch();
