const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrdersTable() {
    console.log("Checking columns for 'orders'...");
    // Try to insert a dummy row or select to skip RPC if it's not and easy one
    const { data: selectData, error: selectError } = await supabase.from('orders').select('*').limit(1);
    
    if (selectError) {
        console.error("Select error on 'orders':", selectError.message);
    } else if (selectData && selectData.length > 0) {
        console.log("Columns in 'orders':", Object.keys(selectData[0]));
    } else {
        console.log("No data in 'orders'. Attempting to insert a blank row to see errors...");
        const { error: insertError } = await supabase.from('orders').insert({}).select();
        console.log("Insert result (checking error for column names):", insertError?.message);
    }
}

checkOrdersTable();
