const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE env vars (URL or SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  const sqlPath = path.join(__dirname, '../supabase/migrations/20260413_create_store_settings.sql');
  if (!fs.existsSync(sqlPath)) {
      console.error(`Migration file not found at: ${sqlPath}`);
      return;
  }
  
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log('🚀 Attempting to apply Store Settings migration...');
  
  // Try exec_sql (common in this env)
  let { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  // Fallback to execute_sql
  if (error) {
      console.log('Trying execute_sql instead...');
      const fallback = await supabase.rpc('execute_sql', { sql_query: sql });
      data = fallback.data;
      error = fallback.error;
  }

  if (error) {
    console.error('❌ Migration failed via RPC:', error.message);
    console.log('\n⚠️  MANUAL ACTION REQUIRED:');
    console.log('Please copy the content of:');
    console.log('supabase/migrations/20260413_create_store_settings.sql');
    console.log('\nAnd paste it into the Supabase SQL Editor in your Dashboard.');
    console.log('-------------------------------\n');
  } else {
    console.log('✅ Migration completed successfully! The "Cérebro da Loja" is ready.');
  }
}

runMigration();
