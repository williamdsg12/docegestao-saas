const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
  const sql = fs.readFileSync('migration.sql', 'utf8');
  console.log('Attempting to run migration via execute_sql RPC...');
  
  // We'll split the SQL into individual commands if execute_sql exists
  // But since we know it likely doesn't, we'll inform the user clearly.
  const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });

  if (error) {
    console.error('Migration failed via RPC:', error.message);
    console.log('\n--- MANUAL ACTION REQUIRED ---');
    console.log('Please copy the content of migration.sql and paste it into the');
    console.log('Supabase SQL Editor (Dashboard > SQL Editor > New Query).');
    console.log('-------------------------------\n');
  } else {
    console.log('Migration completed successfully!');
  }
}

runMigration();
