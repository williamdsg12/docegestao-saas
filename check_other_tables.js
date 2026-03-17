const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking 'profiles'...");
  const { data: pData } = await supabase.from('profiles').select('*').limit(1);
  if (pData && pData.length > 0) console.log("Profiles columns:", Object.keys(pData[0]));

  console.log("\nChecking 'empresas'...");
  const { data: eData } = await supabase.from('empresas').select('*').limit(1);
  if (eData && eData.length > 0) console.log("Empresas columns:", Object.keys(eData[0]));
}

check();
