const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Checking columns for 'pedidos'...");
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'pedidos' });
    
    if (error) {
        // Fallback: try to select one row to see columns
        console.warn("RPC 'get_table_columns' failed, trying select * limit 1...");
        const { data: selectData, error: selectError } = await supabase.from('pedidos').select('*').limit(1);
        if (selectError) {
            console.error("Select error:", selectError.message);
        } else if (selectData && selectData.length > 0) {
            console.log("Columns found:", Object.keys(selectData[0]));
        } else {
            console.log("No data in 'pedidos' to infer columns.");
        }
    } else {
        console.log("Columns from RPC:", data);
    }
}

checkSchema();
