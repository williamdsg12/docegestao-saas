const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('order_items').select('*').limit(3);
  if (error) {
    console.error('Error fetching order_items:', error.message);
  } else {
    console.log('Sample order_items data:', data);
  }
}
check();
