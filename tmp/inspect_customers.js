const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectCustomers() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const userId = users?.users?.[0]?.id;

  // Try to find a real tenant ID
  const { data: profiles } = await supabase.from('profiles').select('tenant_id').limit(1);
  const tenantId = profiles?.[0]?.tenant_id;

  console.log("Using Tenant ID for test:", tenantId);

  // Try to insert with just these two
  const { data: inserted, error: insertError } = await supabase
    .from('customers')
    .upsert({ tenant_id: tenantId, phone: '123456789' }, { onConflict: 'tenant_id,phone' })
    .select('*')
  
  if (insertError) {
    console.err("Insert failed:", insertError.message, insertError.details);
    // If it says "no unique constraint", it confirms the issue
  } else {
    console.log("COLUMNS FOUND:", Object.keys(inserted[0]));
  }
}

inspectCustomers();
