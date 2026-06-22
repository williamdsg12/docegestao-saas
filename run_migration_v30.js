const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars (URL or SERVICE_ROLE_KEY)");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndApply() {
  console.log("Checking database schema for public.message_logs...");
  
  const { error } = await supabase.from('message_logs').select('*').limit(1);
  if (error && error.message.includes('Could not find the table')) {
    console.log("⚠️ Table public.message_logs does NOT exist yet.");
    console.log("\n======================================================================");
    console.log("AÇÃO MANUAL REQUERIDA:");
    console.log("Copie o conteúdo do arquivo 'migration_v30_message_logs.sql' e");
    console.log("execute no editor SQL do Supabase (Supabase Dashboard > SQL Editor).");
    console.log("======================================================================\n");
    process.exit(1);
  } else {
    console.log("✅ Table public.message_logs exists and is ready!");
  }
}

checkAndApply();
