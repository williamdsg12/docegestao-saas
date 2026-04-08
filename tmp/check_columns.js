const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function diagnostic() {
  console.log("--- Products Diagnostic ---")
  const { data: prod, error: prodErr } = await supabase.from('products').select('*').limit(1)
  if (prodErr) console.error("Error fetching product:", prodErr)
  else console.log("Product fields:", prod && prod.length > 0 ? Object.keys(prod[0]) : "No records found")

  console.log("\n--- Product Categories Diagnostic ---")
  const { data: cat, error: catErr } = await supabase.from('product_categories').select('*').limit(1)
  if (catErr) console.error("Error fetching category:", catErr)
  else console.log("Category fields:", cat && cat.length > 0 ? Object.keys(cat[0]) : "No records found")

  console.log("\n--- Orders Diagnostic ---")
  const { data: ord, error: ordErr } = await supabase.from('orders').select('*').limit(1)
  if (ordErr) console.error("Error fetching order:", ordErr)
  else console.log("Order fields:", ord && ord.length > 0 ? Object.keys(ord[0]) : "No records found")

  console.log("\n--- Order Items Diagnostic ---")
  const { data: items, error: itemsErr } = await supabase.from('order_items').select('*').limit(1)
  if (itemsErr) console.error("Error fetching order_items:", itemsErr)
  else console.log("Order Item fields:", items && items.length > 0 ? Object.keys(items[0]) : "No records found")
}

diagnostic()
