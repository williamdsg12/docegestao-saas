const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkClients() {
  const { data, error } = await supabase.from('clients').select('id, name, phone').limit(1)
  if (error) {
    console.error('Error fetching clients:', error.message)
    const { data: customers, error: customerError } = await supabase.from('customers').select('id, name, phone').limit(1)
    if (customerError) console.error('Error fetching customers:', customerError.message)
    else console.log('Found customers instead:', customers)
  } else {
    console.log('Found clients:', data)
  }
}

checkClients()
