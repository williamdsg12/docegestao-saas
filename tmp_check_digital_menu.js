const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env', 'utf8');
const envUrl = envFile.split('\n').find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL')).split('=')[1].trim();
const envKey = envFile.split('\n').find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY')).split('=')[1].trim();
// Use the service role key to bypass RLS for schema inspection
const envService = envFile.split('\n').find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY')).split('=')[1].trim();

const supabase = createClient(envUrl, envService); // Use service_role to bypass RLS

async function check() {
  console.log("Checking digital_menu_settings...");
  
  // Try to insert a dummy row to see what columns exist or if there's a constraint issue
  const { data, error } = await supabase
    .from('digital_menu_settings')
    .insert({
      company_id: '11111111-1111-1111-1111-111111111111',
      store_name: 'Test Store'
    })
    .select();

  if (error) {
    console.error("Insert Error:", error.message, error.details || '', error.hints || '');
  } else {
    console.log("Insert Success! Columns:", Object.keys(data[0]));
    
    // Cleanup
    await supabase.from('digital_menu_settings').delete().eq('company_id', '11111111-1111-1111-1111-111111111111');
  }
}

check();
