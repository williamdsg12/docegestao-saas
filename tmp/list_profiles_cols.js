const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function listProfileColumns() {
  const { data: row, error: rowError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
    .single()
  
  if (rowError) {
    console.error('Error fetching row from profiles:', rowError)
    // If table is empty, we try another way
    const { data: check, error: checkError } = await supabase.rpc('get_table_columns_v2', { t_name: 'profiles' }).catch(() => ({error: 'no rpc'}));
    console.log('RPC check:', checkError);
  } else {
    console.log('Columns found in profiles:', Object.keys(row))
  }
}

listProfileColumns()
