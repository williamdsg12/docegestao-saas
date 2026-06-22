const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function inspect() {
  console.log("Querying orders with code ending in B2A3 or phone...")
  const { data: orders, error: err1 } = await supabase
    .from('orders')
    .select(`
      *,
      customers (*)
    `)
    .limit(10)

  if (err1) {
    console.error("Error fetching orders:", err1)
  } else {
    console.log("Found orders count:", orders.length)
    const match = orders.find(o => o.id.includes('b2a3') || o.id.includes('B2A3') || (o.code && o.code.includes('B2A3')))
    if (match) {
      console.log("Matched Order:", JSON.stringify(match, null, 2))
    } else if (orders.length > 0) {
      console.log("First order example:", JSON.stringify(orders[0], null, 2))
    }
  }

  console.log("\nQuerying customers...")
  const { data: customers, error: err2 } = await supabase
    .from('customers')
    .select('*')
    .limit(5)

  if (err2) {
    console.error("Error fetching customers:", err2)
  } else {
    console.log("Found customers:", JSON.stringify(customers, null, 2))
  }
}

inspect()
