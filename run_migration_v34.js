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
  console.log("Checking database schema for public.campaign_queue and updated abandoned_carts...");
  
  // 1. Check if campaign_queue exists
  const { error: queueErr } = await supabase.from('campaign_queue').select('*').limit(1);
  const queueExists = !queueErr || !queueErr.message.includes('Could not find the table');

  // 2. Check if client_id exists in abandoned_carts
  const { error: cartErr } = await supabase.from('abandoned_carts').select('client_id', 'recovery_stage', 'last_activity').limit(1);
  const cartFieldsExist = !cartErr || !cartErr.message.includes('does not exist');

  console.log("queueExists:", queueExists, "queueErr:", queueErr ? queueErr.message : "None");
  console.log("cartFieldsExist:", cartFieldsExist, "cartErr:", cartErr ? cartErr.message : "None");

  if (!queueExists || !cartFieldsExist) {
    console.log("⚠️ Migration V34 is NOT fully applied.");
    if (!queueExists) console.log("- public.campaign_queue table is missing");
    if (!cartFieldsExist) console.log("- abandoned_carts columns (client_id, recovery_stage, last_activity) are missing");

    console.log("\n======================================================================");
    console.log("AÇÃO MANUAL REQUERIDA:");
    console.log("Copie o conteúdo do arquivo 'migration_v34_campaign_queue.sql' e");
    console.log("execute no editor SQL do Supabase (Supabase Dashboard > SQL Editor).");
    console.log("======================================================================\n");
    process.exit(1);
  } else {
    console.log("✅ Migration V34 (campaign_queue & updated abandoned_carts) is fully applied and active!");
  }
}

checkAndApply();
