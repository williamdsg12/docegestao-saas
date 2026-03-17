const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  const sql = fs.readFileSync(path.join(__dirname, 'migration_v6_detailed_orders.sql'), 'utf8');
  
  console.log('Applying migration v6...');
  
  // Using the exec_sql RPC if it exists, otherwise we'll have to use a workaround
  // The user project seems to have been using it in apply_fix.js
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }

  console.log('Migration v6 applied successfully!');
}

applyMigration();
