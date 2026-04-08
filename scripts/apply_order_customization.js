const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  const filePath = path.join(__dirname, '../supabase/migrations/20260406_order_customization.sql');
  
  if (!fs.existsSync(filePath)) {
    console.error(`Migration file not found at: ${filePath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(filePath, 'utf8');
  console.log("Applying Order Customization Migration...");
  console.log("Executing SQL:");
  console.log(sql);

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error("Error applying migration via RPC:", error.message);
    process.exit(1);
  } else {
    console.log("Migration applied successfully!");
  }
}

applyMigration();
