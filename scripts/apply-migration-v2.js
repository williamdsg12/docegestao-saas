require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function runMigration() {
  const sqlPath = path.join(__dirname, 'migrate-subscription-v2.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Applying migration...');
  
  // Since we don't have a direct 'sql' method in the JS client, 
  // we would normally use an RPC or just run it via CLI.
  // However, I can try to use a trick: creating a temporary function and calling it.
  
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    if (error.message.includes('function "exec_sql" does not exist')) {
        console.error('Error: "exec_sql" RPC not found. You may need to run the SQL manually in the Supabase Dashboard SQL Editor.');
        console.log('\n--- SQL TO COPY ---\n');
        console.log(sql);
        console.log('\n--- END SQL ---\n');
    } else {
        console.error('Migration error:', error.message);
    }
  } else {
    console.log('Migration applied successfully!');
  }
}

runMigration();
