const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkPosition() {
  console.log("Checking columns for 'products'...")
  const { data: cols, error } = await supabase.rpc('exec_sql', {
    sql_query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'products'"
  })
  
  if (error) {
    // Fallback: try to fetch 1 row and check keys
    const { data: p } = await supabase.from('products').select('*').limit(1)
    if (p && p.length > 0) {
        console.log("Keys in products:", Object.keys(p[0]))
    } else {
        console.log("No products found to check keys.")
    }
  } else {
    console.log("Columns in products:", cols.map(c => c.column_name))
  }
}

checkPosition()
