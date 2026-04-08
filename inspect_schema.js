const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function inspectSchema() {
  console.log('--- ORDERS ---')
  const { data: order, error: orderError } = await supabase.from('orders').select('*').limit(1).single()
  if (orderError) console.error(orderError)
  else console.log(Object.keys(order))

  console.log('\n--- CLIENTS ---')
  const { data: client, error: clientError } = await supabase.from('clients').select('*').limit(1).single()
  if (clientError) {
      console.log('Table "clients" not found, trying "customers"...')
      const { data: customer, error: customerError } = await supabase.from('customers').select('*').limit(1).single()
      if (customerError) console.error(customerError)
      else console.log(Object.keys(customer))
  }
  else console.log(Object.keys(client))
}

inspectSchema()
