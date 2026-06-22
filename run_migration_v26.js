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
    const sql = fs.readFileSync('migration_v26_orders_location_coords.sql', 'utf8');
    console.log("Attempting to apply Migration V26...");
    
    // Try execute_sql
    let { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });
    
    if (error && (error.message.includes('Could not find') || error.code === 'PGRST202')) {
        console.log("execute_sql not found, trying exec_sql...");
        const result = await supabase.rpc('exec_sql', { sql_query: sql });
        data = result.data;
        error = result.error;
    }

    if (error && (error.message.includes('Could not find') || error.code === 'PGRST202')) {
        console.log("exec_sql not found, trying run_sql...");
        const result = await supabase.rpc('run_sql', { sql_query: sql });
        data = result.data;
        error = result.error;
    }
    
    if (error) {
        console.error("Error applying SQL via RPC:", error.message);
        process.exit(1);
    } else {
        console.log("Migration V26 applied successfully!");
    }
}

applyMigration();
