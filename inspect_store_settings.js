const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('store_settings').select('*').limit(1);
  if (error) {
    console.error('Error fetching store_settings:', error.message);
  } else {
    console.log('Columns for store_settings:', Object.keys(data[0] || {}));
    console.log('Sample store_settings:', data[0]);
  }
}
check();
