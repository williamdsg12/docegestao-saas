const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

async function applyRepair() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const fs = require('fs');
    const path = require('path');
    
    // First, let's create the 'exec_sql' RPC if it doesn't exist, using pg directly if needed.
    // Since we know DATABASE_URL is in .env, we can use psql via child_process.
    
    console.log("Applying inventory repair SQL...");
    const sqlPath = path.join(__dirname, '..', 'scripts', 'database', 'repair_inventory_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Attempting via psql command line if available
    const { execSync } = require('child_process');
    try {
        console.log("Attempting via psql...");
        execSync(`psql "${process.env.DATABASE_URL}" -f "${sqlPath}"`);
        console.log("Success via psql!");
    } catch (e) {
        console.warn("psql failed, trying via node-postgres if possible...");
        // If psql fails, we could try pg, but we know it's not installed.
        // So we'll try to use a simple RPC if we can.
        console.error("Please run the script scripts/database/repair_inventory_tables.sql in Supabase SQL Editor.");
        process.exit(1);
    }
}

applyRepair();
