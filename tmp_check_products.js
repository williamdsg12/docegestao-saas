const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env', 'utf8');
const envUrl = envFile.split('\n').find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL')).split('=')[1].trim();
const envKey = envFile.split('\n').find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY')).split('=')[1].trim();
const envService = envFile.split('\n').find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY')).split('=')[1].trim();

const supabase = createClient(envUrl, envService);

async function check() {
  const { data, error } = await supabase
    .from('menu_products')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Columns:", Object.keys(data[0] || {}));
  }
}

check();
