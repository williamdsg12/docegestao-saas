const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectTables() {
  const tablesToInspect = ['profiles', 'tenants', 'companies', 'clientes', 'clients'];
  
  for (const table of tablesToInspect) {
    try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`Table '${table}' error:`, error.message);
        } else {
            const columns = data.length > 0 ? Object.keys(data[0]) : 'Empty table (no columns visible via select *)';
            console.log(`Table '${table}' columns:`, columns);
            
            // If empty, try to get at least one column list from a dummy insert/select if it's safe
            if (data.length === 0) {
                 const { data: cols, error: colErr } = await supabase.from(table).select('*').limit(0);
                 // Unfortunately select * limit 0 doesn't give keys in JS driver if empty
            }
        }
    } catch (e) {
        console.log(`Table '${table}' exception:`, e.message);
    }
  }
}

inspectTables();
