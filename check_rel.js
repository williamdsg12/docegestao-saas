const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkRel() {
  const { data: order } = await supabase.from('orders').select('cliente_id, customer_id').limit(1).single()
  console.log('Order IDs:', order)
  
  if (order.customer_id) {
    const { data: customer } = await supabase.from('customers').select('name').eq('id', order.customer_id).single()
    console.log('Customer name by customer_id:', customer?.name)
  }
  
  if (order.cliente_id) {
     const { data: customerByCliente } = await supabase.from('customers').select('name').eq('id', order.cliente_id).single()
     console.log('Customer name by cliente_id:', customerByCliente?.name)
  }
}

checkRel()
