const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function getProfileColumns() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name_input: 'profiles' })
  
  if (error) {
    console.warn("RPC failed, trying raw query on information_schema...");
    // Since I'm using service_role_key, I might be able to query information_schema if enabled,
    // but usually Postgrest doesn't allow it. 
    // Let's try fetching a dummy row.
    const { data: row, error: rowError } = await supabase
        .from('profiles')
        .select('*')
        .limit(0) // Just get header
    
    if (rowError) {
        console.error('Final attempt failed:', rowError)
    } else {
        // If data is an array, we need to check the metadata or a row if it exists
        console.log('Columns from select * limit 0:', row)
    }
  } else {
    console.log('Columns from RPC:', data)
  }

  // Also try listing ALL tables to see if I'm even in the right database
  const { data: tables, error: tableError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
  
  if (tableError) {
    console.error('Error selecting id from profiles:', tableError)
  } else {
    console.log('Profiles table exists and is accessible. Rows found:', tables.length)
  }
}

getProfileColumns()
