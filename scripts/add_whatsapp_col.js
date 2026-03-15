const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function addWhatsappColumn() {
  console.log('Attempting to add whatsapp_number column...')
  const { data, error } = await supabase.rpc('execute_sql', { 
    sql_query: 'ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS whatsapp_number text;' 
  })

  if (error) {
    console.error('Error adding whatsapp_number column:', error)
  } else {
    console.log('Column whatsapp_number added (or already exists) to companies table.')
  }

  console.log('Attempting to add phone column if missing...')
  const { error: phoneError } = await supabase.rpc('execute_sql', { 
    sql_query: 'ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS phone text;' 
  })

  if (phoneError) {
    console.error('Error adding phone column:', phoneError)
  } else {
    console.log('Column phone ensured in companies table.')
  }
}

addWhatsappColumn()
