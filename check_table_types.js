const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTypes() {
  const sql = `
    SELECT table_name, table_type 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('companies', 'empresas', 'tenants')
  `;
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
    console.error("RPC Error:", error.message);
    // fallback: try to detect via another way
  } else {
    console.table(data);
  }
}

checkTypes();
