const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'" 
  });
  
  if (error) {
    console.error("Error listing tables:", error.message);
  } else {
    console.log("Tables in database:");
    console.table(data);
  }
}

listTables();
