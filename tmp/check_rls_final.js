const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkRLS() {
  console.log("Checking RLS for products and product_categories...")
  const { data: policies, error } = await supabase.rpc('exec_sql', {
    sql_query: "SELECT tablename, policyname, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('products', 'product_categories')"
  })
  
  if (error) {
    // Fallback if exec_sql is missing (again?)
    console.error("Error fetching RLS via RPC:", error)
    // I already know create_exec_sql.js failed earlier, so I should solve this.
  } else {
    console.log("Policies:", policies)
  }
}

checkRLS()
