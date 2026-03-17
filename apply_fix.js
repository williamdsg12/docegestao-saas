const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // MUST use service role for DDL

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars (URL or SERVICE_ROLE_KEY)");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFix() {
    const sql = fs.readFileSync('fix_final_schema_rls.sql', 'utf8');
    console.log("Applying final schema fix SQL...");
    
    // Using a custom RPC if available, or just executing via a workaround
    // Note: Supabase doesn't have a direct 'excute_sql' RPC by default for security.
    // However, in many of these environments, there is a 'exec_sql' or similar RPC.
    // If not, I will have to advise the user to run it in the SQL Editor.
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
        console.error("Error applying SQL via RPC:", error.message);
        console.log("\n--- SQL SCRIPT START ---");
        console.log(sql);
        console.log("--- SQL SCRIPT END ---\n");
        console.log("TIP: If the 'exec_sql' RPC does not exist, please copy the SQL above and run it in your Supabase SQL Editor.");
    } else {
        console.log("SQL applied successfully!");
    }
}

applyFix();
