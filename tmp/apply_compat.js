require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyCompatibilityLayer() {
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, '..', 'scripts', 'database', 'saas_compatibility_layer.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log("Applying compatibility layer update...");
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
        // Fallback if rpc('exec_sql') doesn't exist
        console.warn("RPC exec_sql failed or not found. Using direct query if possible (not possible with pure client).");
        console.error("Error:", error);
        
        // Let's try to run it via psql if we can guess the connection string or just notify.
        console.log("Please run the SQL manually in Supabase SQL Editor if this script fails.");
    } else {
        console.log("Success!");
    }
}

applyCompatibilityLayer();
