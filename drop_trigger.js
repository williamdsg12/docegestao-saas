
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function dropTrigger() {
  console.log('Attempting to drop trigger tr_update_custo_unitario...')
  
  // Since we can't run raw SQL directly through the standard JS client easily,
  // we try to use an RPC if it exists, or we might just have to hope the user
  // can run it in their console. However, I should try to find if there's a 'exec_sql' RPC.
  
  const sql = `
    DROP TRIGGER IF EXISTS tr_update_custo_unitario ON public.ingredientes;
    DROP FUNCTION IF EXISTS public.fn_update_custo_unitario();
  `;
  
  // Checking for common rpc names for SQL execution
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error('Error via exec_sql rpc:', error.message);
    console.log('Trying alternative rpc name...');
    const { data: data2, error: error2 } = await supabase.rpc('run_sql', { sql: sql });
    if (error2) {
      console.error('Error via run_sql rpc:', error2.message);
      console.log('Please run the following SQL manually in the Supabase SQL Editor:');
      console.log(sql);
    } else {
      console.log('Trigger dropped successfully via run_sql.');
    }
  } else {
    console.log('Trigger dropped successfully via exec_sql.');
  }
}

dropTrigger()
