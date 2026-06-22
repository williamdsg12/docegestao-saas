const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const tenantId = 'c6338126-ec7d-4808-966a-b9d7a3e2281a';
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_status, company_id, tenant_id')
    .eq('tenant_id', tenantId);

  if (error) {
    console.error(error);
    return;
  }

  const counts = {};
  data.forEach(o => {
    counts[o.order_status] = (counts[o.order_status] || 0) + 1;
  });

  console.log(`Total orders for tenant ${tenantId}:`, data.length);
  console.log('Order status counts:', counts);
  console.log('Sample rows:', data.slice(0, 10));
}

check();
