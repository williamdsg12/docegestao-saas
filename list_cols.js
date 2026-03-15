
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function listColumns() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name_input: 'companies' })

  if (error) {
    // If RPC doesn't exist, try a generic query to get column names via postgrest if possible, 
    // or just fetch 1 row and check keys
    const { data: row, error: rowError } = await supabase
      .from('companies')
      .select('*')
      .limit(1)
      .single()
    
    if (rowError) {
      console.error('Error fetching row:', rowError)
    } else {
      console.log('Columns found in row:', Object.keys(row))
    }
  } else {
    console.log('Columns:', data)
  }
}

listColumns()
