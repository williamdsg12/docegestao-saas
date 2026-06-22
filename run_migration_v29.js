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

const requiredTables = [
  'whatsapp_instances',
  'messages',
  'conversation_sessions',
  'whatsapp_logs',
  'whatsapp_message_queue',
  'marketing_campaigns',
  'abandoned_carts'
];

async function checkAndApply() {
  console.log("Checking database schema for WhatsApp Automation tables...");
  let missing = [];
  
  for (const table of requiredTables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error && error.message.includes('Could not find the table')) {
      missing.push(table);
    }
  }

  if (missing.length === 0) {
    console.log("✅ All required tables exist in the database!");
    return;
  }

  console.log(`⚠️ Missing tables detected: ${missing.join(', ')}`);
  console.log("\n======================================================================");
  console.log("AÇÃO MANUAL REQUERIDA:");
  console.log("Copie o conteúdo do arquivo 'migration_v29_whatsapp_automation.sql' e");
  console.log("execute no editor SQL do Supabase (Supabase Dashboard > SQL Editor).");
  console.log("======================================================================\n");
}

checkAndApply();
