
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function addPhoneColumn() {
  const { data, error } = await supabase.rpc('execute_sql', { 
    sql_query: 'ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS phone text;' 
  })

  if (error) {
    console.error('Error adding column:', error)
    // If execute_sql is not available, try to just run it via another way or inform user
  } else {
    console.log('Column phone added (or already exists) to companies table.')
  }
}

addPhoneColumn()
