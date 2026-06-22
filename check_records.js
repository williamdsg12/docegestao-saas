const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function check() {
  const orderId = 'bbd2a1d3-7583-4fcb-9b42-f3515ff5a503';
  console.log("Checking order:", orderId);
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
    
  if (orderErr) {
    console.error("Order error:", orderErr);
    return;
  }
  
  console.log("Order customer_id:", order.customer_id);
  console.log("Order address_id:", order.address_id);
  
  const { data: customer, error: custErr } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('id', order.customer_id)
    .maybeSingle();
    
  console.log("Customer record:", customer, custErr ? custErr.message : "Success");
  
  const { data: address, error: addrErr } = await supabaseAdmin
    .from('addresses')
    .select('*')
    .eq('id', order.address_id)
    .maybeSingle();
    
  console.log("Address record:", address, addrErr ? addrErr.message : "Success");
}

check();
