const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars (URL or SERVICE_ROLE_KEY)");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    const sql = fs.readFileSync('migration_v17_standardize_addresses.sql', 'utf8');
    console.log("Applying Migration V17...");
    
    // Fallback to manual if RPC fails
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
        console.error("Error applying SQL via RPC:", error.message);
        console.log("TIP: Please copy the content of 'migration_v17_standardize_addresses.sql' and run it in your Supabase SQL Editor.");
    } else {
        console.log("Migration V17 applied successfully!");
    }
}

applyMigration();
