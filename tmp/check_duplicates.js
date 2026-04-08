const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkDuplicates() {
  console.log("Fetching all tenants to check slugs...")
  const { data: allTenants, error: allErr } = await supabase.from('tenants').select('id, slug, name, created_at')
  
  if (allErr) {
    console.error("Error fetching all tenants:", allErr)
    return
  }
  
  const counts = {}
  allTenants.forEach(t => {
    if (!counts[t.slug]) counts[t.slug] = []
    counts[t.slug].push(t)
  })
  
  const dups = Object.entries(counts).filter(([s, list]) => list.length > 1)
  
  if (dups.length === 0) {
    console.log("No duplicate slugs found. Maybe something else is calling .single() and return multiples?")
  } else {
    console.log("Duplicate slugs found:")
    dups.forEach(([slug, list]) => {
      console.log(`\nSlug: ${slug} (${list.length} occurrences)`)
      list.forEach(item => {
        console.log(` - ID: ${item.id}, Name: ${item.name}, Created: ${item.created_at}`)
      })
    })
  }
}

checkDuplicates()
