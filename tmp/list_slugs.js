const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function listSlugs() {
  console.log("Listing all tenants and their slugs...")
  const { data, error } = await supabase.from('tenants').select('id, name, slug')
  
  if (error) {
    console.error("Error fetching tenants:", error)
  } else {
    console.log("Tenants found:", data)
  }
}

listSlugs()
