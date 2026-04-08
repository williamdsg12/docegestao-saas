require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkColumns() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.error('Error fetching profiles:', error.message);
    return;
  }
  if (data && data.length > 0) {
    const columns = Object.keys(data[0]);
    console.log('Available columns in profiles:', columns.join(', '));
    
    const missing = ['trial_ends_at', 'plan', 'subscription_status'].filter(col => !columns.includes(col));
    if (missing.length > 0) {
      console.log('Missing columns:', missing.join(', '));
    } else {
      console.log('All required columns exist!');
    }
  } else {
    console.log('No profiles found to check columns.');
  }
}

checkColumns();
