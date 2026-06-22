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
    const sql = fs.readFileSync('migration_v16_fix_customer_constraints.sql', 'utf8');
    console.log("Applying Migration V16...");
    
    let { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });
    
    if (error && error.message.includes('Could not find')) {
        console.log("execute_sql not found, trying exec_sql...");
        const result = await supabase.rpc('exec_sql', { sql_query: sql });
        data = result.data;
        error = result.error;
    }
    
    if (error) {
        console.error("Error applying SQL via RPC:", error.message);
        console.log("TIP: If the RPCs do not exist, please copy the content of 'migration_v16_fix_customer_constraints.sql' and run it in your Supabase SQL Editor.");
    } else {
        console.log("Migration V16 applied successfully!");
    }
}

applyMigration();
