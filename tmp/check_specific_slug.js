const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkSlug() {
  const slug = 'docesdowill'
  console.log(`Checking for slug: ${slug}`)
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
  
  if (error) {
    console.error("Error fetching slug:", error)
  } else {
    console.log("Tenant data:", data)
    if (data.length === 0) {
      console.log("NO TENANT FOUND WITH THIS SLUG.")
      // Check for partial match
      const { data: search } = await supabase.from('tenants').select('slug, name').ilike('slug', `%${slug}%`)
      console.log("Partial matches:", search)
    }
  }
}

checkSlug()
